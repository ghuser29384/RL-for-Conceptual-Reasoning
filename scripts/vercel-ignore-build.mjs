#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const allowedBranches = new Set(["main", "release/vercel-preview"]);
const branch = String(process.env.VERCEL_GIT_COMMIT_REF ?? "").trim();

if (branch && !allowedBranches.has(branch)) {
  console.log(JSON.stringify({ skip: true, reason: `unapproved branch: ${branch}` }));
  process.exit(0);
}

try {
  const previous = String(process.env.VERCEL_GIT_PREVIOUS_SHA ?? "").trim();
  const current = String(process.env.VERCEL_GIT_COMMIT_SHA ?? "").trim();
  if (!/^[0-9a-f]{40}$/iu.test(previous) || !/^[0-9a-f]{40}$/iu.test(current) || /^0{40}$/u.test(previous)) {
    throw new Error("missing or invalid deployment SHAs");
  }
  const output = execFileSync("git", ["diff", "--name-only", previous, current, "--"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  const files = output ? output.split(/\r?\n/u).filter(Boolean) : [];
  const repositoryOnly = (path) =>
    [".github/", "docs/", "e2e/", "ops/", "test/"].some((prefix) => path.startsWith(prefix)) ||
    [".gitattributes", ".gitignore", "LICENSE", "LICENSE.md", "README", "README.md"].includes(path);
  const skip = files.length === 0 || files.every(repositoryOnly);
  console.log(JSON.stringify({ skip, files }));
  process.exit(skip ? 0 : 1);
} catch (error) {
  console.error(JSON.stringify({ skip: false, reason: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
