import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { unpackSyntheticRelease } from "./unpack-synthetic-1000.mjs";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await unpackSyntheticRelease();
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, "index.html"), resolve(dist, "index.html"));
await cp(resolve(root, "src"), resolve(dist, "src"), { recursive: true });
await cp(resolve(root, "reviewers"), resolve(dist, "reviewers"), { recursive: true });
await cp(resolve(root, "arguments"), resolve(dist, "arguments"), { recursive: true });

console.log(`Static build written to ${dist}`);
