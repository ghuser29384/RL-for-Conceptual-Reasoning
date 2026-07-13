#!/usr/bin/env python3
"""Detect the latest RLHF Conceptual Reasoning*.md file in local search roots.

This helper does not access ChatGPT directly. It scans the filesystem locations
available to Codex and returns the highest numeric version it can find.
It accepts both space-separated and URL-encoded filenames, e.g.:
  RLHF Conceptual Reasoning91.md
  RLHF%20Conceptual%20Reasoning91.md
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import sys
from typing import Iterable

PATTERN = re.compile(r"^RLHF(?: |%20)Conceptual(?: |%20)Reasoning(\d+)\.md$", re.IGNORECASE)


def default_roots() -> list[pathlib.Path]:
    roots: list[pathlib.Path] = []
    candidates = [
        pathlib.Path.cwd(),
        pathlib.Path.home() / "Downloads",
        pathlib.Path("/mnt/data"),
    ]
    for root in candidates:
        try:
            resolved = root.expanduser().resolve()
        except Exception:
            continue
        if resolved.exists() and resolved.is_dir() and resolved not in roots:
            roots.append(resolved)
    return roots


def iter_files(roots: Iterable[pathlib.Path], recursive: bool) -> Iterable[pathlib.Path]:
    for root in roots:
        if not root.exists() or not root.is_dir():
            continue
        try:
            if recursive:
                yield from (p for p in root.rglob("*.md") if p.is_file())
            else:
                yield from (p for p in root.glob("*.md") if p.is_file())
        except PermissionError:
            continue


def detect(roots: list[pathlib.Path], recursive: bool) -> dict:
    matches: list[dict] = []
    for path in iter_files(roots, recursive=recursive):
        match = PATTERN.match(path.name)
        if not match:
            continue
        version = int(match.group(1))
        try:
            stat = path.stat()
            mtime = stat.st_mtime
            size = stat.st_size
        except OSError:
            mtime = None
            size = None
        matches.append({
            "version": version,
            "path": str(path),
            "filename": path.name,
            "mtime": mtime,
            "size": size,
        })

    matches.sort(key=lambda x: (x["version"], x["mtime"] or 0, x["path"]), reverse=True)
    if not matches:
        return {
            "found": False,
            "version": None,
            "path": None,
            "filename": None,
            "next_version": None,
            "next_filename": None,
            "matches": [],
            "searched_roots": [str(r) for r in roots],
        }
    latest = matches[0]
    version = latest["version"]
    return {
        "found": True,
        "version": version,
        "path": latest["path"],
        "filename": latest["filename"],
        "next_version": version + 1,
        "next_filename": f"RLHF Conceptual Reasoning{version + 1}.md",
        "matches": matches,
        "searched_roots": [str(r) for r in roots],
    }


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Detect latest RLHF Conceptual Reasoning*.md version")
    parser.add_argument("roots", nargs="*", help="Directories to scan. Defaults to cwd, ~/Downloads, and /mnt/data if present.")
    parser.add_argument("--recursive", action="store_true", help="Scan recursively under each root.")
    parser.add_argument("--plain", action="store_true", help="Print only the latest version number, or nothing if not found.")
    args = parser.parse_args(argv)

    roots = [pathlib.Path(r).expanduser().resolve() for r in args.roots] if args.roots else default_roots()
    result = detect(roots, recursive=args.recursive)
    if args.plain:
        if result["found"]:
            print(result["version"])
            return 0
        return 1
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["found"] else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
