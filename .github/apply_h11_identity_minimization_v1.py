#!/usr/bin/env python3
from __future__ import annotations

import os
from pathlib import Path
from textwrap import dedent

ROOT = Path(__file__).resolve().parents[1]
BRANCH = "agent/48-critique-pilot-20260730"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one anchor, found {count}: {old[:180]!r}")
    write(path, text.replace(old, new, 1))


def replace_all(path: str, old: str, new: str, minimum: int = 1) -> None:
    text = read(path)
    count = text.count(old)
    if count < minimum:
        raise RuntimeError(f"{path}: expected at least {minimum} anchors, found {count}: {old!r}")
    write(path, text.replace(old, new))


def append_once(path: str, marker: str, content: str) -> None:
    text = read(path)
    if marker in text:
        return
    write(path, text.rstrip() + "\n\n" + content.strip() + "\n")


def main() -> None:
    if os.environ.get("GITHUB_REF_NAME") not in {None, BRANCH}:
        raise RuntimeError(f"Unexpected branch: {os.environ.get('GITHUB_REF_NAME')}")
    for path, marker in [
        ("src/staging-service.mjs", "h11_pseudonym_required"),
        ("test/h11-access-gate-contract.test.mjs", "direct contact identifiers are never persisted"),
    ]:
        if marker in read(path):
            raise RuntimeError(f"Prior or partial identity-minimization patch found in {path}")

    replace_once(
        "src/staging-service.mjs",
        dedent('''
          async createIdentity({ actorSessionToken, role, displayName, email, purpose = null }) {
            const actor = await this.requireRole(actorSessionToken, "operator");
            if (!VALID_ROLES.has(role)) throw serviceError(400, "invalid_role", "Role must be operator, rater, or adjudicator.");
            const normalized = normalizeEmail(email);
            if (!normalized) throw serviceError(400, "invalid_email", "A valid email address is required.");
            const normalizedPurpose = normalizeIdentityPurpose({ role, purpose, email: normalized });
            const state = await this.state();
            const existing = state.identities.find((identity) => identity.email === normalized && identity.role === role && identity.status === "active");
            if (existing) {
              if (effectiveIdentityPurpose(existing) !== normalizedPurpose) {
                throw serviceError(409, "identity_purpose_conflict", "An active identity already exists with a different access purpose.");
              }
              return { identity: publicIdentity(existing), created: false };
            }
            const identity = {
              id: randomUUID(),
              role,
              purpose: normalizedPurpose,
              displayName: String(displayName ?? "").trim().slice(0, 160) || normalized,
              email: normalized,
              status: "active",
            };
            await this.store.append(event("identity.created", identity.id, actor.identity.id, identity, this.now().toISOString()));
            await this.audit(actor.identity.id, "identity.created", { identityId: identity.id, role, purpose: normalizedPurpose });
            return { identity: publicIdentity(identity), created: true };
          }
        '''),
        dedent('''
          async createIdentity({ actorSessionToken, role, displayName, email, purpose = null }) {
            const actor = await this.requireRole(actorSessionToken, "operator");
            if (!VALID_ROLES.has(role)) throw serviceError(400, "invalid_role", "Role must be operator, rater, or adjudicator.");
            const normalized = normalizeEmail(email);
            if (!normalized) throw serviceError(400, "invalid_email", "A valid email address is required.");
            const normalizedPurpose = normalizeIdentityPurpose({ role, purpose, email: normalized });
            const state = await this.state();

            if (normalizedPurpose === "h11_human_usability") {
              const alias = normalizeH11ParticipantAlias(displayName);
              const existingAlias = state.identities.find((identity) => (
                identity.role === "rater"
                && effectiveIdentityPurpose(identity) === "h11_human_usability"
                && identity.displayName === alias
                && identity.status === "active"
              ));
              if (existingAlias) {
                throw serviceError(409, "h11_alias_conflict", "That H-11 participant alias is already active. Use the existing identity or choose another non-identifying slot alias.", {
                  identityId: existingAlias.id,
                });
              }
              const identity = {
                id: randomUUID(),
                role,
                purpose: normalizedPurpose,
                displayName: alias,
                email: null,
                contactRouteValidated: true,
                directContactPersisted: false,
                status: "active",
              };
              await this.store.append(event("identity.created", identity.id, actor.identity.id, identity, this.now().toISOString()));
              await this.audit(actor.identity.id, "identity.created", {
                identityId: identity.id,
                role,
                purpose: normalizedPurpose,
                contactRouteValidated: true,
                directContactPersisted: false,
              });
              return { identity: publicIdentity(identity), created: true };
            }

            const existing = state.identities.find((identity) => identity.email === normalized && identity.role === role && identity.status === "active");
            if (existing) {
              if (effectiveIdentityPurpose(existing) !== normalizedPurpose) {
                throw serviceError(409, "identity_purpose_conflict", "An active identity already exists with a different access purpose.");
              }
              return { identity: publicIdentity(existing), created: false };
            }
            const identity = {
              id: randomUUID(),
              role,
              purpose: normalizedPurpose,
              displayName: String(displayName ?? "").trim().slice(0, 160) || normalized,
              email: normalized,
              contactRouteValidated: false,
              directContactPersisted: true,
              status: "active",
            };
            await this.store.append(event("identity.created", identity.id, actor.identity.id, identity, this.now().toISOString()));
            await this.audit(actor.identity.id, "identity.created", {
              identityId: identity.id,
              role,
              purpose: normalizedPurpose,
              contactRouteValidated: false,
              directContactPersisted: true,
            });
            return { identity: publicIdentity(identity), created: true };
          }
        '''),
    )

    replace_once(
        "src/staging-service.mjs",
        '''function effectiveIdentityPurpose(identity) {''',
        '''function normalizeH11ParticipantAlias(value) {
  const alias = String(value ?? "").trim();
  if (!/^H-11 participant [A-Za-z0-9_-]{1,24}$/u.test(alias)) {
    throw serviceError(400, "h11_pseudonym_required", "Use a non-identifying alias in the form 'H-11 participant A', 'H-11 participant B', or another short slot code. Do not enter a person's name.");
  }
  return alias;
}

function effectiveIdentityPurpose(identity) {''',
    )

    replace_once(
        "src/staging-service.mjs",
        '''  if (purpose === "h11_human_usability") {
    if (isSyntheticEmail(identity.email)) {
      throw serviceError(errorStatus, "human_identity_deliverable_email_required", "Qualified human H-11 access may not use a synthetic .invalid identity.");
    }
    return purpose;
  }''',
        '''  if (purpose === "h11_human_usability") {
    if (identity.email || identity.contactRouteValidated !== true || identity.directContactPersisted !== false) {
      throw serviceError(errorStatus, "h11_identity_not_minimized", "Qualified human H-11 access requires a pseudonymous identity whose deliverable contact route was validated transiently and never persisted in the append-only ledger.");
    }
    normalizeH11ParticipantAlias(identity.displayName);
    return purpose;
  }''',
    )

    replace_once(
        "src/staging-service.mjs",
        '''  if (purpose !== "h11_human_usability" || isSyntheticEmail(identity.email)) return false;
  if (!session.h11AccessGateId''',
        '''  if (purpose !== "h11_human_usability") return false;
  if (identity.email || identity.contactRouteValidated !== true || identity.directContactPersisted !== false) return false;
  if (!session.h11AccessGateId''',
    )

    replace_once(
        "src/staging-service.mjs",
        '''function publicIdentity(identity) {
  return identity ? { id: identity.id, role: identity.role, purpose: effectiveIdentityPurpose(identity), displayName: identity.displayName, status: identity.status } : null;
}''',
        '''function publicIdentity(identity) {
  return identity ? {
    id: identity.id,
    role: identity.role,
    purpose: effectiveIdentityPurpose(identity),
    displayName: identity.displayName,
    contactRouteValidated: identity.contactRouteValidated === true,
    directContactPersisted: identity.directContactPersisted !== false,
    status: identity.status,
  } : null;
}''',
    )

    # Operator copy and table state.
    replace_once(
        "staging/index.html",
        '''          <label><span>Display name</span><input name="displayName" maxlength="160" required></label>
          <label><span>Email</span><input name="email" type="email" required></label>''',
        '''          <label><span>Pseudonymous display label</span><input name="displayName" maxlength="160" required><small class="field-help">For an H-11 human, use only a slot alias such as “H-11 participant A”. Never enter the person's name.</small></label>
          <label><span>Contact email</span><input name="email" type="email" required><small class="field-help">For an H-11 human, this address is validated in the request and then discarded; it is never written to the append-only ledger. Keep the identity mapping only in the approved external contact system.</small></label>''',
    )
    replace_once(
        "staging/index.html",
        '''<table><caption>Controlled identities</caption><thead><tr><th>Name</th><th>Role</th><th>Purpose</th><th>Status</th><th>ID</th></tr></thead>''',
        '''<table><caption>Controlled identities</caption><thead><tr><th>Alias</th><th>Role</th><th>Purpose</th><th>Contact handling</th><th>Status</th><th>ID</th></tr></thead>''',
    )
    replace_once(
        "staging/app.mjs",
        '''    identityBody.insertAdjacentHTML("beforeend", `<tr><td>${escapeHtml(identity.displayName)}</td><td>${escapeHtml(identity.role)}</td><td>${escapeHtml(identity.purpose || "unknown")}</td><td>${escapeHtml(identity.status)}</td><td><code>${escapeHtml(identity.id)}</code></td></tr>`);''',
        '''    const contactHandling = identity.purpose === "h11_human_usability"
      ? (identity.contactRouteValidated && identity.directContactPersisted === false ? "validated transiently · not persisted" : "BLOCKED · identity not minimized")
      : "controlled synthetic record";
    identityBody.insertAdjacentHTML("beforeend", `<tr><td>${escapeHtml(identity.displayName)}</td><td>${escapeHtml(identity.role)}</td><td>${escapeHtml(identity.purpose || "unknown")}</td><td>${escapeHtml(contactHandling)}</td><td>${escapeHtml(identity.status)}</td><td><code>${escapeHtml(identity.id)}</code></td></tr>`);''',
    )

    # Contract tests now prove no direct participant contact identifier reaches private events/export.
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''    displayName: "Qualified H-11 participant",
    email: "qualified-participant@example.test",''',
        '''    displayName: "H-11 participant A",
    email: "qualified-participant@example.test",''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  assert.equal(participant.identity.purpose, "h11_human_usability");''',
        '''  assert.equal(participant.identity.purpose, "h11_human_usability");
  assert.equal(participant.identity.displayName, "H-11 participant A");
  assert.equal(participant.identity.contactRouteValidated, true);
  assert.equal(participant.identity.directContactPersisted, false);''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  assert.ok(JSON.stringify(privateExport).includes("qualified-participant@example.test"));
  assert.ok(JSON.stringify(privateExport).includes("H11-TEST-OWNER-AUTHORIZATION-0002"));''',
        '''  assert.equal(JSON.stringify(privateExport).includes("qualified-participant@example.test"), false);
  assert.ok(JSON.stringify(privateExport).includes("H-11 participant A"));
  assert.ok(JSON.stringify(privateExport).includes("H11-TEST-OWNER-AUTHORIZATION-0002"));''',
    )
    replace_once(
        "test/h11-access-gate-contract.test.mjs",
        '''  await assert.rejects(
    () => harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", purpose: "h11_human_usability", displayName: "Fake human", email: "fake-human@example.invalid" }),
    (error) => error.status === 400 && error.code === "human_identity_deliverable_email_required",
  );''',
        '''  await assert.rejects(
    () => harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", purpose: "h11_human_usability", displayName: "Fake human", email: "fake-human@example.invalid" }),
    (error) => error.status === 400 && error.code === "human_identity_deliverable_email_required",
  );
  await assert.rejects(
    () => harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", purpose: "h11_human_usability", displayName: "Alex Example", email: "alex@example.test" }),
    (error) => error.status === 400 && error.code === "h11_pseudonym_required",
  );
  const minimizedHuman = await harness.service.createIdentity({ actorSessionToken: operator.sessionToken, role: "rater", purpose: "h11_human_usability", displayName: "H-11 participant privacy-test", email: "privacy-test@example.test" });
  const state = await harness.service.state();
  const storedHuman = state.identities.find((identity) => identity.id === minimizedHuman.identity.id);
  assert.equal(storedHuman.email, null);
  assert.equal(storedHuman.contactRouteValidated, true);
  assert.equal(storedHuman.directContactPersisted, false);
  assert.equal(JSON.stringify(await harness.store.loadEvents()).includes("privacy-test@example.test"), false);''',
    )

    # E2E aliases replace direct names and private export proves contact email absence.
    replace_all("e2e/human-workflow-staging.spec.mjs", "Synthetic browser rater A", "H-11 participant A", minimum=4)
    replace_all("e2e/human-workflow-staging.spec.mjs", "Synthetic browser rater B", "H-11 participant B", minimum=4)
    replace_once(
        "e2e/human-workflow-staging.spec.mjs",
        '''  expect(privateExport.state.h11AccessGates).toHaveLength(2);''',
        '''  expect(privateExport.state.h11AccessGates).toHaveLength(2);
  expect(JSON.stringify(privateExport)).not.toContain("browser-a@example.test");
  expect(JSON.stringify(privateExport)).not.toContain("browser-b@example.test");
  expect(privateExport.state.identities.filter((identity) => identity.purpose === "h11_human_usability").every((identity) => identity.email === null && identity.contactRouteValidated === true && identity.directContactPersisted === false)).toBe(true);''',
    )

    # Static evidence.
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["src/staging-service.mjs"], /h11_share_link_stale/);''',
        '''assert.match(contents["src/staging-service.mjs"], /h11_share_link_stale/);
assert.match(contents["src/staging-service.mjs"], /h11_pseudonym_required/);
assert.match(contents["src/staging-service.mjs"], /directContactPersisted: false/);
assert.match(contents["src/staging-service.mjs"], /contactRouteValidated: true/);
assert.match(contents["src/staging-service.mjs"], /h11_identity_not_minimized/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["staging/app.mjs"], /H11-ACCESS-GATE-2026-08-07-V2/);''',
        '''assert.match(contents["staging/app.mjs"], /H11-ACCESS-GATE-2026-08-07-V2/);
assert.match(contents["staging/app.mjs"], /validated transiently · not persisted/);''',
    )
    replace_once(
        "scripts/verify-human-workflow-staging.mjs",
        '''assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_share_link_stale/);''',
        '''assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_share_link_stale/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /h11_pseudonym_required/);
assert.match(contents["test/h11-access-gate-contract.test.mjs"], /privacy-test@example\\.test/);
assert.match(contents["e2e/human-workflow-staging.spec.mjs"], /not\\.toContain\\("browser-a@example\\.test"\\)/);''',
    )

    append_once(
        "ops/next-steps-2026-07-23/h11-fail-closed-access-issuance-gate-2026-08-07.md",
        "## Direct-identifier minimization",
        dedent('''
        ## Direct-identifier minimization

        Qualified-human H-11 identities no longer persist the participant's name or contact email in the append-only staging ledger. The operator must use a slot pseudonym such as `H-11 participant A`; a personal name is rejected. The contact email is used transiently only to validate that the route is deliverable and non-synthetic, then discarded before the `identity.created` event is formed.

        The persisted identity contains only the opaque identity ID, constrained participant alias, role, H-11 purpose, `contactRouteValidated=true`, `directContactPersisted=false`, and status. Private exports and raw event readback therefore do not contain the submitted contact email. The approved external contact system remains the sole identity-to-contact mapping and can be cleaned under the H-11 retention policy without requiring mutation of the append-only integrity ledger.

        H-11 invitation issuance and session authentication fail closed if a human identity contains a stored email, lacks transient-route validation evidence, or uses an unconstrained/non-pseudonymous label.
        '''),
    )

    (ROOT / ".github/apply_h11_identity_minimization_v1.py").unlink(missing_ok=True)
    (ROOT / ".github/workflows/apply-h11-identity-minimization-v1.yml").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
