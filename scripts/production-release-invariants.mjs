import assert from "node:assert/strict";

const PROTECTED_RESEARCH_PATHS = Object.freeze([
  "/staging",
  "/api/staging",
  "/workspace",
  "/reference",
]);

export function assertClosedResearchIntakePage(html) {
  const document = String(html ?? "");

  assert.match(
    document,
    /Research rating applications are closed\./i,
    "The public intake must state that research-rating applications are closed.",
  );
  assert.match(
    document,
    /The first Metaphilosophy study has not begun\./i,
    "The public intake must state that the first study has not begun.",
  );
  assert.match(
    document,
    /Zero research ratings have been collected\./i,
    "The public intake must state that zero research ratings have been collected.",
  );

  for (const element of ["form", "input", "textarea", "select"]) {
    assert.doesNotMatch(
      document,
      new RegExp(`<${element}\\b`, "i"),
      `The closed public intake must not render a <${element}> control.`,
    );
  }
  assert.doesNotMatch(
    document,
    /<button\b[^>]*\btype\s*=\s*["']submit["'][^>]*>/i,
    "The closed public intake must not render a submit button.",
  );
  assert.doesNotMatch(
    document,
    /Submit calibration/i,
    "The closed public intake must not offer calibration submission.",
  );

  for (const match of document.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)) {
    let pathname;
    try {
      pathname = new URL(match[1], "https://www.metaphilosophy.org").pathname.replace(/\/+$/, "") || "/";
    } catch {
      continue;
    }
    const exposesProtectedResearchPath = PROTECTED_RESEARCH_PATHS.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    assert.equal(
      exposesProtectedResearchPath,
      false,
      `The closed public intake must not link to protected research path ${pathname}.`,
    );
  }
}
