import { applyPublicWordmarkSystem } from "./wordmark-system.mjs";

const initialQuery = new URLSearchParams(window.location.search);
const normalizedPath = window.location.pathname.replace(/\/+$/u, "") || "/";
const isRootSurface = normalizedPath === "/" || normalizedPath === "/index.html";
const isWorkspaceGateSurface = normalizedPath === "/workspace" || normalizedPath === "/reference";
const legacySectionTargets = Object.freeze({
  rating: "#status",
  platform: "#status",
  dataset: "#status",
  method: "#method",
  research: "#prior-work",
  impact: "#impact",
});

function normalizeLegacyRootRoute() {
  const requestedSection = initialQuery.get("section");
  if (!requestedSection) return;

  const target = legacySectionTargets[requestedSection] ?? "#status";
  window.history.replaceState(null, "", `/${target}`);
  window.requestAnimationFrame(() => {
    document.querySelector(target)?.scrollIntoView({ block: "start" });
  });
}

if (isRootSurface) {
  document.body.classList.add("publicHomeBody", "epochHomeBody");
  const { bindPublicHomeEvents, publicHomePage } = await import("./exact-reference-home.mjs");
  const root = document.querySelector("#root");
  if (!root) throw new Error("Missing #root mount point");
  root.innerHTML = publicHomePage();
  applyPublicWordmarkSystem();
  bindPublicHomeEvents();
  normalizeLegacyRootRoute();
} else if (isWorkspaceGateSurface) {
  document.body.classList.remove("epochHomeBody");
  await import("./workspace-gate.mjs");
} else {
  window.location.replace("/");
}
