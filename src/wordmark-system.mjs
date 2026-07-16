const PUBLIC_DESCRIPTOR = "Human expert judgment for AI";
const WORKSPACE_DESCRIPTOR = "Expert argument ratings";

function escapeClassName(className = "") {
  return className
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.replace(/[^a-zA-Z0-9_-]/g, ""))
    .join(" ");
}

export function wordmarkMarkup({ className = "", descriptor = PUBLIC_DESCRIPTOR } = {}) {
  const safeClassName = escapeClassName(className);
  return `
    <span class="mpWordmark${safeClassName ? ` ${safeClassName}` : ""}">
      <strong>Metaphilosophy</strong>
      <small>${descriptor}</small>
    </span>
  `;
}

export function workspaceWordmarkMarkup() {
  return wordmarkMarkup({ className: "mpWorkspaceWordmark", descriptor: WORKSPACE_DESCRIPTOR });
}

function replaceBrand(brand, className) {
  if (!brand || brand.dataset.wordmarkApplied === "true") return;
  brand.dataset.wordmarkApplied = "true";
  brand.innerHTML = wordmarkMarkup({ className });
}

export function applyPublicWordmarkSystem() {
  replaceBrand(document.querySelector(".epHeader .epBrand"), "mpHeaderWordmark");
  replaceBrand(document.querySelector(".epFooter .epBrand"), "mpFooterWordmark");

  const contributionGraphic = document.querySelector(".epContributeGraphic");
  if (contributionGraphic && contributionGraphic.dataset.wordmarkApplied !== "true") {
    contributionGraphic.dataset.wordmarkApplied = "true";
    contributionGraphic.classList.add("mpContributeStatement");
    contributionGraphic.innerHTML = `
      <div aria-hidden="true">
        <span>Human</span>
        <span>judgment</span>
        <i>for</i>
        <span>AI</span>
      </div>
    `;
  }
}
