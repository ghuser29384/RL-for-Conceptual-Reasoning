const channels = [
  ["Direct expert email", "direct_email", "email"],
  ["Trusted connector", "trusted_connector", "email"],
  ["Philosophy department", "philosophy_department", "email"],
  ["Seminar or workshop", "seminar_organizer", "email"],
  ["EA Forum", "ea_forum", "community"],
  ["LessWrong", "lesswrong", "community"],
  ["Alignment Forum", "alignment_forum", "community"],
  ["Graduate network", "graduate_network", "community"],
  ["Prolific", "prolific", "paid_panel"],
  ["Peer referral", "reviewer_referral", "peer"],
];

function linkFor(source, medium) {
  const url = new URL("/reviewers/", location.origin);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", "reviewer_sprint_july_2026");
  return url.toString();
}

function renderLinks() {
  const grid = document.querySelector("#link-grid");
  grid.innerHTML = "";
  for (const [label, source, medium] of channels) {
    const card = document.createElement("article");
    card.className = "link-card";
    const url = linkFor(source, medium);
    card.innerHTML = `<header><strong>${label}</strong><button type="button">Copy</button></header><input readonly value="${url}">`;
    const button = card.querySelector("button");
    const input = card.querySelector("input");
    button.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(input.value); }
      catch { input.select(); document.execCommand("copy"); }
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = "Copy"; }, 1500);
    });
    grid.append(card);
  }
}

function setText(id, value) { document.querySelector(id).textContent = String(value); }

function renderSummary(summary) {
  const working = Number(summary.activatedWorkingCount) || 0;
  const applications = Number(summary.applications) || 0;
  setText("#working-count", working);
  setText("#working-progress", `of ${Number(summary.goal) || 100}`);
  setText("#qualified-count", Number(summary.provisionalQualified) || 0);
  setText("#manual-count", Number(summary.manualReview) || 0);
  setText("#gap-count", Number(summary.gapToGoal) || 0);
  setText("#application-count", applications);
  setText("#referral-count", Number(summary.referredApplications) || 0);
  setText("#conversion-rate", applications ? `${Math.round((working / applications) * 100)}% working qualification rate` : "— qualification rate");
  setText("#updated", `Updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);

  const body = document.querySelector("#channel-rows");
  const rows = Array.isArray(summary.channels) ? summary.channels : [];
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="5">No channel data yet.</td></tr>';
    return;
  }
  body.innerHTML = rows.map((row) => {
    const workingChannel = (Number(row.provisionalQualified) || 0) + (Number(row.manualReview) || 0);
    const applicationsChannel = Number(row.applications) || 0;
    const conversion = applicationsChannel ? `${Math.round((workingChannel / applicationsChannel) * 100)}%` : "—";
    const label = String(row.sourceChannel || "direct").replaceAll("_", " ");
    return `<tr><td>${label}</td><td>${applicationsChannel}</td><td>${Number(row.provisionalQualified) || 0}</td><td>${Number(row.manualReview) || 0}</td><td>${conversion}</td></tr>`;
  }).join("");
}

async function refresh() {
  const button = document.querySelector("#refresh");
  button.disabled = true;
  button.textContent = "Refreshing…";
  try {
    const response = await fetch("/api/reviewer-applications", { cache: "no-store", headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("Summary unavailable");
    renderSummary(await response.json());
  } catch (error) {
    setText("#updated", error?.message || "Summary unavailable");
  } finally {
    button.disabled = false;
    button.textContent = "Refresh";
  }
}

document.querySelector("#refresh").addEventListener("click", refresh);
renderLinks();
refresh();
setInterval(refresh, 60_000);
