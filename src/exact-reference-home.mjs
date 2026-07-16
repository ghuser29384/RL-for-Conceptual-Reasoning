import {
  bindPublicHomeEvents as bindLegacyPublicHomeEvents,
  publicHomePage as legacyPublicHomePage,
} from "./public-home.mjs";

const paperHref = "/src/assets/LMCA_dataset.pdf";

const dimensions = [
  {
    name: "Centrality",
    score: "0.80",
    value: 80,
    copy: "How much would the position weaken if the issue attacked by the critique were successfully refuted?",
  },
  {
    name: "Strength",
    score: "0.72",
    value: 72,
    copy: "How successfully does the critique undermine the particular claims or inferences it attacks?",
  },
  {
    name: "Correctness",
    score: "0.91",
    value: 91,
    copy: "What proportion of the critique is substantively correct, rather than false or misleading?",
  },
  {
    name: "Clarity",
    score: "0.88",
    value: 88,
    copy: "After careful reading, can an expert pin down what the critique is claiming and why it matters?",
  },
  {
    name: "Dead weight",
    score: "0.12",
    value: 12,
    copy: "How much material fails to contribute to the critique’s argument, clarification, or evidential value?",
  },
  {
    name: "Single issue",
    score: "0.86",
    value: 86,
    copy: "Does the critique stay focused on one line of attack rather than scattering across independent objections?",
  },
  {
    name: "Overall",
    score: "0.74",
    value: 74,
    copy: "How good is the critique all things considered—its force, insight, precision, correctness, and economy?",
  },
];

function wordmark() {
  return `
    <span class="mpWordmark mpHeaderWordmark">
      <strong>Metaphilosophy</strong>
      <small>Human expert judgment for AI</small>
    </span>
  `;
}

function arrowIcon() {
  return `
    <svg class="mpArrow" aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M2.5 10h14M11.5 5l5 5-5 5" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function ratingPanel() {
  return `
    <div class="mpRatingCard" id="dataset" aria-label="Example expert rating profile">
      <div class="mpRatingHeader">
        <div>
          <span>Argument profile</span>
          <strong>Critique C-1278</strong>
        </div>
        <span class="mpRatingStatus"><i></i> Illustrative expert mean</span>
      </div>

      <div class="mpRatingBody">
        <div class="mpRatingRows" role="group" aria-label="Evaluation dimensions">
          ${dimensions
            .map(
              (dimension, index) => `
                <button
                  class="mpRatingRow ${index === 0 ? "isActive" : ""}"
                  type="button"
                  data-dimension-index="${index}"
                  aria-pressed="${index === 0 ? "true" : "false"}"
                >
                  <span>${dimension.name}</span>
                  <strong>${dimension.score}</strong>
                  <i aria-hidden="true"><b style="--score: ${dimension.value}%"></b></i>
                </button>
              `,
            )
            .join("")}
        </div>

        <div class="mpRadarWrap" aria-hidden="true">
          <svg class="mpRadar" viewBox="0 0 360 320" fill="none">
            <g class="mpRadarGrid">
              <polygon points="180,39 274,84 297,186 232,269 128,269 63,186 86,84" />
              <polygon points="180,78 244,109 260,179 216,236 145,236 101,179 116,109" />
              <polygon points="180,116 214,132 223,171 199,203 161,203 137,171 146,132" />
              <path d="M180 39v230M63 186l234-102M63 186l234 0M86 84l146 185M274 84 128 269" />
            </g>
            <polygon class="mpRadarModel" points="180,92 237,120 247,183 211,225 151,232 110,198 122,132" />
            <polygon class="mpRadarExpert" points="180,59 263,99 276,185 218,249 138,250 82,202 99,101" />
            <g class="mpRadarDots">
              <circle cx="180" cy="59" r="3.5" />
              <circle cx="263" cy="99" r="3.5" />
              <circle cx="276" cy="185" r="3.5" />
              <circle cx="218" cy="249" r="3.5" />
              <circle cx="138" cy="250" r="3.5" />
              <circle cx="82" cy="202" r="3.5" />
              <circle cx="99" cy="101" r="3.5" />
            </g>
            <g class="mpRadarLabels">
              <text x="180" y="22" text-anchor="middle">Centrality</text>
              <text x="348" y="75" text-anchor="end">Strength</text>
              <text x="348" y="190" text-anchor="end">Correctness</text>
              <text x="240" y="293">Clarity</text>
              <text x="79" y="293">Dead weight</text>
              <text x="4" y="204">Single issue</text>
              <text x="17" y="76">Overall</text>
            </g>
          </svg>
          <div class="mpRadarLegend">
            <span><i></i> Human experts</span>
            <span><i></i> Model baseline</span>
          </div>
        </div>
      </div>

      <div class="mpDimensionReadout" aria-live="polite">
        <span id="mp-dimension-name">Centrality</span>
        <strong id="mp-dimension-score">0.80</strong>
        <p id="mp-dimension-copy">${dimensions[0].copy}</p>
      </div>

      <div class="mpRatingFooter">
        <span>Rubric v1.1</span>
        <span>Blind initial rating</span>
        <a href="${paperHref}#page=24" target="_blank" rel="noreferrer">View rubric ${arrowIcon()}</a>
      </div>
    </div>
  `;
}

function legacyContinuation() {
  const template = document.createElement("template");
  template.innerHTML = legacyPublicHomePage().trim();

  const site = template.content.querySelector(".epSite");
  const main = site?.querySelector("main");
  const footer = site?.querySelector(".epFooter");
  const sections = main
    ? [...main.children]
        .filter((element) => !element.classList.contains("epHero"))
        .map((element) => element.outerHTML)
        .join("")
    : "";

  return `<div class="epSite mpLegacySite">${sections}${footer?.outerHTML ?? ""}</div>`;
}

export function publicHomePage() {
  return `
    <a class="mpSkip" href="#main-content">Skip to content</a>
    <div class="mpHome">
      <div class="mpSignalBar" aria-hidden="true"><i></i><i></i><i></i><i></i></div>

      <header class="mpHeader">
        <a class="mpBrand" href="/" aria-label="Metaphilosophy home">${wordmark()}</a>

        <button class="mpMenu" type="button" aria-expanded="false" aria-controls="mp-navigation" aria-label="Open navigation">
          <span></span><span></span><span class="srOnly">Open navigation</span>
        </button>

        <nav class="mpNavigation" id="mp-navigation" aria-label="Primary navigation">
          <a href="/?section=rating">Platform</a>
          <a href="#dataset">Dataset</a>
          <a href="#method">Method</a>
          <a href="#impact">Why it matters</a>
          <a href="#research">Research</a>
        </nav>

        <a class="mpHeaderCta" href="/contribute">Join as an expert ${arrowIcon()}</a>
      </header>

      <main id="main-content">
        <section class="mpHero" aria-labelledby="mp-hero-title">
          <span class="mpDotGrid" aria-hidden="true"></span>

          <div class="mpHeroCopy mpReveal isVisible">
            <h1 id="mp-hero-title">Human experts teaching AI to do better philosophy.</h1>
            <p>
              Metaphilosophy is a platform where philosophers and domain experts rate arguments across a rigorous seven-dimensional rubric. Their judgments create training signals and benchmarks for AI systems that need to reason about questions without easy answer keys.
            </p>
            <div class="mpHeroActions">
              <a class="mpButton mpButtonPrimary" href="/contribute">Become a reviewer ${arrowIcon()}</a>
              <a class="mpButton mpButtonText" href="#dataset">Explore the dataset ${arrowIcon()}</a>
            </div>
            <div class="mpHeroProof">
              <span><i></i> Expert-rated</span>
              <span><i></i> Contextualized</span>
              <span><i></i> Built for training and evaluation</span>
            </div>
          </div>

          <div class="mpHeroVisual mpReveal isVisible">
            <span class="mpHeroShape mpHeroShapeA" aria-hidden="true"></span>
            <span class="mpHeroShape mpHeroShapeB" aria-hidden="true"></span>
            ${ratingPanel()}
          </div>
        </section>
      </main>
    </div>
    ${legacyContinuation()}
  `;
}

export function bindPublicHomeEvents() {
  const menu = document.querySelector(".mpMenu");
  const navigation = document.querySelector(".mpNavigation");

  const closeNavigation = () => {
    if (!menu || !navigation) return;
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("isOpen");
    document.body.classList.remove("menuOpen");
  };

  menu?.addEventListener("click", () => {
    const nextOpen = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(nextOpen));
    menu.setAttribute("aria-label", nextOpen ? "Close navigation" : "Open navigation");
    navigation?.classList.toggle("isOpen", nextOpen);
    document.body.classList.toggle("menuOpen", nextOpen);
  });

  navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeNavigation();
  });

  const dimensionName = document.getElementById("mp-dimension-name");
  const dimensionScore = document.getElementById("mp-dimension-score");
  const dimensionCopy = document.getElementById("mp-dimension-copy");
  const ratingRows = [...document.querySelectorAll(".mpRatingRow")];

  ratingRows.forEach((row) => {
    row.addEventListener("click", () => {
      const dimension = dimensions[Number(row.dataset.dimensionIndex)];
      if (!dimension) return;

      ratingRows.forEach((item) => {
        const active = item === row;
        item.classList.toggle("isActive", active);
        item.setAttribute("aria-pressed", String(active));
      });

      if (dimensionName) dimensionName.textContent = dimension.name;
      if (dimensionScore) dimensionScore.textContent = dimension.score;
      if (dimensionCopy) dimensionCopy.textContent = dimension.copy;
    });
  });

  bindLegacyPublicHomeEvents();
}
