#!/usr/bin/env python3
"""Render Metaphilosophy R&D loop prompts for a given RLHF Conceptual Reasoning version.

This helper is intentionally simple. It does not automate Chrome or ChatGPT.
It prints exact prompts to paste when browser automation is unavailable.
"""
from __future__ import annotations

import argparse
import pathlib
import re
import sys

from detect_latest_version import default_roots, detect

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROMPTS = ROOT / "references" / "prompts.md"

SECTIONS = {
    "discovery": "A. Discovery pass",
    "adversarial": "B. Adversarial review pass",
    "decision": "C. Decision/edit pass",
    "pruning": "D. Pruning-only pass",
    "reset": "F. Path-dependency reset",
}


def extract_section(text: str, title_prefix: str) -> str:
    pattern = re.compile(rf"^## {re.escape(title_prefix)}.*$", re.MULTILINE)
    match = pattern.search(text)
    if not match:
        raise SystemExit(f"Could not find section starting with: {title_prefix!r}")
    start = match.end()
    next_match = re.search(r"^## ", text[start:], re.MULTILINE)
    end = start + next_match.start() if next_match else len(text)
    return text[start:end].strip()


def render(section: str, version: int) -> str:
    text = PROMPTS.read_text(encoding="utf-8")
    body = extract_section(text, SECTIONS[section])
    body = body.replace("RLHF Conceptual Reasoningv+1.md", f"RLHF Conceptual Reasoning{version + 1}.md")
    body = body.replace("RLHF Conceptual Reasoningv.md", f"RLHF Conceptual Reasoning{version}.md")
    return body


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("section", choices=sorted(SECTIONS))
    parser.add_argument("version", type=int, nargs="?", help="Current numeric RLHF version. Omit with --latest to auto-detect.")
    parser.add_argument("--latest", action="store_true", help="Auto-detect the latest local RLHF Conceptual Reasoning*.md version.")
    parser.add_argument("--root", action="append", default=None, help="Extra directory root for --latest detection. Can be supplied multiple times.")
    parser.add_argument("--recursive", action="store_true", help="Use recursive scan for --latest detection.")
    args = parser.parse_args(argv)
    version = args.version
    if args.latest:
        roots = [pathlib.Path(r).expanduser().resolve() for r in args.root] if args.root else default_roots()
        result = detect(roots, recursive=args.recursive)
        if not result["found"]:
            raise SystemExit("No RLHF Conceptual Reasoning*.md file found. Supply VERSION explicitly.")
        version = int(result["version"])
    if version is None:
        raise SystemExit("Supply VERSION or use --latest.")
    print(render(args.section, version))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
