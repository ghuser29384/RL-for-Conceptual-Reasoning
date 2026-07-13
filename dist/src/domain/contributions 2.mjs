export const CONTRIBUTION_VISIBILITY_CLASSES = [
  "user_visible",
  "reviewer_visible",
  "admin_only",
  "rater_visible_after_promotion",
  "never_rater_visible",
];

export const CONTRIBUTION_ARCHITECTURE = {
  artifactPipeline: ["ContributionSubmission", "ContributionPart", "PreparedDraft", "CandidateItem", "live corpus item"],
  optionalGroupingPipeline: ["CandidateItem", "CandidateBatchMembership", "CandidateBatch"],
  reviewControlPlane: [
    "ReviewSignal",
    "WorkflowGate",
    "WorkflowPolicy",
    "GateDecision",
    "ClarificationRequest",
    "ReviewDecision",
    "PromotionRecord",
  ],
  visibilityAssignmentControlPlane: ["VisibilityClass", "ExposureConflict", "assignment_exclusion_rules"],
};

export const CONTRIBUTION_PART_REVIEW_STATUSES = [
  "draft",
  "submitted_pending_review",
  "needs_clarification",
  "rejected",
  "accepted_for_preparation",
  "prepared_draft_created",
  "closed",
];

export const PREPARED_DRAFT_STATUSES = [
  "drafting",
  "needs_clarification",
  "blocked_by_required_gate",
  "ready_for_candidate_item_creation",
  "promoted_to_candidate_item",
  "rejected",
  "closed",
];

export const GATE_DECISION_STATUSES = ["not_started", "not_applicable", "pending", "passed", "failed", "waived_with_reason"];
export const GATE_PASSING_STATUSES = ["passed", "not_applicable", "waived_with_reason"];
export const REVIEW_SIGNAL_SOURCES = ["automated_prescreen", "deterministic_rule", "human_reviewer", "admin"];
export const REVIEW_SIGNAL_AFFECTED_OBJECT_TYPES = [
  "ContributionSubmission",
  "ContributionPart",
  "OriginDisclosure",
  "PreparedDraft",
  "SourceCard",
  "SourceSpan",
  "ExtractionBatch",
  "ArgumentExtraction",
  "CandidateItem",
  "CandidateBatch",
];
export const REVIEW_SIGNAL_RATER_HIDDEN_VISIBILITY_CLASSES = ["admin_only", "reviewer_visible", "never_rater_visible"];
const SOURCE_PREPARATION_ACCEPTED_EXTRACTION_STATUSES = [
  "accepted_for_position_intake",
  "accepted_for_critique_intake",
  "accepted_for_source_preparation",
];

export const ORIGIN_CHOICES = [
  {
    key: "self_written",
    label: "I wrote this myself",
    extraFields: [],
    backendFlags: {},
    preliminaryReviewSignals: [],
  },
  {
    key: "adapted_from_source",
    label: "Adapted from a book/article/source",
    extraFields: ["source_title_optional", "author_optional", "page_or_locator_optional", "source_url_optional", "minimal_raw_excerpt_optional"],
    helper: "Add source details if you know them. A page, chapter, section, or URL is enough.",
    backendFlags: {
      adapted_from_source: true,
      source_locator_review_needed: true,
      blinding_preview_required: true,
    },
    preliminaryReviewSignals: ["source_locator_signal"],
  },
  {
    key: "direct_quote",
    label: "Quoted directly from a source",
    extraFields: [
      "source_title_optional",
      "author_optional",
      "publisher_optional",
      "publication_year_optional",
      "page_or_locator_optional",
      "source_url_optional",
      "minimal_raw_excerpt_optional",
    ],
    helper: "Add source details if you know them.",
    backendFlags: {
      direct_quote: true,
      source_leakage_review_needed: true,
      blinding_preview_required: true,
    },
    preliminaryReviewSignals: ["source_locator_signal", "possible_source_leakage_signal", "possible_blinding_risk_signal"],
  },
  {
    key: "ai_assisted",
    label: "Generated or substantially helped by AI",
    extraFields: ["llm_assistance_description"],
    helper: "For example: generated the first draft, rewrote text, summarized a source, or suggested the argument.",
    backendFlags: {
      llm_assistance_status: "user_reported_ai_assisted",
      llm_assistance_review_needed: true,
    },
    preliminaryReviewSignals: ["llm_assistance_signal"],
  },
  {
    key: "other_not_sure",
    label: "Other / not sure",
    extraFields: ["origin_note_optional"],
    backendFlags: {
      source_origin_unclear: true,
      review_needed: true,
    },
    preliminaryReviewSignals: ["unclear_origin_signal"],
  },
];

export const CONTRIBUTION_PART_SCHEMAS = {
  position_text: {
    partType: "position_text",
    userFacingLabel: "Argument",
    requiredVisibleFields: [
      {
        key: "submitted_text",
        userLabel: "Argument",
        helper: "Write the argument in a self-contained way. Reviewers may prepare it before use.",
        placeholder: "Example: Approval voting is better than first-past-the-post because...",
        component: "large_textarea",
        visibilityClass: "reviewer_visible",
      },
    ],
    optionalVisibleFields: ["submission_title_optional", "topic_hint_optional", "submitter_note_optional"],
    requiresOriginDisclosure: true,
    defaultUiComponent: "large_textarea",
    defaultQualityNudge:
      "Good submissions are self-contained: include the main claim, the reason for it, and any definitions needed to understand it.",
    validPreparedDraftType: "prepared_position_draft",
    validCandidateItemType: "candidate_position",
    defaultVisibilityClasses: {
      submitted_text: "reviewer_visible",
      submission_title_optional: "reviewer_visible",
      topic_hint_optional: "reviewer_visible",
      submitter_note_optional: "reviewer_visible",
      submitter_identity: "never_rater_visible",
      source_details: "never_rater_visible",
    },
    defaultReviewSignalChecks: [
      "conceptual_scope_prescreen_gate",
      "context_sufficiency_prescreen_gate",
      "duplicate_prescreen_gate",
      "source_leakage_prescreen_gate",
      "submitter_conflict_gate",
    ],
  },
  critique_text: {
    partType: "critique_text",
    userFacingLabel: "Critique",
    requiredVisibleFields: [
      {
        key: "submitted_text",
        userLabel: "Critique",
        helper: "Explain what is wrong, incomplete, unclear, or weak in the argument. Reviewers may prepare it before use.",
        placeholder: "This argument does not show X, because...",
        component: "large_textarea",
        visibilityClass: "reviewer_visible",
      },
    ],
    optionalVisibleFields: ["submitter_note_optional"],
    requiresOriginDisclosure: true,
    requiresTargetLink: true,
    defaultUiComponent: "large_textarea",
    defaultQualityNudge: "A useful critique identifies the target claim, explains the problem, and says why the problem matters.",
    validPreparedDraftType: "prepared_critique_draft",
    validCandidateItemType: "candidate_critique",
    defaultVisibilityClasses: {
      submitted_text: "reviewer_visible",
      submitter_note_optional: "reviewer_visible",
      submitter_identity: "never_rater_visible",
      source_details: "never_rater_visible",
    },
    defaultReviewSignalChecks: [
      "target_link_gate",
      "conceptual_scope_prescreen_gate",
      "context_sufficiency_prescreen_gate",
      "duplicate_prescreen_gate",
      "source_leakage_prescreen_gate",
      "submitter_conflict_gate",
    ],
  },
  source_suggestion: {
    partType: "source_suggestion",
    userFacingLabel: "Source suggestion",
    requiredVisibleFields: [
      { key: "source_title", userLabel: "Source title", component: "text_input", visibilityClass: "reviewer_visible" },
      {
        key: "source_type_simple",
        userLabel: "What kind of source is it?",
        component: "select",
        options: ["book", "article", "blog/forum/magazine", "paper", "dataset", "other / not sure"],
        visibilityClass: "reviewer_visible",
      },
      {
        key: "why_relevant",
        userLabel: "Why might this source be useful?",
        helper: "One or two sentences is enough.",
        component: "textarea",
        visibilityClass: "reviewer_visible",
      },
    ],
    optionalDrawer: "Add details if you know them",
    optionalVisibleFields: [
      "author",
      "publisher_or_site",
      "publication_year",
      "chapter_or_section",
      "page_or_locator",
      "source_url",
      "possible_argument_summary",
    ],
    requiresOriginDisclosure: false,
    defaultUiComponent: "source_card_form",
    defaultQualityNudge: "Useful source suggestions explain why the source could help reviewers prepare conceptual arguments.",
    validPreparedDraftType: "prepared_source_card_draft",
    validCandidateItemType: "source_card",
    defaultVisibilityClasses: {
      source_title: "reviewer_visible",
      source_type_simple: "reviewer_visible",
      why_relevant: "reviewer_visible",
      source_details: "reviewer_visible",
    },
    defaultReviewSignalChecks: ["conceptual_scope_prescreen_gate", "context_sufficiency_prescreen_gate", "duplicate_prescreen_gate"],
  },
};

export const CONTRIBUTION_TEMPLATES = {
  position_only: {
    templateKey: "position_only",
    userFacingLabel: "An argument / position",
    userFacingHelper: "A claim or argument that someone else could critique.",
    partSchemas: ["position_text"],
    requiredPartLinks: [],
    layout: "single_large_textarea_origin_panel",
    optionalDrawers: ["Add title, topic, or note"],
    reviewSummaryFormat: "position_submission_summary",
    allowedRawSubmissionReviewActions: [
      "reject_whole_submission",
      "reject_one_part",
      "request_clarification",
      "inspect_review_signals",
      "create_or_update_gate_decision",
      "waive_gate_with_reason",
      "create_prepared_draft_from_part",
      "close_submission",
    ],
    allowedPreparedDraftTypes: ["prepared_position_draft"],
    allowedCandidateItemTypes: ["candidate_position"],
    workflowPolicyKeys: ["raw_intake_acceptance", "prepared_draft_readiness", "candidate_item_downstream_use"],
  },
  critique_existing: {
    templateKey: "critique_existing",
    userFacingLabel: "A critique of an existing argument",
    userFacingHelper: "Choose an argument already available for contribution, then submit your critique.",
    partSchemas: ["critique_text"],
    requiredPartLinks: ["critique_targets_existing_position"],
    layout: "two_panel_choose_argument_write_critique",
    optionalDrawers: ["Add note to reviewers"],
    reviewSummaryFormat: "critique_existing_submission_summary",
    allowedRawSubmissionReviewActions: [
      "reject_whole_submission",
      "reject_one_part",
      "request_clarification",
      "inspect_review_signals",
      "create_or_update_gate_decision",
      "waive_gate_with_reason",
      "create_prepared_draft_from_part",
      "close_submission",
    ],
    allowedPreparedDraftTypes: ["prepared_critique_draft"],
    allowedCandidateItemTypes: ["candidate_critique"],
    workflowPolicyKeys: ["raw_intake_acceptance", "prepared_draft_readiness", "candidate_item_downstream_use"],
  },
  position_and_critique: {
    templateKey: "position_and_critique",
    userFacingLabel: "A new argument and my critique of it",
    userFacingHelper: "Paste an argument and your critique together.",
    partSchemas: ["position_text", "critique_text"],
    requiredPartLinks: ["critique_targets_position_part"],
    layout: "two_panel_argument_and_critique",
    optionalDrawers: ["Add title, topic, or note"],
    reviewSummaryFormat: "position_and_critique_submission_summary",
    allowedRawSubmissionReviewActions: [
      "reject_whole_submission",
      "reject_one_part",
      "request_clarification",
      "inspect_review_signals",
      "create_or_update_gate_decision",
      "waive_gate_with_reason",
      "create_prepared_draft_from_part",
      "close_submission",
    ],
    allowedPreparedDraftTypes: ["prepared_position_draft", "prepared_critique_draft"],
    allowedCandidateItemTypes: ["candidate_position", "candidate_critique"],
    workflowPolicyKeys: ["raw_intake_acceptance", "prepared_draft_readiness", "candidate_item_downstream_use"],
  },
  source_suggestion: {
    templateKey: "source_suggestion",
    userFacingLabel: "A source suggestion",
    userFacingHelper: "Suggest a source we might adapt arguments from.",
    partSchemas: ["source_suggestion"],
    requiredPartLinks: [],
    layout: "source_suggestion_form",
    optionalDrawers: ["Add details if you know them"],
    reviewSummaryFormat: "source_suggestion_summary",
    allowedRawSubmissionReviewActions: [
      "reject_whole_submission",
      "reject_one_part",
      "request_clarification",
      "inspect_review_signals",
      "create_or_update_gate_decision",
      "waive_gate_with_reason",
      "create_prepared_draft_from_part",
      "close_submission",
    ],
    allowedPreparedDraftTypes: ["prepared_source_card_draft"],
    allowedCandidateItemTypes: ["source_card"],
    workflowPolicyKeys: ["raw_intake_acceptance", "prepared_draft_readiness", "candidate_item_downstream_use"],
  },
};

export const WORKFLOW_GATES = {
  moderation_gate: { gateId: "moderation_gate", label: "Moderation", objectTypes: ["ContributionPart"] },
  spam_or_abuse_gate: { gateId: "spam_or_abuse_gate", label: "Spam or abuse", objectTypes: ["ContributionPart"] },
  origin_disclosure_gate: { gateId: "origin_disclosure_gate", label: "Origin disclosure", objectTypes: ["ContributionPart", "OriginDisclosure"] },
  source_locator_gate: { gateId: "source_locator_gate", label: "Source locator", objectTypes: ["ContributionPart", "OriginDisclosure"] },
  conceptual_scope_prescreen_gate: { gateId: "conceptual_scope_prescreen_gate", label: "Conceptual scope pre-screen", objectTypes: ["ContributionPart"] },
  context_sufficiency_prescreen_gate: { gateId: "context_sufficiency_prescreen_gate", label: "Context sufficiency pre-screen", objectTypes: ["ContributionPart"] },
  duplicate_prescreen_gate: { gateId: "duplicate_prescreen_gate", label: "Duplicate pre-screen", objectTypes: ["ContributionPart"] },
  source_leakage_prescreen_gate: { gateId: "source_leakage_prescreen_gate", label: "Source leakage pre-screen", objectTypes: ["ContributionPart"] },
  submitter_conflict_gate: { gateId: "submitter_conflict_gate", label: "Submitter conflict", objectTypes: ["ContributionPart", "PreparedDraft"] },
  llm_assistance_disclosure_gate: { gateId: "llm_assistance_disclosure_gate", label: "AI assistance disclosure", objectTypes: ["ContributionPart"] },
  blinding_gate: { gateId: "blinding_gate", label: "Blinding", objectTypes: ["PreparedDraft"] },
  source_leakage_gate: { gateId: "source_leakage_gate", label: "Source leakage", objectTypes: ["PreparedDraft"] },
  conceptual_scope_gate: { gateId: "conceptual_scope_gate", label: "Conceptual scope", objectTypes: ["PreparedDraft"] },
  context_sufficiency_gate: { gateId: "context_sufficiency_gate", label: "Context sufficiency", objectTypes: ["PreparedDraft"] },
  duplicate_gate: { gateId: "duplicate_gate", label: "Duplicate", objectTypes: ["PreparedDraft"] },
  target_link_gate: { gateId: "target_link_gate", label: "Target link", objectTypes: ["PreparedDraft"] },
  candidate_text_quality_gate: { gateId: "candidate_text_quality_gate", label: "Candidate text quality", objectTypes: ["PreparedDraft"] },
  rater_visibility_gate: { gateId: "rater_visibility_gate", label: "Rater visibility", objectTypes: ["PreparedDraft"] },
  candidate_record_integrity_gate: { gateId: "candidate_record_integrity_gate", label: "Candidate record integrity", objectTypes: ["CandidateItem"] },
  rater_visible_text_gate: { gateId: "rater_visible_text_gate", label: "Rater-visible text", objectTypes: ["CandidateItem"] },
  assignment_exclusion_gate: { gateId: "assignment_exclusion_gate", label: "Assignment exclusion", objectTypes: ["CandidateItem"] },
  validation_use_gate: { gateId: "validation_use_gate", label: "Validation use", objectTypes: ["CandidateItem"] },
  hidden_benchmark_use_gate: { gateId: "hidden_benchmark_use_gate", label: "Hidden benchmark use", objectTypes: ["CandidateItem"] },
  public_release_gate: { gateId: "public_release_gate", label: "Public release", objectTypes: ["CandidateItem"] },
  model_training_export_gate: { gateId: "model_training_export_gate", label: "Model-training export", objectTypes: ["CandidateItem"] },
  batch_membership_integrity_gate: { gateId: "batch_membership_integrity_gate", label: "Batch membership integrity", objectTypes: ["CandidateBatch"] },
  batch_purpose_gate: { gateId: "batch_purpose_gate", label: "Batch purpose", objectTypes: ["CandidateBatch"] },
  batch_selection_notes_gate: { gateId: "batch_selection_notes_gate", label: "Batch selection notes", objectTypes: ["CandidateBatch"] },
  batch_downstream_handoff_gate: { gateId: "batch_downstream_handoff_gate", label: "Batch downstream handoff", objectTypes: ["CandidateBatch"] },
};

export const WORKFLOW_POLICIES = {
  raw_intake_acceptance: {
    policyId: "raw_intake_acceptance",
    appliesTo: ["ContributionPart", "OriginDisclosure"],
    requiredGateIds: [
      "moderation_gate",
      "spam_or_abuse_gate",
      "origin_disclosure_gate",
      "source_locator_gate",
      "conceptual_scope_prescreen_gate",
      "context_sufficiency_prescreen_gate",
      "duplicate_prescreen_gate",
      "source_leakage_prescreen_gate",
      "submitter_conflict_gate",
      "llm_assistance_disclosure_gate",
    ],
  },
  prepared_draft_readiness: {
    policyId: "prepared_draft_readiness",
    appliesTo: ["PreparedDraft"],
    requiredGateIds: [
      "blinding_gate",
      "source_leakage_gate",
      "conceptual_scope_gate",
      "context_sufficiency_gate",
      "duplicate_gate",
      "target_link_gate",
      "candidate_text_quality_gate",
      "rater_visibility_gate",
      "submitter_conflict_gate",
    ],
  },
  candidate_item_downstream_use: {
    policyId: "candidate_item_downstream_use",
    appliesTo: ["CandidateItem"],
    requiredGateIds: [
      "candidate_record_integrity_gate",
      "rater_visible_text_gate",
      "assignment_exclusion_gate",
      "validation_use_gate",
      "hidden_benchmark_use_gate",
      "public_release_gate",
      "model_training_export_gate",
    ],
  },
  candidate_batch_downstream_handoff: {
    policyId: "candidate_batch_downstream_handoff",
    appliesTo: ["CandidateBatch"],
    requiredGateIds: ["batch_membership_integrity_gate", "batch_purpose_gate", "batch_selection_notes_gate", "batch_downstream_handoff_gate"],
  },
};

const contributionWriteStatuses = new Set(["draft", "submitted_pending_review"]);
const forbiddenContributionFieldNames = new Set([
  "rights_attestation",
  "rights_review_status",
  "rights_review_needed",
  "rights_notes_optional",
  "copyright_status",
  "copyright_warning",
  "copyright_permission",
  "public_release_permission",
  "validation_use_permission",
  "hidden_benchmark_permission",
  "model_training_export_permission",
  "short_excerpt_optional",
]);
const candidateItemTypeByPreparedDraftType = {
  prepared_position_draft: "candidate_position",
  prepared_critique_draft: "candidate_critique",
  prepared_source_card_draft: "source_card",
};
const PROMOTABLE_PREPARED_DRAFT_STATUS = "ready_for_candidate_item_creation";
const PROMOTABLE_PREPARED_DRAFT_REVIEW_STATUSES = {
  blindingReviewStatus: new Set(["blinding_review_passed", "not_applicable", "waived_with_reason"]),
  sourceLeakageReviewStatus: new Set(["source_leakage_review_passed", "not_applicable", "waived_with_reason"]),
  gateReadinessStatus: new Set([PROMOTABLE_PREPARED_DRAFT_STATUS]),
  candidateItemReadiness: new Set([PROMOTABLE_PREPARED_DRAFT_STATUS]),
};
const INITIAL_PREPARED_DRAFT_REVIEW_STATUSES = {
  blindingReviewStatus: "pending_blinding_review",
  sourceLeakageReviewStatus: "pending_source_leakage_review",
  gateReadinessStatus: "not_ready",
  candidateItemReadiness: "not_ready",
};
const allowedSubmissionRoles = new Set(["rater", "graduate", "phd", "expert", "admin"]);

export function contributionTemplateForType(type) {
  if (type === "position") return CONTRIBUTION_TEMPLATES.position_only;
  if (type === "critique") return CONTRIBUTION_TEMPLATES.critique_existing;
  if (type === "source") return CONTRIBUTION_TEMPLATES.source_suggestion;
  return CONTRIBUTION_TEMPLATES.position_only;
}

export function eligibleContributionPositions(positionList = []) {
  return positionList.map((position) => {
    const text = String(position.textVersions?.at(-1)?.text ?? "");
    return {
      id: position.id,
      title: position.title || text.slice(0, 120),
      topic: position.topicFamily ?? null,
      preview: text.slice(0, 180),
    };
  });
}

export function createContributionSubmissionResources(input, actor, options = {}) {
  if (!actor || !allowedSubmissionRoles.has(actor.role)) {
    return invalidContribution("login_required_for_contribution_submission", "A logged-in contribution role is required.");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalidContribution("invalid_contribution_submission", "submission object is required.");
  const forbiddenKeys = findForbiddenContributionKeys(input);
  if (forbiddenKeys.length) {
    return invalidContribution("forbidden_contribution_fields", `Contribution submissions do not accept rights or copyright fields: ${forbiddenKeys.join(", ")}`);
  }

  const templateKey = input.templateKey ?? contributionTemplateForType(input.type).templateKey;
  const template = CONTRIBUTION_TEMPLATES[templateKey];
  if (!template) return invalidContribution("unknown_contribution_template", `Unsupported contribution template: ${templateKey}`);
  const reviewStatus = input.reviewStatus ?? input.status ?? (input.draft === true ? "draft" : "submitted_pending_review");
  if (!contributionWriteStatuses.has(reviewStatus)) {
    return invalidContribution("invalid_contribution_status", `Unsupported contribution status: ${reviewStatus}`);
  }
  const isDraft = reviewStatus === "draft";
  const partsInput = Array.isArray(input.parts) ? input.parts : [];
  const partValidation = validateTemplateParts(template, partsInput, { isDraft, eligiblePositionIds: options.eligiblePositionIds ?? [] });
  if (!partValidation.ok) return partValidation;

  const now = options.now ?? new Date().toISOString();
  const submissionId = input.id ?? nextContributionId("contribution-submission", options);
  const partIdsByClientId = new Map();
  const contributionParts = partsInput.map((partInput, index) => {
    const schema = CONTRIBUTION_PART_SCHEMAS[partInput.type];
    const partId = partInput.id ?? nextContributionId(`contribution-part-${partInput.type}`, options);
    if (partInput.clientPartId) partIdsByClientId.set(partInput.clientPartId, partId);
    const rawFields = normalizePartFields(partInput, schema);
    return {
      id: partId,
      submissionId,
      partType: partInput.type,
      partIndex: index,
      rawFields,
      submittedText: rawFields.submitted_text ?? null,
      submittedSourceSuggestion: partInput.type === "source_suggestion" ? rawFields : null,
      visibilityClasses: schema.defaultVisibilityClasses,
      partReviewStatus: isDraft ? "draft" : "submitted_pending_review",
      trustStatus: "untrusted_user_submission",
      submittedContentImmutable: !isDraft,
      preparedDraftIds: [],
      createdAt: now,
      updatedAt: now,
    };
  });

  const originDisclosures = [];
  for (const partInput of partsInput) {
    const schema = CONTRIBUTION_PART_SCHEMAS[partInput.type];
    if (!schema.requiresOriginDisclosure) continue;
    const part = contributionParts[partsInput.indexOf(partInput)];
    const originInput = partInput.originDisclosure ?? {};
    originDisclosures.push(normalizeOriginDisclosure(originInput, part.id, now, options));
  }

  const partLinks = buildPartLinks(template, partsInput, contributionParts, partIdsByClientId, now, options);
  const reviewSignals = isDraft
    ? []
    : contributionParts.flatMap((part) =>
        buildPreliminaryReviewSignals(part, originDisclosures.find((origin) => origin.contributionPartId === part.id), now, options),
      );
  const exposureConflicts = isDraft
    ? []
    : [
        {
          id: nextContributionId("exposure-conflict", options),
          conflictType: "submitter_origin_exposure",
          submitterId: actor.id,
          submissionId,
          affectedObjectIds: contributionParts.map((part) => part.id),
          submitterConflictClusterId: input.submitterConflictClusterId ?? `submitter-conflict-${submissionId}`,
          independentBlindEligibilityEffect: "exclude_from_initial_blind_rating",
          allowedNonBlindRoles: ["intake_clarification", "labeled_expert_context"],
          visibilityClass: "admin_only",
          createdAt: now,
        },
      ];

  const contributionSubmission = {
    id: submissionId,
    submitterId: actor.id,
    templateKey,
    state: isDraft ? "draft" : "submitted",
    reviewStatus,
    userFacingStatus: plainContributionStatus(reviewStatus),
    overallReviewStatus: reviewStatus,
    moderationStatus: isDraft ? "not_started" : "pending_review",
    submitterTrustTier: input.submitterTrustTier ?? actor.trustTier ?? "unknown",
    trustStatus: "untrusted_user_submission",
    submitterExposureRecordCreated: !isDraft,
    partIds: contributionParts.map((part) => part.id),
    originDisclosureIds: originDisclosures.map((origin) => origin.id),
    partLinkIds: partLinks.map((link) => link.id),
    reviewSignalIds: reviewSignals.map((signal) => signal.id),
    exposureConflictIds: exposureConflicts.map((conflict) => conflict.id),
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };

  const resources = {
    contributionSubmission: [contributionSubmission],
    contributionPart: contributionParts,
    originDisclosure: originDisclosures,
    contributionPartLink: partLinks,
    reviewSignal: reviewSignals,
    exposureConflict: exposureConflicts,
  };
  return {
    ok: true,
    resources,
    submission: contributionSubmission,
    userView: sanitizeContributionSubmissionForUser(contributionSubmission, {
      contributionParts,
      originDisclosures,
      partLinks,
      clarificationRequests: [],
      preparedDrafts: [],
    }),
  };
}

export function createGateDecisionResource(input, actor, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalidContribution("invalid_gate_decision", "gateDecision object is required.");
  const gateId = input.gateId ?? input.gate_id;
  const workflowPolicyId = input.workflowPolicyId ?? input.workflow_policy_id;
  const objectId = input.objectId ?? input.object_id;
  const gateStatus = input.gateStatus ?? input.gate_status;
  const decisionSource = input.decisionSource ?? input.decision_source ?? (actor?.role === "admin" ? "authorized_admin" : "human_reviewer");
  const missing = [
    ["gateId", gateId],
    ["workflowPolicyId", workflowPolicyId],
    ["objectId", objectId],
    ["gateStatus", gateStatus],
  ].filter(([, value]) => value === undefined || value === null || value === "");
  if (missing.length) return invalidContribution("invalid_gate_decision", `missing required fields: ${missing.map(([field]) => field).join(", ")}`);
  if (!WORKFLOW_GATES[gateId]) return invalidContribution("unknown_workflow_gate", `Unknown workflow gate: ${gateId}`);
  if (!WORKFLOW_POLICIES[workflowPolicyId]) return invalidContribution("unknown_workflow_policy", `Unknown workflow policy: ${workflowPolicyId}`);
  if (!GATE_DECISION_STATUSES.includes(gateStatus)) return invalidContribution("invalid_gate_status", `Unsupported gate status: ${gateStatus}`);
  if (gateStatus === "waived_with_reason" && !input.waiverReason) {
    return invalidContribution("waiver_reason_required", "waived_with_reason gate decisions require a waiverReason.");
  }
  if (decisionSource === "automated_prescreen") {
    return invalidContribution("automated_prescreen_cannot_decide_gate", "AI pre-screening creates ReviewSignals, not final GateDecisions.");
  }
  return {
    ok: true,
    resource: {
      id: input.id ?? nextContributionId("gate-decision", options),
      gateId,
      workflowPolicyId,
      objectType: input.objectType ?? input.object_type ?? null,
      objectId,
      gateStatus,
      decisionSource,
      citedReviewSignalIds: normalizeStringArray(input.citedReviewSignalIds ?? input.cited_review_signal_ids),
      decisionNote: input.decisionNote ?? input.decision_note ?? "",
      waiverReason: input.waiverReason ?? input.waiver_reason ?? null,
      reviewerId: input.reviewerId ?? input.reviewer_id ?? actor?.id ?? null,
      timestamp: input.timestamp ?? options.now ?? new Date().toISOString(),
      visibilityClass: "admin_only",
    },
  };
}

export function createReviewSignalResource(input, actor, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalidContribution("invalid_review_signal", "reviewSignal object is required.");
  const signalType = input.signalType ?? input.signal_type;
  const source = input.source ?? input.signalSource ?? input.signal_source ?? (actor?.role === "admin" ? "admin" : "human_reviewer");
  const affectedObjectType = input.affectedObjectType ?? input.affected_object_type ?? input.objectType ?? input.object_type;
  const affectedObjectId = input.affectedObjectId ?? input.affected_object_id ?? input.objectId ?? input.object_id;
  const explanation = input.explanation ?? input.signalExplanation ?? input.signal_explanation;
  const visibilityClass = input.visibilityClass ?? input.visibility_class ?? "admin_only";
  const confidence = input.confidence ?? null;
  const missing = [
    ["signalType", signalType],
    ["source", source],
    ["affectedObjectType", affectedObjectType],
    ["affectedObjectId", affectedObjectId],
    ["explanation", explanation],
  ].filter(([, value]) => value === undefined || value === null || value === "");
  if (missing.length) return invalidContribution("invalid_review_signal", `missing required fields: ${missing.map(([field]) => field).join(", ")}`);
  if (!REVIEW_SIGNAL_SOURCES.includes(source)) return invalidContribution("invalid_review_signal_source", `Unsupported review-signal source: ${source}`);
  if (!REVIEW_SIGNAL_AFFECTED_OBJECT_TYPES.includes(affectedObjectType)) {
    return invalidContribution("invalid_review_signal_object_type", `Unsupported review-signal object type: ${affectedObjectType}`);
  }
  if (!REVIEW_SIGNAL_RATER_HIDDEN_VISIBILITY_CLASSES.includes(visibilityClass)) {
    return invalidContribution("invalid_review_signal_visibility", "ReviewSignal records must stay hidden from ordinary raters.");
  }
  if (confidence !== null && (!Number.isFinite(Number(confidence)) || Number(confidence) < 0 || Number(confidence) > 1)) {
    return invalidContribution("invalid_review_signal_confidence", "ReviewSignal confidence must be a number between 0 and 1.");
  }
  return {
    ok: true,
    resource: {
      id: input.id ?? nextContributionId(`review-signal-${normalizeKey(signalType) || "signal"}`, options),
      signalType,
      source,
      confidence: confidence === null ? null : Number(confidence),
      explanation: String(explanation).trim(),
      affectedObjectType,
      affectedObjectId,
      reviewerId: input.reviewerId ?? input.reviewer_id ?? actor?.id ?? null,
      relatedGateIds: normalizeStringArray(input.relatedGateIds ?? input.related_gate_ids),
      visibilityClass,
      createdAt: input.createdAt ?? input.created_at ?? input.timestamp ?? options.now ?? new Date().toISOString(),
    },
  };
}

export function requiredGateIdsForPolicy(policyId) {
  return WORKFLOW_POLICIES[policyId]?.requiredGateIds ?? [];
}

export function gatesSatisfiedForPolicy(policyId, objectId, gateDecisions = []) {
  const latest = new Map();
  for (const decision of gateDecisions) {
    if (decision.workflowPolicyId !== policyId || decision.objectId !== objectId || !decision.gateId) continue;
    latest.set(decision.gateId, decision);
  }
  const missingGateIds = [];
  const blockingGateIds = [];
  for (const gateId of requiredGateIdsForPolicy(policyId)) {
    const decision = latest.get(gateId);
    if (!decision) {
      missingGateIds.push(gateId);
      continue;
    }
    if (!GATE_PASSING_STATUSES.includes(decision.gateStatus) || (decision.gateStatus === "waived_with_reason" && !decision.waiverReason)) {
      blockingGateIds.push(gateId);
    }
  }
  return {
    ok: missingGateIds.length === 0 && blockingGateIds.length === 0,
    missingGateIds,
    blockingGateIds,
  };
}

export function createPreparedDraftFromPart(part, input, gateDecisions = [], actor, options = {}) {
  if (!part || !CONTRIBUTION_PART_SCHEMAS[part.partType]) {
    return invalidContribution("prepared_draft_requires_contribution_part", "Prepared drafts must derive from a ContributionPart.");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalidContribution("invalid_prepared_draft", "preparedDraft object is required.");
  const rawGateCheck = gatesSatisfiedForPolicy("raw_intake_acceptance", part.id, gateDecisions);
  if (!rawGateCheck.ok) {
    return invalidContribution(
      "raw_intake_gates_not_satisfied",
      `Raw-intake gates are not satisfied for ${part.id}: ${[...rawGateCheck.missingGateIds, ...rawGateCheck.blockingGateIds].join(", ")}`,
    );
  }
  const schema = CONTRIBUTION_PART_SCHEMAS[part.partType];
  const draftType = input.draftType ?? schema.validPreparedDraftType;
  if (draftType !== schema.validPreparedDraftType) {
    return invalidContribution("invalid_prepared_draft_type", `${part.partType} can only create ${schema.validPreparedDraftType}.`);
  }
  const status = input.preparedDraftStatus ?? "drafting";
  if (!PREPARED_DRAFT_STATUSES.includes(status)) return invalidContribution("invalid_prepared_draft_status", `Unsupported prepared draft status: ${status}`);
  const creationReviewBypassFields = preparedDraftCreationReviewBypassFields(input, status);
  if (creationReviewBypassFields.length) {
    return invalidContribution(
      "prepared_draft_review_route_required",
      `PreparedDraft creation cannot mark review/readiness fields complete; use the prepared-draft review route before promotion: ${creationReviewBypassFields.join(", ")}.`,
    );
  }
  const preparedText = input.preparedText ?? input.prepared_text ?? null;
  const preparedSourceCardContent = input.preparedSourceCardContent ?? input.prepared_source_card_content ?? null;
  if (draftType === "prepared_source_card_draft") {
    if (!preparedSourceCardContent || typeof preparedSourceCardContent !== "object" || Array.isArray(preparedSourceCardContent)) {
      return invalidContribution("prepared_source_card_content_required", "Source-card drafts require preparedSourceCardContent.");
    }
  } else if (typeof preparedText !== "string" || !preparedText.trim()) {
    return invalidContribution("prepared_text_required", "Position and critique prepared drafts require preparedText.");
  }
  const now = options.now ?? new Date().toISOString();
  const candidateRaterVisibleText = preparedDraftCandidateRaterVisibleText(input, preparedText);
  const candidateItemReadiness = status === "ready_for_candidate_item_creation" ? "ready_for_candidate_item_creation" : "not_ready";
  const preparedDraft = {
    id: input.id ?? nextContributionId("prepared-draft", options),
    sourceContributionPartId: part.id,
    sourceSubmissionId: part.submissionId,
    draftType,
    preparedText: preparedText ? preparedText.trim() : null,
    preparedSourceCardContent,
    candidateRaterVisibleText,
    blindingReviewStatus: input.blindingReviewStatus ?? input.blinding_review_status ?? "pending_blinding_review",
    sourceLeakageReviewStatus: input.sourceLeakageReviewStatus ?? input.source_leakage_review_status ?? "pending_source_leakage_review",
    gateReadinessStatus: input.gateReadinessStatus ?? input.gate_readiness_status ?? candidateItemReadiness,
    candidateItemReadiness,
    preparedDraftStatus: status,
    createdBy: actor?.id ?? null,
    auditTrail: {
      contributionSubmissionId: part.submissionId,
      contributionPartId: part.id,
      rawSubmittedTextHash: part.submittedText ? `sha256:${stableHash(part.submittedText)}` : null,
      preparedBy: actor?.id ?? null,
      preparedAt: now,
    },
    visibilityClasses: {
      preparedText: "reviewer_visible",
      candidateRaterVisibleText: "reviewer_visible",
      preparedSourceCardContent: "reviewer_visible",
      sourceContributionPartId: "admin_only",
      blindingReviewStatus: "admin_only",
      sourceLeakageReviewStatus: "admin_only",
      gateReadinessStatus: "admin_only",
    },
    createdAt: now,
    updatedAt: now,
  };
  return { ok: true, resource: preparedDraft };
}

export function createPreparedDraftFromArgumentExtraction(extraction, input, actor, options = {}) {
  if (!extraction || typeof extraction !== "object" || Array.isArray(extraction)) {
    return invalidContribution("prepared_draft_requires_argument_extraction", "Source-derived prepared drafts must derive from an ArgumentExtraction.");
  }
  if (!SOURCE_PREPARATION_ACCEPTED_EXTRACTION_STATUSES.includes(extraction.reviewStatus)) {
    return invalidContribution(
      "argument_extraction_not_accepted",
      `ArgumentExtraction ${extraction.id ?? "(missing id)"} must be accepted for source preparation before prepared draft creation.`,
    );
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalidContribution("invalid_prepared_draft", "preparedDraft object is required.");

  const draftType = input.draftType ?? options.draftType;
  if (!["prepared_position_draft", "prepared_critique_draft"].includes(draftType)) {
    return invalidContribution("invalid_prepared_draft_type", "Source extractions can create prepared_position_draft or prepared_critique_draft only.");
  }
  if (draftType === "prepared_position_draft" && !["position_argument", "mixed_position_and_critique"].includes(extraction.argumentRole)) {
    return invalidContribution("source_extraction_role_mismatch", `${extraction.argumentRole} cannot create a prepared_position_draft.`);
  }
  if (draftType === "prepared_critique_draft" && !["critique_argument", "mixed_position_and_critique"].includes(extraction.argumentRole)) {
    return invalidContribution("source_extraction_role_mismatch", `${extraction.argumentRole} cannot create a prepared_critique_draft.`);
  }
  const status = input.preparedDraftStatus ?? "drafting";
  if (!PREPARED_DRAFT_STATUSES.includes(status)) return invalidContribution("invalid_prepared_draft_status", `Unsupported prepared draft status: ${status}`);
  const creationReviewBypassFields = preparedDraftCreationReviewBypassFields(input, status);
  if (creationReviewBypassFields.length) {
    return invalidContribution(
      "prepared_draft_review_route_required",
      `PreparedDraft creation cannot mark review/readiness fields complete; use the prepared-draft review route before promotion: ${creationReviewBypassFields.join(", ")}.`,
    );
  }

  const preparedText = sourceExtractionPreparedText(extraction, input, draftType);
  if (!preparedText) {
    return invalidContribution("prepared_text_required", "Source-derived prepared position and critique drafts require preparedText or prepared extraction text.");
  }

  const targetPreparedDraftId = input.targetPreparedDraftId ?? input.target_prepared_draft_id ?? null;
  const targetCandidateItemId = input.targetCandidateItemId ?? input.target_candidate_item_id ?? null;
  const targetPositionId = input.targetPositionId ?? input.target_position_id ?? input.targetLivePositionId ?? input.target_live_position_id ?? null;
  if (draftType === "prepared_critique_draft" && !targetPreparedDraftId && !targetCandidateItemId && !targetPositionId) {
    return invalidContribution(
      "critique_target_link_required",
      "Source-derived critique drafts require targetPreparedDraftId, targetCandidateItemId, or targetPositionId.",
    );
  }

  const now = options.now ?? new Date().toISOString();
  const sourceSpanIds = normalizeStringArray(extraction.sourceSpanIds);
  const candidateRaterVisibleText = preparedDraftCandidateRaterVisibleText(input, preparedText);
  const candidateItemReadiness = status === "ready_for_candidate_item_creation" ? "ready_for_candidate_item_creation" : "not_ready";
  const preparedDraft = {
    id: input.id ?? nextContributionId("prepared-draft", options),
    sourceArgumentExtractionId: extraction.id,
    sourceExtractionBatchId: extraction.extractionBatchId ?? null,
    sourceCardId: extraction.sourceCardId ?? null,
    sourceSpanIds,
    draftType,
    preparedText,
    preparedSourceCardContent: null,
    candidateRaterVisibleText,
    blindingReviewStatus: input.blindingReviewStatus ?? input.blinding_review_status ?? "pending_blinding_review",
    sourceLeakageReviewStatus: input.sourceLeakageReviewStatus ?? input.source_leakage_review_status ?? "pending_source_leakage_review",
    gateReadinessStatus: input.gateReadinessStatus ?? input.gate_readiness_status ?? candidateItemReadiness,
    candidateItemReadiness,
    preparedDraftStatus: status,
    createdBy: actor?.id ?? null,
    targetPreparedDraftId,
    targetCandidateItemId,
    targetPositionId,
    critiqueTarget: draftType === "prepared_critique_draft" ? extraction.critiqueTarget ?? input.critiqueTarget ?? null : null,
    sourcePreparationPhase: "phase2_source_preparation",
    sourcePreparationReviewStatus: "prepared_from_accepted_extraction",
    auditTrail: {
      argumentExtractionId: extraction.id,
      extractionBatchId: extraction.extractionBatchId ?? null,
      sourceCardId: extraction.sourceCardId ?? null,
      sourceSpanIds,
      rawExtractionTextHash: `sha256:${stableHash(JSON.stringify(extraction))}`,
      preparedBy: actor?.id ?? null,
      preparedAt: now,
      source: "argument_extraction",
    },
    visibilityClasses: {
      preparedText: "reviewer_visible",
      candidateRaterVisibleText: "reviewer_visible",
      sourceArgumentExtractionId: "admin_only",
      sourceExtractionBatchId: "admin_only",
      sourceCardId: "admin_only",
      sourceSpanIds: "admin_only",
      critiqueTarget: "admin_only",
      blindingReviewStatus: "admin_only",
      sourceLeakageReviewStatus: "admin_only",
      gateReadinessStatus: "admin_only",
    },
    createdAt: now,
    updatedAt: now,
  };
  return { ok: true, resource: preparedDraft };
}

export function promotePreparedDraftToCandidateItem(preparedDraft, input = {}, gateDecisions = [], actor, options = {}) {
  if (
    !preparedDraft ||
    !candidateItemTypeByPreparedDraftType[preparedDraft.draftType] ||
    (!preparedDraft.sourceContributionPartId && !preparedDraft.sourceArgumentExtractionId)
  ) {
    return invalidContribution("promotion_requires_prepared_draft", "Promotion must start from a PreparedDraft, not a raw source artifact.");
  }
  if (preparedDraft.preparedDraftStatus !== PROMOTABLE_PREPARED_DRAFT_STATUS) {
    return invalidContribution(
      "prepared_draft_not_ready_for_promotion",
      `PreparedDraft ${preparedDraft.id ?? "(missing id)"} must be ready_for_candidate_item_creation before promotion.`,
    );
  }
  const reviewStatusFailures = Object.entries(PROMOTABLE_PREPARED_DRAFT_REVIEW_STATUSES)
    .filter(([field, passingStatuses]) => !passingStatuses.has(preparedDraft[field]))
    .map(([field]) => field);
  if (reviewStatusFailures.length) {
    return invalidContribution(
      "prepared_draft_review_status_not_ready",
      `PreparedDraft ${preparedDraft.id ?? "(missing id)"} has non-promotable review status fields: ${reviewStatusFailures.join(", ")}.`,
    );
  }
  const gateCheck = gatesSatisfiedForPolicy("prepared_draft_readiness", preparedDraft.id, gateDecisions);
  if (!gateCheck.ok) {
    return invalidContribution(
      "prepared_draft_gates_not_satisfied",
      `Prepared-draft gates are not satisfied for ${preparedDraft.id}: ${[...gateCheck.missingGateIds, ...gateCheck.blockingGateIds].join(", ")}`,
    );
  }
  const now = options.now ?? new Date().toISOString();
  const candidateItemType = candidateItemTypeByPreparedDraftType[preparedDraft.draftType];
  const candidateItemId = input.candidateItemId ?? input.id ?? nextContributionId("candidate-item", options);
  const candidateRaterVisibleText =
    input.candidateRaterVisibleText ?? input.candidate_rater_visible_text ?? preparedDraft.candidateRaterVisibleText ?? preparedDraft.preparedText ?? null;
  const candidateSourceCardContent = input.candidateSourceCardContent ?? input.candidate_source_card_content ?? preparedDraft.preparedSourceCardContent ?? null;
  if (candidateItemType !== "source_card" && (typeof candidateRaterVisibleText !== "string" || !candidateRaterVisibleText.trim())) {
    return invalidContribution("candidate_rater_visible_text_required", "Candidate positions and critiques require candidate_rater_visible_text.");
  }
  if (candidateItemType === "source_card" && (!candidateSourceCardContent || typeof candidateSourceCardContent !== "object")) {
    return invalidContribution("candidate_source_card_content_required", "SourceCard promotion requires candidate source-card content.");
  }
  const candidateItem = {
    id: candidateItemId,
    itemType: candidateItemType,
    sourcePreparedDraftId: preparedDraft.id,
    sourceContributionPartId: preparedDraft.sourceContributionPartId,
    sourceArgumentExtractionId: preparedDraft.sourceArgumentExtractionId ?? null,
    sourceExtractionBatchId: preparedDraft.sourceExtractionBatchId ?? null,
    sourceCardId: preparedDraft.sourceCardId ?? null,
    sourceSpanIds: normalizeStringArray(preparedDraft.sourceSpanIds),
    targetPreparedDraftId: preparedDraft.targetPreparedDraftId ?? null,
    targetCandidateItemId: preparedDraft.targetCandidateItemId ?? null,
    targetPositionId: preparedDraft.targetPositionId ?? null,
    candidateRaterVisibleText: candidateRaterVisibleText ? candidateRaterVisibleText.trim() : null,
    candidateSourceCardContent,
    candidateItemStatus: "candidate_review_pending",
    downstreamPromotionStatus: "not_promoted_to_live",
    publicReleaseEligibilityStatus: input.publicReleaseEligibilityStatus ?? "pending_review",
    modelTrainingExportEligibilityStatus: input.modelTrainingExportEligibilityStatus ?? "pending_review",
    validationUseEligibilityStatus: input.validationUseEligibilityStatus ?? "pending_review",
    hiddenBenchmarkEligibilityStatus: input.hiddenBenchmarkEligibilityStatus ?? "pending_review",
    assignmentExclusionRequired: true,
    visibilityClasses: {
      candidateRaterVisibleText: "rater_visible_after_promotion",
      sourcePreparedDraftId: "admin_only",
      sourceContributionPartId: "admin_only",
      sourceArgumentExtractionId: "admin_only",
      sourceExtractionBatchId: "admin_only",
      sourceCardId: "admin_only",
      sourceSpanIds: "admin_only",
    },
    createdAt: now,
    createdBy: actor?.id ?? null,
  };
  const promotionRecord = {
    id: input.promotionRecordId ?? nextContributionId("promotion-record", options),
    sourcePreparedDraftId: preparedDraft.id,
    targetCandidateItemId: candidateItem.id,
    targetType: candidateItem.itemType,
    promotedBy: actor?.id ?? null,
    promotedAt: now,
    createdLiveRecord: false,
    createdCandidateBatch: false,
    auditTrail: {
      sourceType: preparedDraft.sourceArgumentExtractionId ? "argument_extraction" : "contribution_part",
      contributionSubmissionId: preparedDraft.sourceSubmissionId ?? null,
      contributionPartId: preparedDraft.sourceContributionPartId ?? null,
      argumentExtractionId: preparedDraft.sourceArgumentExtractionId ?? null,
      extractionBatchId: preparedDraft.sourceExtractionBatchId ?? null,
      sourceCardId: preparedDraft.sourceCardId ?? null,
      sourceSpanIds: normalizeStringArray(preparedDraft.sourceSpanIds),
      preparedDraftId: preparedDraft.id,
      candidateItemId: candidateItem.id,
    },
  };
  return {
    ok: true,
    resources: {
      candidateItem: [candidateItem],
      promotionRecord: [promotionRecord],
    },
    candidateItem,
    promotionRecord,
  };
}

function sourceExtractionPreparedText(extraction, input, draftType) {
  const explicit = input.preparedText ?? input.prepared_text ?? null;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  const candidate =
    draftType === "prepared_position_draft"
      ? extraction.possiblePreparedPositionText ?? extraction.extractedPositionText ?? extraction.intendedConclusion
      : extraction.possiblePreparedCritiqueText;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
}

function preparedDraftCandidateRaterVisibleText(input, preparedText) {
  const explicit = input.candidateRaterVisibleText ?? input.candidate_rater_visible_text ?? null;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return typeof preparedText === "string" && preparedText.trim() ? preparedText.trim() : null;
}

function preparedDraftCreationReviewBypassFields(input, preparedDraftStatus) {
  const failures = [];
  if ([PROMOTABLE_PREPARED_DRAFT_STATUS, "promoted_to_candidate_item"].includes(preparedDraftStatus)) {
    failures.push("preparedDraftStatus");
  }
  for (const [field, initialStatus] of Object.entries(INITIAL_PREPARED_DRAFT_REVIEW_STATUSES)) {
    const snakeField = field.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
    const value = input[field] ?? input[snakeField];
    if (value !== undefined && value !== null && value !== initialStatus) failures.push(field);
  }
  return failures;
}

export function sanitizeContributionSubmissionForUser(submission, resources = {}) {
  const parts = (resources.contributionParts ?? []).filter((part) => part.submissionId === submission.id);
  const preparedDrafts = resources.preparedDrafts ?? [];
  const clarificationRequests = (resources.clarificationRequests ?? []).filter(
    (request) => request.submissionId === submission.id || parts.some((part) => part.id === request.contributionPartId),
  );
  const rollupStatus = contributionRollupStatus(submission, parts, preparedDrafts, clarificationRequests);
  return {
    id: submission.id,
    templateKey: submission.templateKey,
    type: submission.templateKey,
    titleOrPreview: contributionSubmissionPreview(submission, parts),
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    status: rollupStatus,
    statusLabel: plainContributionStatus(rollupStatus),
    parts: parts.map((part) => ({
      id: part.id,
      partType: part.partType,
      status: part.partReviewStatus,
      statusLabel: plainContributionStatus(part.partReviewStatus),
      preview: partPreview(part),
    })),
    clarificationRequests: clarificationRequests.map((request) => ({
      id: request.id,
      prompt: request.userFacingPrompt ?? request.prompt ?? "Please clarify this submission.",
      concerns: {
        contributionPartId: request.contributionPartId ?? null,
        preparedDraftId: request.preparedDraftId ?? null,
      },
      status: request.status ?? "open",
    })),
  };
}

export function contributionRollupStatus(submission, parts = [], preparedDrafts = [], clarificationRequests = []) {
  if (submission.reviewStatus === "draft" || submission.state === "draft") return "draft";
  if (clarificationRequests.some((request) => (request.status ?? "open") === "open")) return "needs_clarification";
  const partStatuses = parts.map((part) => part.partReviewStatus);
  if (partStatuses.length && partStatuses.every((status) => status === "rejected")) return "rejected";
  if (partStatuses.some((status) => status === "accepted_for_preparation" || status === "prepared_draft_created")) {
    return partStatuses.some((status) => ["submitted_pending_review", "needs_clarification", "rejected"].includes(status))
      ? "partly_accepted"
      : "accepted_for_further_review";
  }
  if (preparedDrafts.some((draft) => draft.sourceSubmissionId === submission.id && draft.preparedDraftStatus === "drafting")) return "being_prepared";
  return submission.reviewStatus ?? "submitted_pending_review";
}

export function plainContributionStatus(status) {
  const labels = {
    draft: "Draft",
    submitted_pending_review: "Pending review",
    needs_clarification: "Needs your response",
    being_prepared: "Being prepared for further review",
    partly_accepted: "Partly accepted for further review",
    accepted_for_further_review: "Accepted for further review",
    accepted_for_preparation: "Accepted for further review",
    prepared_draft_created: "Being prepared for further review",
    rejected: "Not accepted",
    closed: "Closed",
  };
  return labels[status] ?? "Pending review";
}

function validateTemplateParts(template, partsInput, options = {}) {
  const expectedPartTypes = [...template.partSchemas];
  const actualPartTypes = partsInput.map((part) => part.type);
  for (const partType of expectedPartTypes) {
    if (!actualPartTypes.includes(partType)) return invalidContribution("missing_contribution_part", `${template.templateKey} requires ${partType}.`);
  }
  for (const part of partsInput) {
    const schema = CONTRIBUTION_PART_SCHEMAS[part.type];
    if (!schema || !expectedPartTypes.includes(part.type)) {
      return invalidContribution("invalid_contribution_part_type", `${part.type ?? "unknown"} is not allowed for ${template.templateKey}.`);
    }
    const fields = normalizePartFields(part, schema);
    if (!options.isDraft) {
      for (const field of schema.requiredVisibleFields) {
        if (fields[field.key] === undefined || fields[field.key] === null || String(fields[field.key]).trim() === "") {
          return invalidContribution("missing_required_visible_field", `${part.type}.${field.key} is required.`);
        }
      }
    }
    if (schema.requiresOriginDisclosure && !options.isDraft) {
      const originChoice = normalizeOriginChoice(part.originDisclosure?.origin_choice ?? part.originDisclosure?.originChoice);
      if (!originChoice) return invalidContribution("origin_disclosure_required", `${part.type} requires origin_choice.`);
    }
  }
  if (template.requiredPartLinks.includes("critique_targets_existing_position")) {
    const critique = partsInput.find((part) => part.type === "critique_text");
    const targetId = critique?.targetExistingPositionId ?? critique?.target_existing_position_id;
    if (!options.isDraft && !targetId) return invalidContribution("critique_target_required", "critique_existing requires an existing position target.");
    if (targetId && options.eligiblePositionIds?.length && !options.eligiblePositionIds.includes(targetId)) {
      return invalidContribution("critique_target_not_eligible", `Existing position ${targetId} is not eligible for contribution critique.`);
    }
  }
  return { ok: true };
}

function normalizePartFields(partInput, schema) {
  const fields = { ...(partInput.fields ?? {}) };
  [...schema.requiredVisibleFields.map((field) => field.key), ...schema.optionalVisibleFields].forEach((key) => {
    if (partInput[key] !== undefined && fields[key] === undefined) fields[key] = partInput[key];
  });
  return fields;
}

function buildPartLinks(template, partsInput, contributionParts, partIdsByClientId, now, options) {
  if (template.requiredPartLinks.includes("critique_targets_position_part")) {
    const positionPart = contributionParts.find((part) => part.partType === "position_text");
    const critiquePart = contributionParts.find((part) => part.partType === "critique_text");
    if (positionPart && critiquePart) {
      return [
        {
          id: nextContributionId("contribution-part-link", options),
          linkType: "critique_targets_position_part",
          fromPartId: critiquePart.id,
          toPartId: positionPart.id,
          createdAt: now,
        },
      ];
    }
  }
  if (template.requiredPartLinks.includes("critique_targets_existing_position")) {
    const critiqueInput = partsInput.find((part) => part.type === "critique_text");
    const critiquePart = contributionParts.find((part) => part.partType === "critique_text");
    if (critiqueInput && critiquePart) {
      return [
        {
          id: nextContributionId("contribution-part-link", options),
          linkType: "critique_targets_existing_position",
          fromPartId: critiquePart.id,
          toExistingPositionId: critiqueInput.targetExistingPositionId ?? critiqueInput.target_existing_position_id,
          createdAt: now,
        },
      ];
    }
  }
  return [];
}

function normalizeOriginDisclosure(originInput, contributionPartId, now, options) {
  const originChoice = normalizeOriginChoice(originInput.origin_choice ?? originInput.originChoice);
  const config = ORIGIN_CHOICES.find((choice) => choice.key === originChoice) ?? ORIGIN_CHOICES[0];
  const sourceDetails = {};
  for (const field of config.extraFields ?? []) {
    if (originInput[field] !== undefined) sourceDetails[field] = originInput[field];
  }
  return {
    id: originInput.id ?? nextContributionId("origin-disclosure", options),
    contributionPartId,
    origin_choice: config.key,
    originChoiceLabel: config.label,
    sourceDetails,
    llmAssistanceDescription: originInput.llm_assistance_description ?? originInput.llmAssistanceDescription ?? null,
    originNote: originInput.origin_note_optional ?? originInput.originNote ?? null,
    backendFlags: { ...config.backendFlags },
    visibilityClasses: {
      origin_choice: "reviewer_visible",
      sourceDetails: "never_rater_visible",
      llmAssistanceDescription: "never_rater_visible",
      originNote: "reviewer_visible",
    },
    createdAt: now,
  };
}

function normalizeOriginChoice(value) {
  const normalized = normalizeKey(value);
  if (!normalized) return null;
  if (normalized === "selfwritten" || normalized === "iwrotethismyself") return "self_written";
  if (normalized === "adaptedfromsource" || normalized === "adaptedfromabookarticlesource") return "adapted_from_source";
  if (normalized === "directquote" || normalized === "quoteddirectlyfromasource") return "direct_quote";
  if (normalized === "aiassisted" || normalized === "generatedorsubstantiallyhelpedbyai") return "ai_assisted";
  if (normalized === "othernotsure") return "other_not_sure";
  return ORIGIN_CHOICES.some((choice) => normalizeKey(choice.key) === normalized) ? ORIGIN_CHOICES.find((choice) => normalizeKey(choice.key) === normalized).key : null;
}

function buildPreliminaryReviewSignals(part, originDisclosure, now, options) {
  const signalTypes = new Set();
  const originConfig = ORIGIN_CHOICES.find((choice) => choice.key === originDisclosure?.origin_choice);
  for (const signal of originConfig?.preliminaryReviewSignals ?? []) signalTypes.add(signal);
  const text = String(part.submittedText ?? Object.values(part.rawFields ?? {}).join(" "));
  const sourceDetails = originDisclosure?.sourceDetails ?? {};
  if (["adapted_from_source", "direct_quote"].includes(originDisclosure?.origin_choice) && !hasSourceLocator(sourceDetails)) {
    signalTypes.add("missing_source_locator");
  }
  if (originDisclosure?.origin_choice === "direct_quote") {
    signalTypes.add("likely_source_leakage");
    signalTypes.add("rater_visibility_risk");
  }
  if (originDisclosure?.origin_choice === "ai_assisted") signalTypes.add("possible_ai_assisted");
  if (originDisclosure?.origin_choice === "other_not_sure") signalTypes.add("target_link_unclear");
  if (/https?:\/\//i.test(text) || /\b(author|chapter|page|according to)\b/i.test(text)) signalTypes.add("likely_source_leakage");
  if ((part.partType === "position_text" || part.partType === "critique_text") && text.trim().length > 0 && text.trim().length < 24) {
    signalTypes.add("spam_or_low_effort");
  }
  return [...signalTypes].map((signalType) => ({
    id: nextContributionId(`review-signal-${signalType}`, options),
    signalType,
    source: signalType.endsWith("_signal") ? "deterministic_rule" : "automated_prescreen",
    confidence: signalType === "spam_or_low_effort" ? 0.7 : null,
    explanation: preliminarySignalExplanation(signalType),
    affectedObjectType: "ContributionPart",
    affectedObjectId: part.id,
    visibilityClass: "admin_only",
    createdAt: now,
  }));
}

function preliminarySignalExplanation(signalType) {
  const explanations = {
    source_locator_signal: "Origin disclosure says source details may need review.",
    possible_source_leakage_signal: "Direct quotation can reveal source information before blinding review.",
    possible_blinding_risk_signal: "Submitted provenance may need blinding before candidate-item creation.",
    missing_source_locator: "Adapted or directly quoted material did not include a locator.",
    likely_source_leakage: "Submitted text or origin choice may reveal source-identifying details.",
    rater_visibility_risk: "Rater-visible text must be prepared and checked before candidate use.",
    llm_assistance_signal: "User disclosed AI assistance.",
    possible_ai_assisted: "User disclosed or text may involve AI assistance.",
    unclear_origin_signal: "User selected other or not sure for origin.",
    target_link_unclear: "The target link may require reviewer confirmation.",
    spam_or_low_effort: "Submitted text is short enough to require abuse or low-effort review.",
  };
  return explanations[signalType] ?? "Preliminary contribution review signal.";
}

function hasSourceLocator(sourceDetails) {
  return Boolean(
    sourceDetails.source_title_optional ||
      sourceDetails.page_or_locator_optional ||
      sourceDetails.source_url_optional ||
      sourceDetails.publisher_optional ||
      sourceDetails.publication_year_optional,
  );
}

function contributionSubmissionPreview(submission, parts) {
  const titledPart = parts.find((part) => part.rawFields?.submission_title_optional);
  if (titledPart) return String(titledPart.rawFields.submission_title_optional).slice(0, 120);
  return partPreview(parts[0]) || submission.templateKey;
}

function partPreview(part) {
  if (!part) return "";
  if (part.partType === "source_suggestion") return String(part.rawFields?.source_title ?? "").slice(0, 120);
  return String(part.submittedText ?? part.rawFields?.submitted_text ?? "").slice(0, 120);
}

function nextContributionId(prefix, options = {}) {
  if (typeof options.idFactory === "function") return options.idFactory(prefix);
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${suffix}`;
}

function findForbiddenContributionKeys(value, prefix = "") {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => findForbiddenContributionKeys(item, `${prefix}[${index}]`));
  return Object.entries(value).flatMap(([key, child]) => {
    const normalized = normalizeKey(key);
    const path = prefix ? `${prefix}.${key}` : key;
    const own = forbiddenContributionFieldNames.has(normalized) || [...forbiddenContributionFieldNames].some((field) => normalized === normalizeKey(field))
      ? [path]
      : [];
    return own.concat(findForbiddenContributionKeys(child, path));
  });
}

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item) : [];
}

function stableHash(value) {
  let hash = 0;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash = (Math.imul(31, hash) + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function invalidContribution(error, detail) {
  return { ok: false, error, detail };
}
