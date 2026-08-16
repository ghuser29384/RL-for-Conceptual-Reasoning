import {
  analyzeInterpretationCauseCodes as analyzeBaseInterpretationCauseCodes,
} from "./pilot-interpretation-cause-coding.mjs";

export {
  CAUSE_CODE_STAGE,
  INTERPRETATION_CAUSE_CODES,
  INTERPRETATION_CONFIDENCE_OPTIONS,
  INTERPRETATION_ROLE_MASKS,
  PRICED_IN_ASSESSMENTS,
  RECONCILIATION_DISPOSITIONS,
  PilotInterpretationCauseCodingError,
  assertPublicInterpretationCauseCodingReport,
  generateInterpretationCauseCodingPackets,
  sanitizeInterpretationCauseCodingAnalysis,
  sanitizeInterpretationCauseCodingPacketReport,
  validateInterpretationCauseCodeDataset,
  validateInterpretationCauseCodingControl,
  validateInterpretationCauseReconciliations,
} from "./pilot-interpretation-cause-coding.mjs";

const UNRESOLVED = "unresolved_or_indeterminate";
const SHARED = "shared_classification";

export function analyzeInterpretationCauseCodes(packetReport, codeDataset, reconciliations = []) {
  const report = analyzeBaseInterpretationCauseCodes(packetReport, codeDataset, reconciliations);
  const codesByPair = groupBy(codeDataset.initial_codes ?? [], (row) => row.pair_id);
  const reconciliationByPair = new Map((reconciliations ?? []).map((row) => [row.pair_id, row]));

  let exactAgreementPairs = 0;
  let rawDisagreementPairs = 0;
  let rawUnresolvedOrDisagreedPairs = 0;
  let finalUnresolvedPairs = 0;

  for (const [pairId, rows] of codesByPair) {
    const codeSets = rows
      .map((row) => [...new Set(row.cause_codes ?? [])].sort())
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    const exactAgreement = codeSets.length === 2 && sameArray(codeSets[0], codeSets[1]);
    const anyInitialUnresolved = codeSets.some((codes) => codes.includes(UNRESOLVED));
    if (exactAgreement) exactAgreementPairs += 1;
    else rawDisagreementPairs += 1;
    if (!exactAgreement || anyInitialUnresolved) rawUnresolvedOrDisagreedPairs += 1;

    const reconciliation = reconciliationByPair.get(pairId);
    if (reconciliation) {
      if (reconciliation.disposition !== SHARED) finalUnresolvedPairs += 1;
    } else if (!exactAgreement || anyInitialUnresolved) {
      finalUnresolvedPairs += 1;
    }
  }

  report.analysis = {
    ...report.analysis,
    exact_agreement_pairs: exactAgreementPairs,
    raw_disagreement_pairs: rawDisagreementPairs,
    raw_unresolved_or_disagreed_pairs: rawUnresolvedOrDisagreedPairs,
    exact_agreement_rate: codesByPair.size ? exactAgreementPairs / codesByPair.size : null,
    raw_disagreement_rate: codesByPair.size ? rawDisagreementPairs / codesByPair.size : null,
    final_unresolved_pairs: finalUnresolvedPairs,
    final_unresolved_rate: codesByPair.size ? finalUnresolvedPairs / codesByPair.size : null,
  };
  report.governance = {
    ...report.governance,
    raw_disagreement_and_unresolved_union_reported: true,
    unresolved_initial_classification_remains_unresolved_without_shared_reconciliation: true,
  };
  return report;
}

function groupBy(values, keyFunction) {
  const groups = new Map();
  for (const value of values) {
    const key = keyFunction(value);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(value);
  }
  return groups;
}

function sameArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
