import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { gunzipSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, "index.html"), resolve(dist, "index.html"));
await cp(resolve(root, "src"), resolve(dist, "src"), { recursive: true });
await cp(resolve(root, "reviewers"), resolve(dist, "reviewers"), { recursive: true });

const payloadDirectory = resolve(root, "release-payload", "argument-library");
const chunkNames = (await readdir(payloadDirectory))
  .filter((name) => /^chunk-\d+\.txt$/.test(name))
  .sort();

if (!chunkNames.length) throw new Error("Argument-library release payload is missing");

const encoded = (
  await Promise.all(chunkNames.map((name) => readFile(resolve(payloadDirectory, name), "utf8")))
).join("");
const payload = JSON.parse(gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"));
const distPrefix = `${dist}${sep}`;

for (const [relativePath, content] of Object.entries(payload)) {
  const destination = resolve(dist, relativePath);
  if (destination !== dist && !destination.startsWith(distPrefix)) {
    throw new Error(`Unsafe release payload path: ${relativePath}`);
  }
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content, "utf8");
}

console.log(`Static build written to ${dist} with ${Object.keys(payload).length} argument-library files`);
