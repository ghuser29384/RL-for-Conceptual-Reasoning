import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { FileEventStore } from "../src/staging-event-store.mjs";
import { StagingWorkflowService } from "../src/staging-service.mjs";

const outputPath = resolve(process.env.STAGING_TABLETOP_REPORT ?? ".staging-evidence/human-workflow-support-tabletop-report.json");
const temporaryRoot = await mkdtemp(join(tmpdir(), "metaphilosophy-support-tabletop-"));
const eventFile = resolve(temporaryRoot, "events.jsonl");
const store = new FileEventStore({ filePath: eventFile });
const service = new StagingWorkflowService({ store });
const bootstrapSecret = "synthetic-support-tabletop-bootstrap-secret-32-bytes";
const timeline = [];

await service.initialize();

const bootstrap = await service.bootstrap({
  bootstrapToken: bootstrapSecret,
  expectedBootstrapToken: bootstrapSecret,
  operatorEmail: "operator@support-tabletop.metaphilosophy.invalid",
});
timeline.push(eventStep("T+00", "Support lead initializes an isolated synthetic event store and operator identity.", "pass"));

const operatorAuth = await service.redeemInvite({ token: bootstrap.inviteToken, userAgent: "synthetic-support-tabletop" });
const rater = await service.createIdentity({
  actorSessionToken: operatorAuth.sessionToken,
  role: "rater",
  displayName: "Synthetic support-tabletop rater",
  email: "rater@support-tabletop.metaphilosophy.invalid",
});
const original = await service.createInvite({
  actorSessionToken: operatorAuth.sessionToken,
  identityId: rater.identity.id,
  expiresInHours: 2,
});
timeline.push(eventStep("T+05", "A one-time synthetic rater invitation is issued; no real person receives it.", "pass"));

const incident = {
  incident_id: "H10-TABLETOP-2026-08-06-INVITE-COMPROMISE",
  scenario: "A rater reports that an unused one-time invitation may have been exposed before redemption.",
  severity: "P1",
  severity_reason: "A plausible credential disclosure could permit unauthorized access, but no protected item or accepted research record exists in this synthetic exercise.",
  stop_rule: "Stop access issuance, revoke the suspected credential immediately, retain the audit trail, and do not resume until replacement access is proved isolated.",
};
timeline.push(eventStep("T+10", "Ellen Sun, acting as operations owner and support lead, classifies the suspected token exposure as P1 and invokes the stop rule.", "pass"));

const revoked = await service.revokeInvite({
  actorSessionToken: operatorAuth.sessionToken,
  inviteId: original.invite.id,
  reason: "P1 synthetic suspected credential disclosure tabletop",
});
assert.equal(revoked.changed, true);
await assert.rejects(
  () => service.redeemInvite({ token: original.token, userAgent: "synthetic-unauthorized-attempt" }),
  (error) => error.status === 401 && error.code === "revoked_invite",
);
timeline.push(eventStep("T+12", "The exposed invitation is revoked and a redemption attempt is denied fail-closed.", "pass"));

const replacement = await service.replaceInvite({
  actorSessionToken: operatorAuth.sessionToken,
  inviteId: original.invite.id,
  expiresInHours: 2,
});
const replacementAuth = await service.redeemInvite({ token: replacement.token, userAgent: "synthetic-authorized-recovery" });
assert.equal(replacementAuth.identity.id, rater.identity.id);
await assert.rejects(
  () => service.redeemInvite({ token: original.token, userAgent: "synthetic-repeat-old-token" }),
  (error) => error.status === 401 && error.code === "revoked_invite",
);
timeline.push(eventStep("T+20", "A replacement invitation is issued through the controlled operator path, redeemed once by the synthetic rater, and the original remains unusable.", "pass"));

const logout = await service.logout(replacementAuth.sessionToken);
assert.equal(logout.changed, true);
const chain = await store.verifyChain();
const privateExport = await service.operatorExport({ actorSessionToken: operatorAuth.sessionToken, publicOnly: false });
const inviteRecords = privateExport.state.invites;
const originalRecord = inviteRecords.find((invite) => invite.id === original.invite.id);
const replacementRecord = inviteRecords.find((invite) => invite.id === replacement.invite.id);
assert.ok(originalRecord.revokedAt);
assert.ok(replacementRecord.usedAt);
assert.ok(privateExport.state.auditEvents.some((entry) => entry.action === "invite.revoked"));
assert.ok(privateExport.state.auditEvents.some((entry) => entry.action === "invite.replaced"));
timeline.push(eventStep("T+25", "The recovered session is logged out and the append-only chain plus revocation/replacement audit events are read back successfully.", "pass"));

const report = {
  schema_version: "metaphilosophy-human-workflow-support-tabletop-v1",
  generated_at: new Date().toISOString(),
  status: "pass",
  scope: "isolated automated synthetic support tabletop only",
  incident,
  named_roles: {
    operations_owner: "Ellen Sun",
    support_lead: "Ellen Sun",
    incident_reporter: "Synthetic support-tabletop rater",
    recovery_operator: "Ellen Sun",
    independent_verifier: "GitHub Actions exact-commit staging gate",
  },
  private_support_route: {
    primary: "Private owner-controlled incident channel supplied with the dry-run invitation; never a public repository issue or public form.",
    required_report_fields: ["time observed", "affected invitation or assignment", "suspected disclosure type", "whether the credential was used", "safe callback route"],
    public_disclosure_rule: "Do not paste invitation tokens, cookies, protected items, ratings, payment data, or identity documents into public channels.",
  },
  severity_and_response_rules: {
    P0: "Confirmed protected-data disclosure, unauthorized accepted write, or loss of audit integrity: revoke all affected access, freeze the rehearsal, preserve evidence, and require exact-release re-verification before any restart.",
    P1: "Plausible credential compromise, inaccessible required workflow, wrong item/version, or database availability failure: stop the affected session, revoke or isolate access, recover, and verify before resumption.",
    P2: "Non-blocking usability or documentation defect with a safe workaround: record, bound the workaround, and obtain owner acceptance before H-11 may pass.",
    P3: "Cosmetic or low-impact issue: record for ordinary remediation without representing it as readiness evidence.",
  },
  timeline,
  evidence: {
    event_file_kind: "temporary isolated FileEventStore",
    event_count: privateExport.chain.events,
    chain_head_hash: privateExport.chain.headHash,
    verified_chain_length: chain.events,
    original_invite_id: original.invite.id,
    replacement_invite_id: replacement.invite.id,
    old_token_redeem_denied_after_revocation: true,
    replacement_token_single_redemption_passed: true,
    old_token_remained_denied_after_recovery: true,
    recovered_session_logout_passed: true,
    audit_revocation_present: true,
    audit_replacement_present: true,
  },
  outcome: {
    access_restored_without_reusing_the_suspected_credential: true,
    accepted_rating_changed_or_deleted: false,
    protected_or_real_item_present: false,
    real_person_contacted: false,
    research_rating_collected: false,
    payment_promised_or_made: false,
    outbound_message_sent: false,
    research_ratings_authorized: false,
  },
  residual_limits: [
    "This automated tabletop proves the credential-revocation and recovery mechanics, not human response-time performance.",
    "The exact private support channel and coverage window must be supplied and accepted before H-11 outreach.",
    "A hosted database outage exercise remains part of H-06 and cannot be inferred from this file-backed incident drill.",
  ],
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

function eventStep(offset, action, result) {
  return { offset, action, result };
}
