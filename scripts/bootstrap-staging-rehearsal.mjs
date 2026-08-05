import { chmod, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createStagingEventStore } from "../src/staging-event-store.mjs";
import { StagingWorkflowService } from "../src/staging-service.mjs";

const args = new Set(process.argv.slice(2));
if (!args.has("--confirm-synthetic-rehearsal")) {
  console.error("Refusing to bootstrap. Re-run with --confirm-synthetic-rehearsal after confirming that the target is an isolated non-production staging store.");
  process.exit(2);
}

const environment = process.env;
const databaseUrl = environment.METAPHILOSOPHY_STAGING_DATABASE_URL ?? environment.STAGING_DATABASE_URL ?? null;
const dataDir = resolve(environment.STAGING_DATA_DIR ?? ".staging-data");
const filePath = databaseUrl ? null : resolve(dataDir, "events.jsonl");
const bootstrapToken = environment.STAGING_BOOTSTRAP_TOKEN;
if (!bootstrapToken || bootstrapToken.length < 24) {
  throw new Error("STAGING_BOOTSTRAP_TOKEN must be configured with at least 24 characters.");
}

const store = createStagingEventStore({ databaseUrl, filePath, environment });
const service = new StagingWorkflowService({ store });
await service.initialize();

const bootstrap = await service.bootstrap({
  bootstrapToken,
  expectedBootstrapToken: bootstrapToken,
  operatorEmail: environment.STAGING_OPERATOR_EMAIL ?? "operator@staging.metaphilosophy.invalid",
});
const operatorAccess = await service.redeemInvite({ token: bootstrap.inviteToken, userAgent: "bootstrap-script" });

const raterOne = await service.createIdentity({
  actorSessionToken: operatorAccess.sessionToken,
  role: "rater",
  displayName: "Synthetic dry-run rater A",
  email: "rater-a@staging.metaphilosophy.invalid",
});
const raterTwo = await service.createIdentity({
  actorSessionToken: operatorAccess.sessionToken,
  role: "rater",
  displayName: "Synthetic dry-run rater B",
  email: "rater-b@staging.metaphilosophy.invalid",
});
const adjudicator = await service.createIdentity({
  actorSessionToken: operatorAccess.sessionToken,
  role: "adjudicator",
  displayName: "Synthetic dry-run adjudicator",
  email: "adjudicator@staging.metaphilosophy.invalid",
});

const raterOneInvite = await service.createInvite({ actorSessionToken: operatorAccess.sessionToken, identityId: raterOne.identity.id, expiresInHours: 24 });
const raterTwoInvite = await service.createInvite({ actorSessionToken: operatorAccess.sessionToken, identityId: raterTwo.identity.id, expiresInHours: 24 });
const adjudicatorInvite = await service.createInvite({ actorSessionToken: operatorAccess.sessionToken, identityId: adjudicator.identity.id, expiresInHours: 24 });

const assignmentOne = await service.createAssignment({ actorSessionToken: operatorAccess.sessionToken, identityId: raterOne.identity.id, positionId: bootstrap.positionId, kind: "initial" });
const assignmentTwo = await service.createAssignment({ actorSessionToken: operatorAccess.sessionToken, identityId: raterTwo.identity.id, positionId: bootstrap.positionId, kind: "initial" });

const credentials = {
  generatedAt: new Date().toISOString(),
  purpose: "synthetic_rehearsal_only",
  researchRatingsAuthorized: false,
  operator: {
    identityId: bootstrap.operatorId,
    sessionToken: operatorAccess.sessionToken,
    sessionExpiresAt: operatorAccess.session.expiresAt,
  },
  raters: [
    { identityId: raterOne.identity.id, inviteId: raterOneInvite.invite.id, inviteToken: raterOneInvite.token, assignmentId: assignmentOne.assignment.id },
    { identityId: raterTwo.identity.id, inviteId: raterTwoInvite.invite.id, inviteToken: raterTwoInvite.token, assignmentId: assignmentTwo.assignment.id },
  ],
  adjudicator: { identityId: adjudicator.identity.id, inviteId: adjudicatorInvite.invite.id, inviteToken: adjudicatorInvite.token },
  positionId: bootstrap.positionId,
};

const outputPath = resolve(environment.STAGING_CREDENTIALS_FILE ?? dataDir, environment.STAGING_CREDENTIALS_FILE ? "" : "rehearsal-credentials.json");
await mkdir(resolve(outputPath, ".."), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(credentials, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
await chmod(outputPath, 0o600);

console.log(JSON.stringify({
  status: "bootstrapped",
  purpose: credentials.purpose,
  researchRatingsAuthorized: false,
  outputPath,
  raterAssignments: credentials.raters.length,
  adjudicatorInvites: 1,
  positionId: credentials.positionId,
}, null, 2));

if (typeof store.close === "function") await store.close();
