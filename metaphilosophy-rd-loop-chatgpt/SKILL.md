---
name: metaphilosophy-rd-loop-chatgpt
description: Run the Metaphilosophy R&D improvement loop by driving the current ChatGPT chat in Chrome when browser/app automation is available; otherwise produce exact manual prompts and file-handling instructions. Use for RLHF Conceptual Reasoningv.md iterative discovery, adversarial review, decision/edit, pruning, and periodic path-dependency reset cycles.
---

# Metaphilosophy R&D Loop in ChatGPT

## Purpose

Use this skill when the user asks Codex to run the Metaphilosophy R&D improvement loop in an existing ChatGPT conversation, using files named like `RLHF Conceptual Reasoning90.md`, `RLHF Conceptual Reasoning91.md`, etc.

The loop is designed to find real, potentially out-of-distribution improvements to Metaphilosophy while avoiding local hill-climbing, path dependency, runaway spec growth, hidden metadata leakage, and degradation of the core measurement regime.

## Capability boundary

This skill is a workflow instruction package. It does not grant browser control by itself.

Before trying to control Chrome or ChatGPT, inspect the current Codex environment:

1. Check whether a browser/app automation capability is available, such as a configured browser tool, app integration, MCP tool, or Codex app capability that can interact with the current Chrome window.
2. If no such capability is available, do **not** claim to have run the loop in ChatGPT. Instead, output the exact next prompt(s) for the user to paste manually, plus file-upload/download instructions.
3. Do not request, store, paste, or automate passwords, session cookies, API keys, or access tokens.
4. Use only the user’s already signed-in ChatGPT session if browser automation is available.
5. Do not bypass user confirmations, browser security prompts, file-upload prompts, or download prompts.
6. Do not run an unbounded infinite loop. Default to one full cycle unless the user explicitly specifies a cycle count. For more than one cycle, summarize the planned number of ChatGPT submissions and ask for confirmation.

## Core invariants

Preserve these invariants in every run:

- Treat the current `RLHF Conceptual Reasoningv.md` as one historical design proposal, not the default solution.
- Preserve source blinding, exposure/conflict handling, split governance, label-snapshot immutability, benchmark protection, and auditability.
- Do not add ordinary user/rater fields unless clearly justified.
- Do not expose hidden/admin metadata to ordinary or validation raters.
- Do not let AI-generated, user-submitted, or source-derived material enter live rating without review and promotion.
- Prefer reuse, deletion, consolidation, and R&D experiments over new product requirements.
- Direct edits require the thresholds stated in the decision/edit prompt.
- If no edit passes threshold, the main spec must not be modified.

## Required inputs

Ask for any missing input before running:

- `current_version`: integer `v` in `RLHF Conceptual Reasoningv.md`. Detect this automatically when possible; ask only if detection fails or is ambiguous.
- `chat_target`: whether the user wants to run in the current ChatGPT chat in Chrome, another ChatGPT thread, or local/manual mode.
- `cycle_count`: number of normal cycles to run. Default: 1.
- `reset_policy`: default is run a path-dependency reset after every 4 successful version increments.

Before asking the user for `current_version`, run `scripts/detect_latest_version.py` over the current workspace, Downloads folder, and any user-specified file directory. It accepts both `RLHF Conceptual Reasoning91.md` and URL-encoded names such as `RLHF%20Conceptual%20Reasoning91.md`. Use the highest numeric version found. If multiple files share the same highest version, prefer the newest modified file but report the candidates and confirm before running. If browser automation is available and the local filesystem does not contain the latest file, inspect the current ChatGPT chat/downloads for the newest attachment/download whose filename matches the same pattern.

## Version handling

Detect the latest version at the start of every run and again after every file download. Maintain a local run ledger with:

- detected latest local filename and path;
- current input filename;
- current version number;
- whether the discovery pass completed;
- whether the adversarial review completed;
- whether the decision/edit pass produced a revised file;
- whether the pruning pass produced a revised file;
- downloaded output files;
- manual user actions required;
- reset count.

Version update rule:

- If ChatGPT outputs `RLHF Conceptual Reasoningv+1.md`, download it, rerun `scripts/detect_latest_version.py`, and set `current_version` to the highest detected numeric version if it matches or exceeds the expected next version.
- If the decision/edit pass or pruning pass makes no edit, keep `current_version = v`.
- If a pruning pass follows an edit pass, run it on the latest available file, not the stale pre-edit file.
- Every 4 successful version increments, run the path-dependency reset on the latest file before continuing to the next ordinary cycle.

## Browser/ChatGPT interaction rules

If browser automation is available:

1. Run `scripts/detect_latest_version.py` locally to detect the latest available `RLHF Conceptual Reasoning*.md` file.
2. Locate the current ChatGPT chat in Chrome.
3. Confirm that the chat contains or can access the detected latest `RLHF Conceptual Reasoningv.md` file.
4. If the latest file is not already attached in the chat, upload it.
5. Paste the prompt for the current pass exactly, replacing `v` and `v+1` with the detected current numeric version and next numeric version.
6. Submit the prompt.
7. Wait for the assistant response to finish.
8. Save the response text to the local ledger.
9. When a revised file is generated, download it, rerun latest-version detection, and verify that the filename/version matches the expected next version.
10. If ChatGPT does not generate a revised file when expected, record that no file was produced and continue according to the pass logic.
11. Before the decision/edit pass and pruning pass, rerun latest-version detection and ensure the latest current file is attached/uploaded or referenced in the current chat.

If browser automation cannot upload or download files, stop and ask the user to upload/download the file manually. Use latest-version detection for any local files and provide the exact prompt to paste and the exact filename to upload.

## Normal cycle

Each normal cycle consists of four passes:

1. Discovery pass: no edit.
2. Adversarial review pass: no edit; uses the previous discovery output in the same chat.
3. Decision/edit pass: may edit the main spec and output `RLHF Conceptual Reasoningv+1.md`; may update decision/backlog logs.
4. Pruning-only pass: may edit the latest spec and output the next version; may update the decision log.

After the pruning pass, if the user requested another cycle, repeat from discovery using the latest current version.

## Path-dependency reset

Every 4 successful version increments, run the path-dependency reset prompt on the latest file.

The reset is in addition to normal cycles. It starts as no-edit analysis, but may edit if it finds a deletion, consolidation, or architectural refactor above the stated threshold. If it creates a revised file, download it and update the current version.

## Latest-version detection

Use `scripts/detect_latest_version.py` before rendering prompts. Examples:

```bash
python scripts/detect_latest_version.py
python scripts/detect_latest_version.py --recursive . ~/Downloads
python scripts/detect_latest_version.py --plain
```

The JSON output includes `version`, `path`, `filename`, `next_version`, `next_filename`, all matches, and searched roots. If no file is found, ask the user to provide or upload the latest file. If the user explicitly supplies a version, compare it against detected files and warn if the supplied version is older than the highest detected version.

## Prompt source

Use `references/prompts.md` as the canonical prompt source. Do not paraphrase it unless the user asks you to update the skill.

When substituting version placeholders:

- Replace `RLHF Conceptual Reasoningv.md` with `RLHF Conceptual Reasoning{current_version}.md`.
- Replace `RLHF Conceptual Reasoningv+1.md` with `RLHF Conceptual Reasoning{current_version + 1}.md`.
- Preserve all threshold language, invariant language, and no-edit/edit distinctions.

## Fallback local/manual mode

If browser automation is unavailable, do not fail silently. Output:

1. the next exact prompt to paste into ChatGPT;
2. the file to upload before that prompt;
3. what output file to download if ChatGPT edits;
4. what version to use for the next pass;
5. a short checklist for the user.

## Completion report

At the end of each run, report:

- passes completed;
- current latest version;
- files downloaded or generated;
- decisions/backlog files updated, if any;
- whether a reset was triggered;
- manual actions required;
- any pass that could not be run because browser/file automation was unavailable.
