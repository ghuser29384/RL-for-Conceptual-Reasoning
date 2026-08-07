#!/usr/bin/env bash
set -euo pipefail

: "${BASE_SHA:?BASE_SHA is required}"
: "${SOURCE_SHA:?SOURCE_SHA is required}"
: "${CANDIDATE_BRANCH:?CANDIDATE_BRANCH is required}"
: "${POSTGRES_ADMIN_URL:?POSTGRES_ADMIN_URL is required}"
: "${STAGING_SOURCE_DATABASE_URL:?STAGING_SOURCE_DATABASE_URL is required}"
: "${STAGING_RESTORE_DATABASE_URL:?STAGING_RESTORE_DATABASE_URL is required}"

if [[ "${GITHUB_REF_NAME:-}" != "$CANDIDATE_BRANCH" ]]; then
  echo "Refusing to assemble from unexpected branch: ${GITHUB_REF_NAME:-unset}" >&2
  exit 1
fi
if [[ "$CANDIDATE_BRANCH" == "release/vercel-preview" || "$CANDIDATE_BRANCH" == "main" ]]; then
  echo "Candidate assembly must not run on a deployment or production branch." >&2
  exit 1
fi

git merge-base --is-ancestor "$BASE_SHA" HEAD
test "$(git merge-base "$BASE_SHA" HEAD)" = "$BASE_SHA"
git cat-file -e "$SOURCE_SHA^{commit}"

npm ci

SOURCE_PATHS=(
  api/staging.mjs
  src/staging-service.mjs
  staging/app.mjs
  staging/index.html
  staging/participant-readiness.css
  staging/participant-readiness.mjs
  scripts/verify-human-workflow-staging.mjs
  e2e/human-workflow-staging.spec.mjs
  e2e/participant-readiness.spec.mjs
  e2e/staging.playwright.config.mjs
  test/h11-access-gate-contract.test.mjs
  test/human-workflow-staging-contract.test.mjs
  ops/next-steps-2026-07-23/h11-integrated-consent-debrief-flow-2026-08-07.md
  ops/next-steps-2026-07-23/h11-fail-closed-access-issuance-gate-2026-08-07.md
)

git checkout "$SOURCE_SHA" -- "${SOURCE_PATHS[@]}"

cat > test/h11-narrow-candidate-contract.test.mjs <<'EOF'
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
EOF

python - <<'PY'
import json
from pathlib import Path

manifest = {
    "candidate_id": "H11-NARROW-PROTECTED-STAGING-CANDIDATE-2026-08-07-V1",
    "status": "assembled_pending_exact_validation",
    "base_release_commit": "202135a21fb15f5a12698e6a78e8c8d8b7fa79ef",
    "validated_source_snapshot": "aec2004789be192f2fb08e98f365faa371f20ba7",
    "target_branch": "candidate/h11-protected-staging-20260807",
    "deployment_authorized": False,
    "protected_release_branch_advanced": False,
    "participant_access_authorized": False,
    "participant_access_issued": False,
    "research_ratings_authorized": False,
    "real_research_rating_collected": False,
    "outbound_participant_message_sent": False,
    "payment_committed_or_made": False,
    "scope": [
        "integrated H-11 synthetic-session consent and debrief",
        "fail-closed H-11 access issuance",
        "V2 exact-release and session binding",
        "direct-identifier minimization",
        "focused contract and rendered-browser evidence"
    ],
    "excluded": [
        "public editorial changes",
        "argument-library changes",
        "reviewer recruitment changes",
        "production changes",
        "funding changes",
        "participant outreach or access issuance",
        "research-use authorization"
    ]
}
Path("ops/next-steps-2026-07-23/h11-narrow-protected-staging-candidate-2026-08-07-v1.json").write_text(
    json.dumps(manifest, indent=2) + "\n",
    encoding="utf-8",
)
PY

rm -f \
  .github/workflows/assemble-h11-protected-candidate-once.yml \
  .github/workflows/resume-h11-protected-candidate-v2.yml \
  scripts/assemble-h11-protected-candidate-v2.sh

git config user.name "ghuser29384"
git config user.email "262476329+ghuser29384@users.noreply.github.com"
git add -A
git commit -m "Assemble narrow H-11 protected staging candidate"
PRODUCT_SHA="$(git rev-parse HEAD)"
export PRODUCT_SHA

echo "Validated product candidate commit will be $PRODUCT_SHA"

python - <<'PY'
import os
import subprocess

base = os.environ["BASE_SHA"]
actual = set(subprocess.check_output(["git", "diff", "--name-only", f"{base}..HEAD"], text=True).splitlines())
allowed = {
    "api/staging.mjs",
    "src/staging-service.mjs",
    "staging/app.mjs",
    "staging/index.html",
    "staging/participant-readiness.css",
    "staging/participant-readiness.mjs",
    "scripts/verify-human-workflow-staging.mjs",
    "e2e/human-workflow-staging.spec.mjs",
    "e2e/participant-readiness.spec.mjs",
    "e2e/staging.playwright.config.mjs",
    "test/h11-access-gate-contract.test.mjs",
    "test/h11-narrow-candidate-contract.test.mjs",
    "test/human-workflow-staging-contract.test.mjs",
    "ops/next-steps-2026-07-23/h11-integrated-consent-debrief-flow-2026-08-07.md",
    "ops/next-steps-2026-07-23/h11-fail-closed-access-issuance-gate-2026-08-07.md",
    "ops/next-steps-2026-07-23/h11-narrow-protected-staging-candidate-2026-08-07-v1.json",
}
unexpected = sorted(actual - allowed)
missing = sorted(allowed - actual)
if unexpected or missing:
    raise SystemExit(f"Candidate surface mismatch. Unexpected={unexpected}; Missing={missing}; Actual={sorted(actual)}")
print("Exact narrow candidate paths:")
for path in sorted(actual):
    print(path)
PY

test ! -e .github/workflows/assemble-h11-protected-candidate-once.yml
test ! -e .github/workflows/resume-h11-protected-candidate-v2.yml
test ! -e scripts/assemble-h11-protected-candidate-v2.sh
test -z "$(git status --porcelain)"

# The two imported Markdown records intentionally use two trailing spaces for
# hard line breaks. Apply whitespace validation to executable and structured
# candidate files, while preserving those source records byte-for-byte.
git diff --check "$BASE_SHA..HEAD" -- \
  api/staging.mjs \
  src/staging-service.mjs \
  staging/app.mjs \
  staging/index.html \
  staging/participant-readiness.css \
  staging/participant-readiness.mjs \
  scripts/verify-human-workflow-staging.mjs \
  e2e/human-workflow-staging.spec.mjs \
  e2e/participant-readiness.spec.mjs \
  e2e/staging.playwright.config.mjs \
  test/h11-access-gate-contract.test.mjs \
  test/h11-narrow-candidate-contract.test.mjs \
  test/human-workflow-staging-contract.test.mjs \
  ops/next-steps-2026-07-23/h11-narrow-protected-staging-candidate-2026-08-07-v1.json

for path in "${SOURCE_PATHS[@]}"; do
  git diff --quiet "$SOURCE_SHA" HEAD -- "$path" || {
    echo "Source fidelity failed for $path" >&2
    git diff -- "$SOURCE_SHA" HEAD -- "$path"
    exit 1
  }
done

node --check api/staging.mjs
node --check src/staging-service.mjs
node --check staging/app.mjs
node --check staging/participant-readiness.mjs
node --check scripts/verify-human-workflow-staging.mjs
node --check test/h11-access-gate-contract.test.mjs
node --check test/h11-narrow-candidate-contract.test.mjs
node --check test/human-workflow-staging-contract.test.mjs
node --check e2e/human-workflow-staging.spec.mjs
node --check e2e/participant-readiness.spec.mjs
node --check e2e/staging.playwright.config.mjs
npm run verify:staging

node --test \
  test/h11-access-gate-contract.test.mjs \
  test/h11-narrow-candidate-contract.test.mjs \
  test/human-workflow-staging-contract.test.mjs \
  test/hosted-staging-gateway-contract.test.mjs

npm test

npm run build
test ! -e dist/staging

VERCEL=1 \
VERCEL_ENV=preview \
VERCEL_GIT_COMMIT_REF=release/vercel-preview \
VERCEL_GIT_COMMIT_SHA="$PRODUCT_SHA" \
npm run build
for path in \
  dist/staging/index.html \
  dist/staging/app.mjs \
  dist/staging/styles.css \
  dist/staging/participant-readiness.mjs \
  dist/staging/participant-readiness.css; do
  test -f "$path"
done

STAGING_BUILD=true npm run build
for path in \
  dist/staging/index.html \
  dist/staging/app.mjs \
  dist/staging/styles.css \
  dist/staging/participant-readiness.mjs \
  dist/staging/participant-readiness.css; do
  test -f "$path"
done

npm run smoke:server
npm run tabletop:staging

psql "$POSTGRES_ADMIN_URL" -v ON_ERROR_STOP=1 -c "create database metaphilosophy_source"
psql "$POSTGRES_ADMIN_URL" -v ON_ERROR_STOP=1 -c "create database metaphilosophy_restore"
for database_url in "$STAGING_SOURCE_DATABASE_URL" "$STAGING_RESTORE_DATABASE_URL"; do
  psql "$database_url" -v ON_ERROR_STOP=1 -f ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v1.sql
  psql "$database_url" -v ON_ERROR_STOP=1 -f ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v2.sql
  psql "$database_url" -v ON_ERROR_STOP=1 -f ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v3.sql
done
npm run smoke:postgres
for database_url in "$STAGING_SOURCE_DATABASE_URL" "$STAGING_RESTORE_DATABASE_URL"; do
  psql "$database_url" -v ON_ERROR_STOP=1 -f ops/next-steps-2026-07-23/metaphilosophy-staging-schema-v4.sql
done
npm run verify:staging:v4

npm install --no-save --no-package-lock @playwright/test
npx playwright install --with-deps chromium
npx playwright test --config=e2e/staging.playwright.config.mjs

python - <<'PY'
import json
import os
from pathlib import Path

evidence = {
    "record_id": "H11-NARROW-PROTECTED-STAGING-CANDIDATE-EVIDENCE-2026-08-07-V1",
    "status": "pass",
    "base_release_commit": os.environ["BASE_SHA"],
    "validated_source_snapshot": os.environ["SOURCE_SHA"],
    "validated_product_commit": os.environ["PRODUCT_SHA"],
    "candidate_branch": os.environ["CANDIDATE_BRANCH"],
    "github_actions_run_id": int(os.environ["GITHUB_RUN_ID"]),
    "github_actions_run_attempt": int(os.environ["GITHUB_RUN_ATTEMPT"]),
    "validation": {
        "narrow_path_allowlist": "pass",
        "source_file_fidelity": "pass",
        "syntax_and_static_contracts": "pass",
        "focused_h11_tests": "pass",
        "complete_repository_tests": "pass",
        "public_build_excludes_staging": "pass",
        "protected_preview_shape_build": "pass_without_deployment",
        "local_controlled_staging_build": "pass",
        "synthetic_lifecycle": "pass",
        "support_tabletop": "pass",
        "postgres_restart_backup_restore": "pass",
        "rendered_chromium_workflow": "pass"
    },
    "authorization": {
        "protected_release_branch_advanced": False,
        "deployment_performed": False,
        "participant_share_link_created": False,
        "participant_application_invitation_created": False,
        "outbound_participant_access_message_sent": False,
        "participant_access_authorized": False,
        "research_ratings_authorized": False,
        "real_research_rating_collected": False,
        "payment_committed_or_made": False,
        "h11_passed": False,
        "h12_signed": False
    },
    "next_gate": "separate owner review of the narrow candidate before any protected-branch advancement or deployment"
}
Path("ops/next-steps-2026-07-23/h11-narrow-protected-staging-candidate-evidence-2026-08-07-v1.json").write_text(
    json.dumps(evidence, indent=2) + "\n",
    encoding="utf-8",
)
Path(".staging-evidence").mkdir(exist_ok=True)
Path(".staging-evidence/h11-narrow-candidate-summary.json").write_text(
    json.dumps(evidence, indent=2) + "\n",
    encoding="utf-8",
)
PY

git add ops/next-steps-2026-07-23/h11-narrow-protected-staging-candidate-evidence-2026-08-07-v1.json
git commit -m "Record narrow H-11 candidate validation evidence"
test "$(git diff --name-only "$PRODUCT_SHA..HEAD")" = "ops/next-steps-2026-07-23/h11-narrow-protected-staging-candidate-evidence-2026-08-07-v1.json"
node -e 'JSON.parse(require("node:fs").readFileSync("ops/next-steps-2026-07-23/h11-narrow-protected-staging-candidate-evidence-2026-08-07-v1.json", "utf8"))'
test -z "$(git status --porcelain)"

git push origin HEAD:"$CANDIDATE_BRANCH"

echo "PRODUCT_SHA=$PRODUCT_SHA" >> "$GITHUB_ENV"
echo "FINAL_SHA=$(git rev-parse HEAD)" >> "$GITHUB_ENV"
