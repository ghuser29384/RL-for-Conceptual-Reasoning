import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [api, service, index, app] = await Promise.all([
  readFile(new URL("../api/staging.mjs", import.meta.url), "utf8"),
  readFile(new URL("../src/staging-service.mjs", import.meta.url), "utf8"),
  readFile(new URL("../staging/index.html", import.meta.url), "utf8"),
  readFile(new URL("../staging/app.mjs", import.meta.url), "utf8"),
]);

test("the narrow H-11 candidate binds hosted access to the exact runtime release", () => {
  assert.match(api, /expectedReleaseSha:\s*runtime\.environment\.VERCEL_GIT_COMMIT_SHA\s*\?\?\s*null/u);
  assert.match(service, /H11-ACCESS-GATE-2026-08-07-V2/u);
  assert.match(service, /h11_release_sha_mismatch/u);
  assert.match(service, /activeSessionMatchesCurrentAccessGate/u);
  assert.match(service, /h11_active_session_exists/u);
});

test("the narrow H-11 candidate persistently stores only pseudonymous participant identity state", () => {
  assert.match(service, /h11_pseudonym_required/u);
  assert.match(service, /contactRouteValidated:\s*true/u);
  assert.match(service, /directContactPersisted:\s*false/u);
  assert.match(service, /h11_identity_not_minimized/u);
  assert.match(index, /validated in the request and then discarded/u);
  assert.match(app, /validated transiently · not persisted/u);
});

test("the candidate keeps access and research authorization separate", () => {
  assert.match(api, /researchRatingsAuthorized:\s*false/u);
  assert.match(service, /synthetic_rehearsal_only/u);
  assert.match(app, /Still no access issuance/u);
});
