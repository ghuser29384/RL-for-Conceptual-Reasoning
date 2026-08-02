import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { unpackSyntheticRelease } from "./unpack-synthetic-1000.mjs";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const publicSrcFiles = Object.freeze([
  "site-entry.mjs",
  "workspace-gate.mjs",
  "exact-reference-home.mjs",
  "wordmark-system.mjs",
  "styles.css",
  "brand-system.css",
  "epoch-system.css",
  "epoch-core.css",
  "epoch-platform.css",
  "epoch-impact.css",
  "epoch-workspace.css",
  "epoch-responsive.css",
  "wordmark-system.css",
  "exact-reference.css",
  "trust-home.css",
  "mobile-navigation.css",
]);

// Public LMCA links resolve to the paper's canonical arXiv record; no private or attached PDF is copied.
await unpackSyntheticRelease();
await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "src"), { recursive: true });
await cp(resolve(root, "index.html"), resolve(dist, "index.html"));
for (const file of publicSrcFiles) {
  await cp(resolve(root, "src", file), resolve(dist, "src", file));
}
await cp(resolve(root, "reviewers"), resolve(dist, "reviewers"), { recursive: true });
await cp(resolve(root, "arguments"), resolve(dist, "arguments"), { recursive: true });
await cp(resolve(root, "research"), resolve(dist, "research"), { recursive: true });

console.log(`Static public build written to ${dist}; ${publicSrcFiles.length} allowlisted source files copied.`);
