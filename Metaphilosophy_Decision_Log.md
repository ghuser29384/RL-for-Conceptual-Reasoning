# Metaphilosophy Decision Log

This file preserves historical Metaphilosophy design decisions that no longer belong in the main specification body. It is audit evidence for accepted edits, rejected ideas, pruning decisions, credences, and rationale. It does not waive release gates, promote source-derived material, or create candidate, queue, label, benchmark, or training-export records.

## Policy

- The main `RLHF Conceptual Reasoning93.md` file should stay focused on current build, release, measurement, governance, and UX requirements.
- This log preserves why accepted, rejected, and pruned decisions happened, including credences where the design loop recorded them.
- A decision being preserved here is not enough to make an idea release-critical. Release use still requires the existing evidence sections, policy decisions, and implementation gates.

## Entries

### rlhf84-volunteer-platform-safeguards

- decision_type: accepted_edit
- decision_status: accepted
- source_version: RLHF84
- credence: 0.82
- current_spec_disposition: retained_in_main_spec
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Volunteer-platform measurement safeguards
- rationale: RLHF84 treated volunteer incentive neutrality, language and translation artifact handling, protected-split UI variant control, label-blind pre-submit assistance, volunteer withdrawal handling, and accessibility/readability gating as project-level safeguards that reduce measurement error without changing LMCA labels.

### rlhf85-production-measurement-hardening

- decision_type: accepted_edit
- decision_status: accepted
- source_version: RLHF85
- credence: 0.85
- current_spec_disposition: retained_in_main_spec
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Production measurement hardening
- rationale: RLHF85 added protected model-run data handling, evidence-backed expert-role qualification, critique-not-position rating reminders, unset score entry with raw-score provenance, stale-draft invalidation, label/model-result-blind issue triage, separate human-target and model-prediction tie tolerances, source-family/authorship conflict gating, server-derived screen states, correctness claim-weight worksheets, and release/config manifest integrity as safeguards against leakage, provenance, client-state, and scoring drift.

### rlhf86-leakage-benchmark-and-governance-controls

- decision_type: accepted_edit
- decision_status: accepted
- source_version: RLHF86
- credence: 0.84
- current_spec_disposition: retained_in_main_spec
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Leakage, benchmark, and governance controls
- rationale: RLHF86 added source-recognition escape hatches, protected-artifact storage/cache/backup and incident controls, aggregate-only hidden-benchmark submission feedback, prompt-injection-resistant model-evaluation rendering, and two-person governance for high-impact unblinding or release changes to reduce leakage, benchmark overfitting, prompt contamination, and governance drift.

### rlhf87-operational-control-plane

- decision_type: accepted_edit
- decision_status: accepted
- source_version: RLHF87
- credence: 0.87
- current_spec_disposition: retained_in_main_spec
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Operational control plane
- rationale: RLHF87 added centralized side-effect policy decisions, governed implementation-phase gates, canonical append-only bundle hashing, queue freshness/backpressure controls, sensitive client-surface isolation, and tamper-evident high-impact audit events to reduce partial implementation, configuration mutation, delayed work, UI telemetry, and audit-integrity risk.

### rlhf88-feature-preserving-ux-simplification

- decision_type: accepted_edit
- decision_status: accepted
- source_version: RLHF88
- credence: 0.83
- current_spec_disposition: retained_in_main_spec
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Feature-preserving UX simplification
- rationale: RLHF88 accepted task-first layouts, progressive disclosure, role-specific screen states, short plain-language summaries, and glossary support for rating, practice, consent, calibration, discussion, adjudication, release-review, and admin screens, while requiring that simplification not remove features, weaken guards, change rubric semantics, lose provenance, or expose hidden metadata.

### rlhf89-schedule-copy-verification-and-draft-provenance

- decision_type: accepted_edit
- decision_status: accepted
- source_version: RLHF89
- credence: 0.81
- current_spec_disposition: retained_in_main_spec
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Schedule, copy, verification, and draft provenance
- rationale: RLHF89 added date-current schedule re-baselining, clause-traceable simplified rubric copy, source-blind verification-evidence provenance, and server-side/ephemeral-only draft persistence to reduce stale-plan, rubric-paraphrase, correctness-evidence, and client-storage leakage risks.

### rlhf90-triggered-score-explanation-policy

- decision_type: accepted_edit
- decision_status: accepted
- source_version: RLHF90
- credence: 0.84
- current_spec_disposition: retained_in_main_spec
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Triggered score-explanation policy
- rationale: RLHF90 kept ordinary ratings focused on seven scores plus confidence while requiring short explanations only for extreme, inconsistent, surprising, unclear-target, high-stakes, post-discussion-revision, or exposure/familiarity/conflict-uncertainty cases.

### rlhf91-greenfield-task-track-separation

- decision_type: accepted_edit
- decision_status: accepted
- source_version: RLHF91
- credence: 0.84
- current_spec_disposition: retained_in_main_spec
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Greenfield task-track separation
- rationale: RLHF91 kept the existing Position, Critique, CandidateBatch, and CandidateCritique spine while adding a separate Metaphilosophy task-track taxonomy. This reduced path dependency without creating a parallel candidate or label architecture.

### rlhf92-public-dataset-before-leaderboard

- decision_type: accepted_edit
- decision_status: accepted
- source_version: RLHF92
- credence: 0.86
- current_spec_disposition: retained_in_main_spec
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Public dataset artifact before leaderboard, API evaluator, or training export
- rationale: RLHF92 treated the first serious public artifact as an expert-rated critique-ratings dataset. This kept the platform focused on validating label foundations before expanding into product-facing evaluation surfaces.

### reject-direct-pairwise-preference-labels-as-release-gate

- decision_type: rejected_idea
- decision_status: rejected
- source_version: RLHF91
- credence: 0.72
- current_spec_disposition: kept_in_rd_backlog_only
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Do not make direct pairwise preference labels an immediate release gate
- rationale: Direct pairwise labels can be useful research, but they should remain an R&D backlog item until pilot evidence shows measurement validity or rater-reliability gains and a governed policy decision promotes them.

### rlhf93-prune-historical-revision-log

- decision_type: pruning_decision
- decision_status: pruned
- source_version: RLHF93
- credence: 0.91
- current_spec_disposition: moved_out_of_main_spec
- release_gate_impact: audit_only_no_release_gate
- preserved_in: Metaphilosophy_Decision_Log.md
- title: Move detailed historical revision log out of the main spec
- rationale: RLHF93 pruned the main specification by moving detailed historical revision history into this decision log. The pruning keeps the main spec implementable while preserving auditability for accepted edits, rejected ideas, credences, and rationale.
