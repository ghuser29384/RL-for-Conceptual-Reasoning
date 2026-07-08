# Metaphilosophy Decision Log

This file preserves historical Metaphilosophy design decisions that no longer belong in the main specification body. It is audit evidence for accepted edits, rejected ideas, pruning decisions, credences, and rationale. It does not waive release gates, promote source-derived material, or create candidate, queue, label, benchmark, or training-export records.

## Policy

- The main `RLHF Conceptual Reasoning93.md` file should stay focused on current build, release, measurement, governance, and UX requirements.
- This log preserves why accepted, rejected, and pruned decisions happened, including credences where the design loop recorded them.
- A decision being preserved here is not enough to make an idea release-critical. Release use still requires the existing evidence sections, policy decisions, and implementation gates.

## Entries

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
