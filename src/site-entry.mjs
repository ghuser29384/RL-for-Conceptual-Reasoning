import {
  applyPublicWordmarkSystem,
  workspaceWordmarkMarkup,
} from "./wordmark-system.mjs";

const initialQuery = new URLSearchParams(window.location.search);
const isRootSurface = window.location.pathname === "/" || window.location.pathname === "/index.html";
const legacySectionTargets = Object.freeze({
  rating: "#status",
  platform: "#status",
  dataset: "#status",
  method: "#method",
  research: "#prior-work",
  impact: "#impact",
});

function platformBrandMarkup() {
  return workspaceWordmarkMarkup();
}

function enhanceWorkspace() {
  const root = document.querySelector("#root");
  if (!root) return;

  const currentBrand = root.querySelector(".brand");
  if (currentBrand && currentBrand.dataset.metaphilosophyBrand !== "true") {
    const brandLink = document.createElement("a");
    brandLink.className = currentBrand.className;
    brandLink.href = "/";
    brandLink.setAttribute("aria-label", "Metaphilosophy home");
    brandLink.dataset.metaphilosophyBrand = "true";
    brandLink.innerHTML = platformBrandMarkup();
    currentBrand.replaceWith(brandLink);
  }

  const topbar = root.querySelector(".topbar");
  const topbarCopy = topbar?.firstElementChild;
  const activeSection = root.querySelector(".navItem.active")?.textContent?.trim() || "Research operations";
  if (topbarCopy && topbarCopy.dataset.metaphilosophySection !== activeSection) {
    topbarCopy.dataset.metaphilosophySection = activeSection;
    topbarCopy.replaceChildren();

    const label = document.createElement("span");
    label.className = "topbarLabel";
    label.textContent = "Human-expert philosophical reasoning";

    const heading = document.createElement("h1");
    heading.textContent = activeSection;

    const detail = document.createElement("p");
    detail.textContent = "Blind rating, calibration, adjudication, evaluation, and release operations for conceptual-argument research.";

    topbarCopy.append(label, heading, detail);
  }

  root.querySelectorAll(".stat span").forEach((label) => {
    if (label.textContent?.trim() === "Deferred diagnostics") label.textContent = "Deferred";
  });
}

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
} else {
  document.body.classList.remove("publicHomeBody", "epochHomeBody");
  await import("./app.mjs");
  enhanceWorkspace();

  const root = document.querySelector("#root");
  if (root) {
    const observer = new MutationObserver(() => enhanceWorkspace());
    observer.observe(root, { childList: true, subtree: true });
  }
}
