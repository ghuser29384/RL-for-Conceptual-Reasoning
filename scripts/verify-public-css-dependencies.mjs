import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const INDEX_STYLESHEET_PATTERN = /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']\/src\/([^"'?#]+\.css)(?:\?[^"']*)?["'][^>]*>/giu;
const CSS_IMPORT_PATTERN = /@import\s+(?:url\(\s*)?["'](?:\.\/)?([^"')?#]+\.css)(?:\?[^"')]+)?["']\s*\)?\s*;/giu;
const PUBLIC_ALLOWLIST_PATTERN = /const\s+publicSrcFiles\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/u;

export function validatePublicCssDependencyGraph({ indexHtml, buildScript, cssByName }) {
  const errors = [];
  const allowlistMatch = String(buildScript ?? "").match(PUBLIC_ALLOWLIST_PATTERN);
  const allowlistedFiles = new Set(
    [...(allowlistMatch?.[1] ?? "").matchAll(/["']([^"']+)["']/gu)].map((match) => match[1]),
  );
  if (!allowlistMatch) errors.push("Static build must expose a parseable publicSrcFiles allowlist.");

  const cssMap = cssByName instanceof Map ? cssByName : new Map(Object.entries(cssByName ?? {}));
  const roots = [...String(indexHtml ?? "").matchAll(INDEX_STYLESHEET_PATTERN)].map((match) => match[1]);
  if (!roots.length) errors.push("index.html must load at least one local public stylesheet.");

  const visited = new Set();
  const queue = [...roots];
  while (queue.length) {
    const name = queue.shift();
    if (!name || visited.has(name)) continue;
    visited.add(name);

    if (!allowlistedFiles.has(name)) errors.push(`Public stylesheet ${name} is not in publicSrcFiles.`);
    const css = cssMap.get(name);
    if (typeof css !== "string") {
      errors.push(`Public stylesheet dependency ${name} does not exist in src.`);
      continue;
    }

    for (const match of css.matchAll(CSS_IMPORT_PATTERN)) {
      const imported = match[1];
      if (!visited.has(imported)) queue.push(imported);
    }
  }

  const mobileCss = cssMap.get("mobile-navigation.css") ?? "";
  for (const marker of [
    ".mpNavigation.isOpen",
    "visibility: hidden",
    "visibility: visible",
    "pointer-events: none",
    "pointer-events: auto",
  ]) {
    if (!mobileCss.includes(marker)) errors.push(`mobile-navigation.css must contain ${marker}.`);
  }

  if (allowlistedFiles.has("app.mjs")) errors.push("Internal app.mjs must never enter the public source allowlist.");

  return {
    status: errors.length ? "fail" : "pass",
    root_stylesheets: roots.length,
    resolved_local_stylesheets: visited.size,
    mobile_navigation_fail_closed: errors.every((error) => !error.startsWith("mobile-navigation.css")),
    internal_workspace_excluded: !allowlistedFiles.has("app.mjs"),
    errors,
  };
}

export async function readAndValidatePublicCssDependencyGraph(root = resolve(import.meta.dirname, "..")) {
  const src = resolve(root, "src");
  const [indexHtml, buildScript, srcEntries] = await Promise.all([
    readFile(resolve(root, "index.html"), "utf8"),
    readFile(resolve(root, "scripts/build-static.mjs"), "utf8"),
    readdir(src, { withFileTypes: true }),
  ]);
  const cssNames = srcEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
    .map((entry) => entry.name);
  const cssByName = new Map(
    await Promise.all(cssNames.map(async (name) => [name, await readFile(resolve(src, name), "utf8")])),
  );
  return validatePublicCssDependencyGraph({ indexHtml, buildScript, cssByName });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = await readAndValidatePublicCssDependencyGraph();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
