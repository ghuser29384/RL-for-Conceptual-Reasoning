const PAGE_SIZE = 10;

const familyRules = [
  ["Counterexample", /counterexample|thought experiment|case objection|counter-case/i],
  ["Premise or assumption", /premise|assumption|presupposition|begs the question|question-begging|circular/i],
  ["Inference or logic", /inference|validity|logical|non sequitur|equivocation|fallacy|regress|dilemma/i],
  ["Scope or boundary", /scope|boundary|exception|special case|limitation|domain restriction|overgeneral/i],
  ["Conceptual analysis", /concept|definition|distinction|category|ambiguity|indetermin|individuation|identity/i],
  ["Evidence or method", /evidence|empirical|method|measurement|selection bias|sampling|operational|epistemic/i],
  ["Alternative explanation", /alternative|underdetermin|explanatory|causal|mechanism|representation/i],
  ["Practical or institutional", /practical|institution|implementation|incentive|dynamic|coordination|feasibility|governance/i],
  ["Normative or distributive", /justice|fairness|legitimacy|rights|value|moral|normative|distribution|welfare/i],
];

function attackFamily(attackType) {
  const match = familyRules.find(([, pattern]) => pattern.test(attackType));
  return match?.[0] || "Other";
}

const els = {
  controls: document.querySelector("#controls"),
  query: document.querySelector("#query"),
  domain: document.querySelector("#domain"),
  attack: document.querySelector("#attack"),
  sort: document.querySelector("#sort"),
  clear: document.querySelector("#clear"),
  count: document.querySelector("#result-count"),
  status: document.querySelector("#status"),
  list: document.querySelector("#position-list"),
  pagination: document.querySelector("#pagination"),
};

let positions = [];
let critiques = [];
let grouped = new Map();
let currentRows = [];
let state = { q: "", domain: "", attack: "", sort: "id", page: 1 };

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalized(value) {
  return String(value || "").toLocaleLowerCase();
}

function readState() {
  const params = new URLSearchParams(window.location.search);
  state = {
    q: params.get("q") || "",
    domain: params.get("domain") || "",
    attack: params.get("attack") || "",
    sort: ["id", "title", "domain"].includes(params.get("sort")) ? params.get("sort") : "id",
    page: Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1),
  };
  els.query.value = state.q;
  els.domain.value = state.domain;
  els.attack.value = state.attack;
  els.sort.value = state.sort;
}

function writeState({ replace = false } = {}) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.domain) params.set("domain", state.domain);
  if (state.attack) params.set("attack", state.attack);
  if (state.sort !== "id") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  const url = `${window.location.pathname}${params.size ? `?${params}` : ""}${window.location.hash}`;
  window.history[replace ? "replaceState" : "pushState"]({}, "", url);
}

function populateFilters() {
  [...new Set(positions.map((position) => position.domain))]
    .sort((a, b) => a.localeCompare(b))
    .forEach((domain) => els.domain.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(domain)}">${escapeHtml(domain)}</option>`));

  [...new Set(critiques.map((critique) => attackFamily(critique.attack_type)))]
    .sort((a, b) => a.localeCompare(b))
    .forEach((family) => els.attack.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(family)}">${escapeHtml(family)}</option>`));
}

function deriveRows() {
  const query = normalized(state.q.trim());
  const rows = [];

  for (const position of positions) {
    if (state.domain && position.domain !== state.domain) continue;

    const positionMatches = !query || normalized(`${position.position_id} ${position.domain} ${position.title} ${position.position}`).includes(query);
    const positionCritiques = grouped.get(position.position_id) || [];
    const matchingCritiques = positionCritiques.filter((critique) => {
      if (state.attack && attackFamily(critique.attack_type) !== state.attack) return false;
      if (!query || positionMatches) return true;
      return normalized(`${critique.critique_id} ${critique.label} ${critique.attack_type} ${critique.critique}`).includes(query);
    });

    if (!matchingCritiques.length) continue;
    rows.push({ ...position, critiques: matchingCritiques });
  }

  const sorter = {
    id: (a, b) => a.position_id.localeCompare(b.position_id, undefined, { numeric: true }),
    title: (a, b) => a.title.localeCompare(b.title),
    domain: (a, b) => a.domain.localeCompare(b.domain) || a.title.localeCompare(b.title),
  }[state.sort];
  rows.sort(sorter);
  return rows;
}

function critiqueMarkup(critique) {
  return `
    <article class="critiqueCard">
      <div class="critiqueMeta">
        <span>${escapeHtml(critique.critique_id)}</span>
        <strong>${escapeHtml(critique.attack_type)}</strong>
      </div>
      <h4>${escapeHtml(critique.label)}</h4>
      <p>${escapeHtml(critique.critique)}</p>
    </article>`;
}

function positionMarkup(position) {
  return `
    <li class="positionItem" id="${escapeHtml(position.position_id)}">
      <aside class="positionIndex">
        <span class="positionId">${escapeHtml(position.position_id)}</span>
        <span class="positionDomain">${escapeHtml(position.domain)}</span>
      </aside>
      <article class="positionMain">
        <h3>${escapeHtml(position.title)}</h3>
        <p class="positionText">${escapeHtml(position.position)}</p>
        <div class="positionTools">
          <button type="button" data-copy-link="${escapeHtml(position.position_id)}">Copy permalink</button>
        </div>
        <div class="critiqueGrid">${position.critiques.map(critiqueMarkup).join("")}</div>
      </article>
    </li>`;
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    els.pagination.replaceChildren();
    return;
  }
  const fragment = document.createDocumentFragment();
  const addButton = (label, page, options = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.page = String(page);
    if (options.disabled) button.disabled = true;
    if (options.current) button.setAttribute("aria-current", "page");
    if (options.label) button.setAttribute("aria-label", options.label);
    fragment.append(button);
  };
  addButton("Prev", Math.max(1, state.page - 1), { disabled: state.page === 1, label: "Previous page" });
  const pages = [...new Set([1, state.page - 2, state.page - 1, state.page, state.page + 1, state.page + 2, totalPages])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  let last = 0;
  for (const page of pages) {
    if (page - last > 1) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "…";
      ellipsis.setAttribute("aria-hidden", "true");
      fragment.append(ellipsis);
    }
    addButton(String(page), page, { current: page === state.page, label: `Page ${page}` });
    last = page;
  }
  addButton("Next", Math.min(totalPages, state.page + 1), { disabled: state.page === totalPages, label: "Next page" });
  els.pagination.replaceChildren(fragment);
}

function render({ updateUrl = true, scroll = false } = {}) {
  currentRows = deriveRows();
  const totalCritiques = currentRows.reduce((sum, row) => sum + row.critiques.length, 0);
  const totalPages = Math.max(1, Math.ceil(currentRows.length / PAGE_SIZE));
  state.page = Math.min(state.page, totalPages);
  const start = (state.page - 1) * PAGE_SIZE;
  const pageRows = currentRows.slice(start, start + PAGE_SIZE);

  els.count.textContent = `${currentRows.length.toLocaleString()} positions · ${totalCritiques.toLocaleString()} critiques`;
  els.status.hidden = true;
  if (!pageRows.length) {
    els.list.innerHTML = `<li class="emptyState"><h3>No matching arguments.</h3><p>Try a broader search or clear one of the filters.</p></li>`;
  } else {
    els.list.innerHTML = pageRows.map(positionMarkup).join("");
  }
  renderPagination(totalPages);
  if (updateUrl) writeState({ replace: true });
  if (scroll) document.querySelector("#library-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (window.location.hash) requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" }));
}

function flattenedRows(rows = positions.map((position) => ({ ...position, critiques: grouped.get(position.position_id) || [] }))) {
  return rows.flatMap((position) => position.critiques.map((critique) => ({
    critique_id: critique.critique_id,
    position_id: position.position_id,
    domain: position.domain,
    title: position.title,
    position: position.position,
    label: critique.label,
    attack_type: critique.attack_type,
    attack_family: attackFamily(critique.attack_type),
    critique: critique.critique,
  })));
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function download(format) {
  const rows = flattenedRows();
  let text = "";
  let type = "text/plain;charset=utf-8";
  let extension = format;
  if (format === "jsonl") {
    text = rows.map((row) => JSON.stringify(row)).join("\n") + "\n";
    type = "application/x-ndjson;charset=utf-8";
  } else if (format === "csv") {
    const headers = Object.keys(rows[0]);
    text = [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n") + "\n";
    type = "text/csv;charset=utf-8";
  } else {
    extension = "md";
    text = [
      "# Metaphilosophy Synthetic Argument–Critique Library",
      "",
      "> Model-authored synthetic expansion. Unrated by Metaphilosophy expert raters.",
      "",
      ...positions.flatMap((position) => [
        `## ${position.position_id} — ${position.title}`,
        "",
        `**Domain:** ${position.domain}`,
        "",
        position.position,
        "",
        ...(grouped.get(position.position_id) || []).flatMap((critique) => [
          `### ${critique.critique_id} — ${critique.label}`,
          "",
          `*Attack type: ${critique.attack_type}*`,
          "",
          critique.critique,
          "",
        ]),
      ]),
    ].join("\n");
    type = "text/markdown;charset=utf-8";
  }
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `metaphilosophy-synthetic-1000.${extension}`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  let searchTimer;
  els.query.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.q = els.query.value.trim();
      state.page = 1;
      render();
    }, 120);
  });
  els.domain.addEventListener("change", () => { state.domain = els.domain.value; state.page = 1; render(); });
  els.attack.addEventListener("change", () => { state.attack = els.attack.value; state.page = 1; render(); });
  els.sort.addEventListener("change", () => { state.sort = els.sort.value; state.page = 1; render(); });
  els.clear.addEventListener("click", () => {
    state = { q: "", domain: "", attack: "", sort: "id", page: 1 };
    els.controls.reset();
    render({ scroll: true });
  });
  els.pagination.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    state.page = Number(button.dataset.page);
    render({ scroll: true });
  });
  document.addEventListener("click", async (event) => {
    const downloadButton = event.target.closest("[data-download]");
    if (downloadButton) download(downloadButton.dataset.download);
    const copyButton = event.target.closest("[data-copy-link]");
    if (copyButton) {
      const id = copyButton.dataset.copyLink;
      const url = new URL(window.location.href);
      url.hash = id;
      await navigator.clipboard.writeText(url.toString());
      const original = copyButton.textContent;
      copyButton.textContent = "Copied";
      window.setTimeout(() => { copyButton.textContent = original; }, 1200);
    }
  });
  window.addEventListener("popstate", () => { readState(); render({ updateUrl: false }); });
}

async function init() {
  try {
    const [positionResponse, critiqueResponse] = await Promise.all([
      fetch("/arguments/data/positions.json"),
      fetch("/arguments/data/critiques.json"),
    ]);
    if (!positionResponse.ok || !critiqueResponse.ok) throw new Error("Dataset files were not available.");
    [positions, critiques] = await Promise.all([positionResponse.json(), critiqueResponse.json()]);
    grouped = critiques.reduce((map, critique) => {
      const bucket = map.get(critique.position_id) || [];
      bucket.push(critique);
      map.set(critique.position_id, bucket);
      return map;
    }, new Map());
    populateFilters();
    readState();
    bindEvents();
    render({ updateUrl: false });
  } catch (error) {
    console.error(error);
    els.status.textContent = "The argument library could not be loaded. Please retry shortly.";
    els.count.textContent = "Unavailable";
  }
}

init();
