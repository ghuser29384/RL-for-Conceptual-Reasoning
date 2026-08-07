# Public editorial release status — 2026-08-07

## Current state

The audited public editorial release has been built and verified, but it is **staged, not current**.

- Audited public source commit: `04e09576aae032aac408f343cf9f09d6bad8d6f5`
- READY staged production deployment: `dpl_EQQHRrqyqNcYmN9sYUyATMof4PQ6`
- Deployment URL: `rlhf-conceptual-reasoning-nfgg6cjkk-ellen-s.vercel.app`
- Expected public release marker: `mp-public-voice-20260806-r1`
- Production deployment hold restored on `main`: `58a4085af318ec2cc00baf0431272474882b713a`

The canonical domains still resolve to the prior August 2 deployment `dpl_Cce9VRWFcEz8SD6fGiTiD2ELxopC`, whose release marker is `mp-preoutreach-20260802-r1`.

## Evidence completed

The exact public source commit passed:

- Metaphilosophy release gates;
- Metaphilosophy programme-integrity checks; and
- synthetic-release validation.

The Vercel production build reached `READY` with no alias error. Its static build reconstructed the expected 250-position, 1,000-critique synthetic release and copied only the 16 allowlisted public source files. The staged deployment was built from the exact audited commit above.

## Why it is not yet live

The Vercel project has production-domain auto-assignment disabled, so a successful production build remains staged until explicitly promoted. The connected Vercel tool exposes inspection, logs, and deployment, but no promotion action. The repository contains no `VERCEL_TOKEN`, `VERCEL_ACCESS_TOKEN`, or `VERCEL_API_TOKEN`; a one-shot promotion workflow therefore failed closed before making any Vercel request and was removed.

## Exact remaining action

In Vercel, promote deployment `dpl_EQQHRrqyqNcYmN9sYUyATMof4PQ6` to Production/Current. Do not rebuild, redeploy a different commit, or promote any queued preview.

After promotion, verify that all canonical domains serve release marker `mp-public-voice-20260806-r1`, then check `/`, `/research/`, `/arguments/`, `/reviewers/`, and `/workspace` before declaring the release live.

## Authorization boundary

This release changes only the public editorial surface. It does not merge the protected pilot branch, issue participant access, authorize research ratings, ingest ratings, authorize payment, publish study results, or complete H-11/H-12.
