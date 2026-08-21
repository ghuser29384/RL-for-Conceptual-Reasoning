import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { assertClosedResearchIntakePage } from "../scripts/production-release-invariants.mjs";

const root = resolve(import.meta.dirname, "..");
const closedIntakeHtml = await readFile(resolve(root, "reviewers/closed.html"), "utf8");

test("closed intake source preserves the current research-status boundary", () => {
  assert.doesNotThrow(() => assertClosedResearchIntakePage(closedIntakeHtml));
});

test("closed intake invariant rejects reopened or empirically false status copy", () => {
  assert.throws(
    () => assertClosedResearchIntakePage(
      closedIntakeHtml.replace(
        "Research rating applications are closed.",
        "Research rating applications are open.",
      ),
    ),
    /applications are closed/i,
  );
  assert.throws(
    () => assertClosedResearchIntakePage(
      closedIntakeHtml.replace(
        "Zero research ratings have been collected.",
        "Research ratings have been collected.",
      ),
    ),
    /zero research ratings/i,
  );
});

test("closed intake invariant rejects collection controls and protected research links", () => {
  assert.throws(
    () => assertClosedResearchIntakePage(
      closedIntakeHtml.replace(
        "</main>",
        '<form><input name="rating"><button type="submit">Submit</button></form></main>',
      ),
    ),
    /must not render a <form>/i,
  );
  assert.throws(
    () => assertClosedResearchIntakePage(
      closedIntakeHtml.replace(
        "</main>",
        '<a href="/staging/?invite=example">Claim a research assignment</a></main>',
      ),
    ),
    /protected research path/i,
  );
});
