# Hard Set source-allocation decision

**Decision:** Mixed acquisition, option 2  
**Approved allocation:** 50 LMCA positions / 20 public-synthetic positions / 30 newly hidden public-domain-derived positions  
**Total:** 100 positions × 4 critiques = 400 critiques  
**Decision date:** 2026-07-23  
**Status:** Position-level allocation approved; exact item selection and critique production remain gated.

## Frozen quotas

| Source class | Positions | Critiques | Current state |
|---|---:|---:|---|
| Existing expert-rated LMCA | 50 | 200 | Canonical row-level data and license not yet supplied |
| Public synthetic library | 20 | 80 | 250-position screening pool exists; exact 20 await cross-source balance and difficulty screening |
| Newly hidden public-domain-derived | 30 | 120 | All 30 upstream draft positions nominated; none promoted; critiques do not yet exist |

## Rationale

The allocation gives half of the Hard Set to the existing expert-rated LMCA measurement regime, preserving continuity with its ratings and validation work. It limits already-public synthetic material to one fifth of positions, reducing the risk that the Hard Set becomes merely a relabeling of the public model-authored corpus. The remaining 30 positions create a protected evaluation source with explicit source anchors, argument maps, load-bearing assumptions, and ambiguity notes.

## Protected-source boundary

The source works are public-domain editions, but transformed item texts, candidate IDs, critiques, ratings, and split assignments are benchmark-controlled. The public repository records only aggregate counts and the canonical upstream artifact hash. It must not contain reconstructible hidden item content.

The upstream 30-position package remains `draft_extraction_unrated`. Every position requires independent source-fidelity and ambiguity/scope review before promotion. The four-critique authorship mix is not decided here.

## Item-selection rule

1. Audit and freeze the canonical LMCA row-level dataset and license.
2. Screen all 30 protected upstream positions; retain rejected positions in the exclusion ledger. Because the quota is exactly 30, any rejection requires a replacement acquisition decision rather than silent substitution.
3. Build a cross-source domain, source-family, position-length, attack-family, and difficulty matrix.
4. Select the exact 50 LMCA and 20 public-synthetic positions to fill coverage and difficulty deficits, not by arbitrary ID order.
5. Create or acquire missing critiques without changing the frozen position text. Every text revision creates a new version.
6. Freeze exact item IDs only in a controlled manifest; publish aggregate allocation counts only.

## Explicit non-decisions

This decision does not choose:

- the exact LMCA or public-synthetic position IDs;
- the human/model authorship mix for newly created critiques;
- core-panel size, compensation, or contracted capacity;
- the adjudication threshold or capacity ceiling;
- the Bench 01 public/hidden split.

Those parameters remain governed by the decision register and the 0.90 credence rule.
