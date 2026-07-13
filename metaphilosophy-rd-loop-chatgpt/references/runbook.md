# Runbook: Using the Metaphilosophy R&D Loop Skill

## Install location

Copy the `metaphilosophy-rd-loop-chatgpt` directory into one of Codex's skill locations, for example:

- repo-scoped: `.agents/skills/metaphilosophy-rd-loop-chatgpt/`
- user-scoped: `$HOME/.agents/skills/metaphilosophy-rd-loop-chatgpt/`

Restart Codex if the skill is not detected.

## Detect latest version

Before invoking a run, let the skill detect the latest local RLHF file:

```bash
python .agents/skills/metaphilosophy-rd-loop-chatgpt/scripts/detect_latest_version.py
```

To render a prompt without manually typing the version:

```bash
python .agents/skills/metaphilosophy-rd-loop-chatgpt/scripts/render_prompts.py discovery --latest
```

## Invocation examples

Use in Codex:

```text
Use $metaphilosophy-rd-loop-chatgpt. Auto-detect the latest RLHF Conceptual Reasoning*.md version, then run one normal cycle in the current ChatGPT chat in Chrome. Ask before continuing beyond one cycle.
```

Manual fallback:

```text
Use $metaphilosophy-rd-loop-chatgpt. Auto-detect the latest RLHF Conceptual Reasoning*.md version. Browser automation is not available. Give me the exact next prompt to paste and the file I should upload.
```

Longer run:

```text
Use $metaphilosophy-rd-loop-chatgpt. Auto-detect the latest RLHF Conceptual Reasoning*.md version. Run two normal cycles. Run a path-dependency reset after every 4 successful version increments. Stop if a pass produces no edit twice in a row.
```

## Recommended operating mode

Run one cycle at a time. Review the outputs before allowing the next cycle. The Metaphilosophy spec is large and safety-critical enough that unbounded automatic iteration is not recommended.
