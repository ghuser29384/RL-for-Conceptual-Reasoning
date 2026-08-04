#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ALLOWED_VERCEL_BRANCHES = Object.freeze([
  "release/vercel-preview",
]);

const NON_RUNTIME_PREFIXES = Object.freeze([
  ".github/",
  "docs/",
  "e2e/",
  "ops/",
  "test/",
]);

const NON_RUNTIME_ROOT_FILES = new Set([
  ".gitattributes",
  ".gitignore",
  "LICENSE",
  "LICENSE.md",
  "README",
  "README.md",
]);

function normalizePath(value) {
  return String(value ?? "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\//u, "");
}

export function isKnownNonRuntimePath(value) {
  const path = normalizePath(value);
  if (!path) return false;
  if (NON_RUNTIME_ROOT_FILES.has(path)) return true;
  return NON_RUNTIME_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function classifyVercelBuild({ branch, changedFiles }) {
  const normalizedBranch = String(branch ?? "").trim();
  const files = [...new Set((changedFiles ?? []).map(normalizePath).filter(Boolean))];

  if (
    normalizedBranch &&
    !ALLOWED_VERCEL_BRANCHES.includes(normalizedBranch)
  ) {
    return {
      skip: true,
      reason: `branch ${normalizedBranch} is not an approved Vercel release branch`,
      changedFiles: files,
    };
  }

  if (files.length === 0) {
    return {
      skip: true,
      reason: "no changed files were detected",
      changedFiles: files,
    };
  }

  const runtimeFiles = files.filter((path) => !isKnownNonRuntimePath(path));
  if (runtimeFiles.length > 0) {
    return {
      skip: false,
      reason: "at least one runtime or build-relevant path changed",
      changedFiles: files,
      runtimeFiles,
    };
  }

  return {
    skip: true,
    reason: "all changed files are repository-only QA, operations, or documentation paths",
    changedFiles: files,
  };
}

function git(...args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function changedFilesFromGit({ previousSha, currentSha }) {
  const previous = String(previousSha ?? "").trim();
  const current = String(currentSha ?? "").trim();
  if (!/^[0-9a-f]{40}$/iu.test(previous)) {
    throw new Error("VERCEL_GIT_PREVIOUS_SHA is missing or invalid.");
  }
  if (!/^[0-9a-f]{40}$/iu.test(current)) {
    throw new Error("VERCEL_GIT_COMMIT_SHA is missing or invalid.");
  }
  if (/^0{40}$/u.test(previous)) {
    throw new Error("The previous deployment SHA is the all-zero sentinel.");
  }

  const output = git("diff", "--name-only", previous, current, "--");
  return output ? output.split(/\r?\n/u).filter(Boolean) : [];
}

export function evaluateCurrentVercelBuild(env = process.env) {
  const branch = env.VERCEL_GIT_COMMIT_REF ?? "";
  const currentSha = env.VERCEL_GIT_COMMIT_SHA ?? "";
  const previousSha = env.VERCEL_GIT_PREVIOUS_SHA ?? "";

  if (branch && !ALLOWED_VERCEL_BRANCHES.includes(branch)) {
    return classifyVercelBuild({ branch, changedFiles: [] });
  }

  const changedFiles = changedFilesFromGit({ previousSha, currentSha });
  return classifyVercelBuild({ branch, changedFiles });
}

function isMainModule() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}

if (isMainModule()) {
  try {
    const result = evaluateCurrentVercelBuild();
    console.log(JSON.stringify(result));
    process.exitCode = result.skip ? 0 : 1;
  } catch (error) {
    // Vercel treats exit 0 as "skip" and exit 1 as "build". Any uncertainty
    // on the one approved Preview branch must preserve the release rather than
    // suppress it.
    console.error(
      JSON.stringify({
        skip: false,
        reason: "ignored-build evaluation failed; building conservatively",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exitCode = 1;
  }
}
