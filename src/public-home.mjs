const paperHref = "/src/assets/LMCA_dataset.pdf";
const forethoughtHref = "https://www.forethought.org/research/ai-tools-for-existential-security";
const intelligenceExplosionHref = "https://www.forethought.org/research/preparing-for-the-intelligence-explosion";

const dimensions = [
  { name: "Centrality", mean: 82, low: 66, high: 94 },
  { name: "Strength", mean: 58, low: 42, high: 79 },
  { name: "Correctness", mean: 76, low: 61, high: 90 },
  { name: "Clarity", mean: 91, low: 78, high: 98 },
  { name: "Dead weight", mean: 18, low: 4, high: 34, inverse: true },
  { name: "Single issue", mean: 86, low: 68, high: 96 },
  { name: "Overall", mean: 71, low: 54, high: 84 },
];

function mark(className = "") {
  return `
    <svg class="epMark ${className}" viewBox="0 0 48 48" role="img" aria-label="Metaphilosophy">
      <path d="M8 9H4v30h4M40 9h4v30h-4" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <path d="M13 33V16M18 37V11M23 29V20M28 35V13M33 27V22M38 34V15" fill="none" stroke="currentColor" stroke-width="2.4"/>
      <path d="M28 19v7" fill="none" stroke="var(--ep-coral)" stroke-width="3"/>
    </svg>
  `;
}

function arrowIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 18 18" fill="none">
      <path d="M2.5 9h12M10.2 4.6 14.6 9l-4.4 4.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function externalIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 18 18" fill="none">
      <path d="M7 4H4.5A1.5 1.5 0 0 0 3 5.5v8A1.5 1.5 0 0 0 4.5 15h8a1.5 1.5 0 0 0 1.5-1.5V11M10 3h5v5M9 9l6-6" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function profileRows() {
  return dimensions
    .map(
      ({ name, mean, low, high, inverse }) => `
        <div class="epProfileRow${inverse ? " isInverse" : ""}" style="--mean:${mean}%;--low:${low}%;--high:${high}%">
          <span>${name}</span>
          <div class="epProfileScale" aria-label="${name}: expert mean ${mean} out of 100; central 80 percent range ${low} to ${high}">
            <i class="epProfileRange"></i>
            <i class="epProfileWhisker"></i>
            <b class="epProfileMean"></b>
          </div>
          <strong>${mean}</strong>
        </div>
      `,
    )
    .join("");
}

function smallIcon(type) {
  const paths = {
    people: `<path d="M5 15c0-2.4 1.8-4 4-4s4 1.6 4 4M9 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14 9.5c1.8.2 3 1.6 3 3.5M14.2 4.2a2.4 2.4 0 0 1 0 4.6"/>`,
    data: `<ellipse cx="9" cy="4" rx="5.5" ry="2.2"/><path d="M3.5 4v5c0 1.2 2.5 2.2 5.5 2.2S14.5 10.2 14.5 9V4M3.5 9v5c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2V9"/>`,
    chip: `<rect x="4" y="4" width="10" height="10" rx="2"/><path d="M7 1.8v2.1M11 1.8v2.1M7 14.1v2.1M11 14.1v2.1M1.8 7h2.1M1.8 11h2.1M14.1 7h2.1M14.1 11h2.1M7 7h4v4H7z"/>`,
    scale: `<path d="M9 2v14M4 5h10M5.5 5 3 10h5L5.5 5ZM12.5 5 10 10h5l-2.5-5ZM6 15h6"/>`,
    compass: `<circle cx="9" cy="9" r="6.5"/><path d="m11.8 6.2-1.4 4.2-4.2 1.4 1.4-4.2 4.2-1.4Z"/>`,
    network: `<circle cx="4" cy="9" r="2"/><circle cx="14" cy="4" r="2"/><circle cx="14" cy="14" r="2"/><path d="m5.8 8.1 6.4-3.2M5.8 9.9l6.4 3.2M14 6v6"/>`,
    star: `<path d="M9 1.8 10.5 7 16 9l-5.5 2L9 16.2 7.5 11 2 9l5.5-2L9 1.8Z"/>`,
  };
  return `<svg class="epSmallIcon" aria-hidden="true" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${paths[type]}</svg>`;
}

function researchBars() {
  const models = [
    ["GPT-5", 80],
    ["o3-pro", 83],
    ["Claude Opus 4.1", 90],
    ["Random baseline", 173],
  ];
  return models
    .map(
      ([label, value]) => `
        <div class="epBenchRow">
          <span>${label}</span>
          <i><b style="--bar:${Math.round((value / 173) * 100)}%"></b></i>
          <strong>${(value / 1000).toFixed(3)}</strong>
        </div>
      `,
    )
    .join("");
}

export function publicHomePage() {
  return `
    <a class="epSkip" href="#main-content">Skip to content</a>
    <div class="epSite">
      <header class="epHeader">
        <a class="epBrand" href="/" aria-label="Metaphilosophy home">
          ${mark("epBrandMark")}
          <span><strong>Metaphilosophy</strong><small>Human-rated philosophical reasoning for AI</small></span>
        </a>

        <button class="epMenuButton" type="button" aria-expanded="false" aria-controls="ep-navigation">
          <span></span><span></span><span class="srOnly">Open navigation</span>
        </button>

        <nav class="epNav" id="ep-navigation" aria-label="Primary navigation">
          <a href="#research">Research</a>
          <a href="#dataset">Dataset</a>
          <a href="#method">Method</a>
          <a href="#impact">Impact</a>
          <a href="/contribute">Contribute</a>
        </nav>

        <a class="epHeaderAction" href="/?section=rating">Open workspace ${arrowIcon()}</a>
      </header>

      <main id="main-content">
        <section class="epHero" aria-labelledby="ep-hero-title">
          <div class="epHeroCopy epReveal isVisible">
            <h1 id="ep-hero-title">Teaching AI to do philosophy.</h1>
            <p class="epHeroLede">
              Metaphilosophy is a platform where philosophers and domain experts rate arguments. Their calibrated judgments become the data needed to train and evaluate AI on questions without ground-truth answers.
            </p>
            <div class="epHeroActions">
              <a class="epPrimaryButton" href="/contribute">Contribute as an expert ${arrowIcon()}</a>
              <a class="epTextButton" href="#dataset">Explore the dataset ${arrowIcon()}</a>
            </div>

            <div class="epBenefitRail" aria-label="How the platform works">
              <div>${smallIcon("people")}<p><strong>Human experts</strong><span>Evaluate contextualized arguments across seven dimensions.</span></p></div>
              <div>${smallIcon("data")}<p><strong>High-quality data</strong><span>Blind, versioned ratings become training and evaluation signal.</span></p></div>
              <div>${smallIcon("chip")}<p><strong>Better AI reasoning</strong><span>Models learn to judge arguments, not just produce plausible text.</span></p></div>
            </div>
          </div>

          <div class="epProfileCard epReveal isVisible" aria-label="Example expert rating profile">
            <div class="epProfileTop">
              <div><h2>Argument profile</h2><p>Example critique rated by expert philosophers</p></div>
              <div class="epProfileControls" role="group" aria-label="Argument profile display">
                <button class="isActive" type="button" data-profile-mode="both">Mean + range</button>
                <button type="button" data-profile-mode="mean">Mean only</button>
              </div>
            </div>
            <div class="epProfileLegend"><span><i></i>Expert mean</span><span><i></i>Expert range (middle 80%)</span></div>
            <div class="epProfileRows">${profileRows()}</div>
            <div class="epProfileAxis"><span>0</span><span>50</span><span>100</span></div>
            <div class="epProfileStats" id="dataset">
              <div><strong>951</strong><span>Rated critiques</span></div>
              <div><strong>1,458</strong><span>Expert ratings</span></div>
              <div><strong>442</strong><span>Positions</span></div>
              <div><strong>478</strong><span>Model-written critiques rated</span></div>
              <a href="${paperHref}" target="_blank" rel="noreferrer"><span>Research release</span><strong>Read the paper</strong>${arrowIcon()}</a>
            </div>
          </div>
        </section>

        <section class="epSignalBand" id="method" aria-labelledby="ep-method-title">
          <div class="epSignalIntro epReveal">
            <p>Human judgment becomes a learning signal.</p>
            <h2 id="ep-method-title">A platform for philosophical progress.</h2>
          </div>
          <div class="epSignalFlow epReveal">
            <article><span>01</span>${smallIcon("people")}<h3>Experts evaluate arguments</h3><p>Raters read a position and critique in context, then score the critique using a rigorous rubric.</p></article>
            <i aria-hidden="true">${arrowIcon()}</i>
            <article><span>02</span>${smallIcon("data")}<h3>We build the data</h3><p>Ratings, revisions, and disagreements are preserved as auditable evidence for research.</p></article>
            <i aria-hidden="true">${arrowIcon()}</i>
            <article><span>03</span>${smallIcon("chip")}<h3>AI systems improve</h3><p>The dataset supports model evaluation, targeted training, and better philosophical assistance.</p></article>
          </div>
          <div class="epSignalNote epReveal">
            <strong>Why arguments?</strong>
            <p>Many important questions lack an accessible ground truth or accepted resolution method. But careful argument and critique can still move inquiry forward.</p>
          </div>
        </section>

        <section class="epResearch" id="research" aria-labelledby="ep-research-title">
          <div class="epResearchHeader epReveal">
            <div><p>Research infrastructure</p><h2 id="ep-research-title">Measure the quality of reasoning, not agreement with a conclusion.</h2></div>
            <p>Metaphilosophy focuses on contextualized critiques because experts can often assess the quality of an argument even when they disagree about the final answer.</p>
          </div>

          <div class="epResearchGrid">
            <article class="epRubricPanel epReveal">
              <div class="epPanelHead"><span>Seven-dimensional rubric</span><strong>0–1</strong></div>
              <ol>
                <li><span>01</span><strong>Centrality</strong><p>How important is the issue attacked?</p></li>
                <li><span>02</span><strong>Strength</strong><p>How successfully is it weakened?</p></li>
                <li><span>03</span><strong>Correctness</strong><p>How much of the critique is true?</p></li>
                <li><span>04</span><strong>Clarity</strong><p>Can its meaning be pinned down?</p></li>
                <li><span>05</span><strong>Dead weight</strong><p>How much material is irrelevant?</p></li>
                <li><span>06</span><strong>Single issue</strong><p>Does it stay on one line of attack?</p></li>
                <li><span>07</span><strong>Overall</strong><p>How good is the critique, all considered?</p></li>
              </ol>
            </article>

            <article class="epBenchmarkPanel epReveal">
              <div class="epPanelHead"><span>Weighted pairwise ranking error</span><strong>Lower is better</strong></div>
              <div class="epBenchRows">${researchBars()}</div>
              <p>Model rankings broadly track general capability, but additional “thinking” usually changes performance only slightly.</p>
              <a href="${paperHref}" target="_blank" rel="noreferrer">Read the experiments ${arrowIcon()}</a>
            </article>
          </div>
        </section>

        <section class="epImpact" id="impact" aria-labelledby="ep-impact-title">
          <div class="epImpactLead epReveal">
            <p>Why it matters</p>
            <h2 id="ep-impact-title">Better philosophical reasoning could matter on an astronomical scale.</h2>
            <p class="epImpactLede">
              Advanced AI could compress decades of intellectual and technological change into years. Humanity may need to make fast, hard-to-reverse decisions about power, coordination, digital minds, moral status, and what kind of future to build. Better AI philosophy could help us reason through those decisions with more care.
            </p>
            <div class="epImpactLinks">
              <a href="${forethoughtHref}" target="_blank" rel="noreferrer">Forethought: AI tools for existential security ${externalIcon()}</a>
              <a href="${intelligenceExplosionHref}" target="_blank" rel="noreferrer">Preparing for the intelligence explosion ${externalIcon()}</a>
            </div>
          </div>

          <div class="epImpactMap epReveal">
            <article>${smallIcon("scale")}<span>01</span><h3>Moral reflection</h3><p>Help people examine values, trade-offs, and subtle moral errors before they become embedded in high-stakes decisions.</p></article>
            <article>${smallIcon("network")}<span>02</span><h3>Collective decisions</h3><p>Support better deliberation and coordination when institutions face unfamiliar choices under severe time pressure.</p></article>
            <article>${smallIcon("compass")}<span>03</span><h3>Digital minds</h3><p>Reason more clearly about consciousness, moral status, rights, and obligations toward potentially vast digital populations.</p></article>
            <article>${smallIcon("star")}<span>04</span><h3>Great futures</h3><p>Go beyond avoiding catastrophe: identify and navigate opportunities to improve quality of life, knowledge, and cooperation.</p></article>
          </div>
        </section>

        <section class="epPublication" aria-labelledby="ep-publication-title">
          <div class="epPublicationCard epReveal">
            <div class="epPaperMeta"><span>Paper 01</span><span>Dataset release</span></div>
            <h2 id="ep-publication-title">A dataset of rated conceptual arguments</h2>
            <p>Emery Cooper · Caspar Oesterheld · Linh Chi Nguyen · Alexander Kastner · Ethan Perez</p>
            <div class="epPaperStats"><span><strong>951</strong> critiques</span><span><strong>1,458</strong> ratings</span><span><strong>7</strong> dimensions</span></div>
            <a class="epPrimaryButton" href="${paperHref}" target="_blank" rel="noreferrer">Read the paper ${arrowIcon()}</a>
          </div>
          <div class="epTopics epReveal">
            <p>Questions represented in the dataset</p>
            <ul><li>AI safety</li><li>Decision theory</li><li>Normative ethics</li><li>Philosophy of mind</li><li>Politics</li><li>Conceptual analysis</li></ul>
          </div>
        </section>

        <section class="epContribute" aria-labelledby="ep-contribute-title">
          <div class="epContributeGraphic" aria-hidden="true">${mark("epContributeMark")}</div>
          <div class="epContributeCopy epReveal">
            <p>Contribute</p>
            <h2 id="ep-contribute-title">Help build the feedback AI cannot get from ground truth.</h2>
            <span>Philosophers and domain experts can contribute ratings, calibration judgments, disagreement analysis, and rubric improvements.</span>
            <div><a class="epLightButton" href="/contribute">Become an expert rater ${arrowIcon()}</a><a class="epDarkTextButton" href="/?section=rating">Open the workspace ${arrowIcon()}</a></div>
          </div>
        </section>
      </main>

      <footer class="epFooter">
        <a class="epBrand epFooterBrand" href="/">${mark("epBrandMark")}<span><strong>Metaphilosophy</strong><small>Human-rated philosophical reasoning for AI</small></span></a>
        <p>Building datasets and evaluation infrastructure for AI systems that can reason more carefully about humanity’s hardest questions.</p>
        <nav aria-label="Footer navigation"><a href="#research">Research</a><a href="#dataset">Dataset</a><a href="/contribute">Contribute</a><a href="/?section=rating">Workspace</a></nav>
      </footer>
    </div>
  `;
}

export function bindPublicHomeEvents() {
  document.body.classList.add("publicHomeBody", "epochHomeBody");

  const menuButton = document.querySelector(".epMenuButton");
  const navigation = document.querySelector(".epNav");
  const closeMenu = () => {
    menuButton?.setAttribute("aria-expanded", "false");
    navigation?.classList.remove("isOpen");
    document.body.classList.remove("epMenuOpen");
  };

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      navigation.classList.toggle("isOpen", !isOpen);
      document.body.classList.toggle("epMenuOpen", !isOpen);
    });
    navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 960) closeMenu();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  const profileCard = document.querySelector(".epProfileCard");
  document.querySelectorAll("[data-profile-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-profile-mode]").forEach((item) => item.classList.remove("isActive"));
      button.classList.add("isActive");
      profileCard?.classList.toggle("meanOnly", button.dataset.profileMode === "mean");
    });
  });

  const revealItems = document.querySelectorAll(".epReveal:not(.isVisible)");
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("isVisible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("isVisible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );
  revealItems.forEach((item) => observer.observe(item));
}
