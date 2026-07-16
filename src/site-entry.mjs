const initialQuery = new URLSearchParams(window.location.search);
const isPublicHome = window.location.pathname === "/" && !initialQuery.has("section");

function criterionBrandMarkup() {
  return `
    <div class="brandMark criterionBrandMark" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
    </div>
    <div><strong>Metaphilosophy</strong><span>Human-rated reasoning</span></div>
  `;
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
    brandLink.innerHTML = criterionBrandMarkup();
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
    label.textContent = "Conceptual arguments / October 2026 release";

    const heading = document.createElement("h1");
    heading.textContent = activeSection;

    const detail = document.createElement("p");
    detail.textContent = "Method-preserving annotation, evaluation, and release operations for conceptual-argument research.";

    topbarCopy.append(label, heading, detail);
  }

  root.querySelectorAll(".stat span").forEach((label) => {
    if (label.textContent?.trim() === "Deferred diagnostics") label.textContent = "Deferred";
  });
}

function normalizePublicationLinks() {
  const labelFor = new Map([
    ["Read the paper", "Publication overview"],
    ["Dataset methodology", "Method overview"],
    ["Read the experiments", "Experiment overview"],
    ["Open the paper", "Publication overview"],
    ["Download PDF", "Publication details"],
  ]);

  const findings = document.querySelector(".anFindings");
  if (findings && !findings.id) findings.id = "findings";

  document.querySelectorAll("[data-paper-link]").forEach((link) => {
    const currentLabel = [...link.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.nodeValue || "")
      .join(" ")
      .trim();

    const destination = currentLabel.includes("methodology")
      ? "#method"
      : currentLabel.includes("experiments")
        ? "#findings"
        : "#publication";

    link.href = destination;
    link.removeAttribute("target");
    link.removeAttribute("rel");
    link.removeAttribute("download");

    const replacement = labelFor.get(currentLabel);
    const textNode = [...link.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (replacement && textNode) textNode.nodeValue = `${replacement} `;
  });
}

if (isPublicHome) {
  document.body.classList.add("publicHomeBody");
  const { bindPublicHomeEvents, publicHomePage } = await import("./public-home.mjs");
  const root = document.querySelector("#root");
  if (!root) throw new Error("Missing #root mount point");
  root.innerHTML = publicHomePage();
  bindPublicHomeEvents();
  normalizePublicationLinks();
} else {
  document.body.classList.remove("publicHomeBody");
  await import("./app.mjs");
  enhanceWorkspace();

  const root = document.querySelector("#root");
  if (root) {
    const observer = new MutationObserver(() => enhanceWorkspace());
    observer.observe(root, { childList: true, subtree: true });
  }
}
