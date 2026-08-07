const paperHref = "/src/assets/LMCA_dataset.pdf";
const pilotHref = "/research/";
const libraryHref = "/arguments/";

const dimensions = [
  {
    name: "Centrality",
    short: "Importance of the target",
    copy: "If the critique were right, how much of the position would it undo?",
    note: "Read this with strength. Their product estimates the critique’s effect on the position.",
  },
  {
    name: "Strength",
    short: "Force of the objection",
    copy: "How far does the critique establish the objection it actually makes?",
    note: "A strong objection to a minor point may still have little effect on the position as a whole.",
  },
  {
    name: "Correctness",
    short: "Truth of its claims",
    copy: "How much of the critique is correct, rather than false or misleading?",
    note: "Logical claims should be checked where practical; easy empirical checks should be made.",
  },
  {
    name: "Clarity",
    short: "Precision of meaning",
    copy: "After serious effort, can the critique’s meaning be fixed precisely enough to rate?",
    note: "Below 0.5, the other component scores become much less dependable.",
  },
  {
    name: "Dead weight",
    short: "Material that does no work",
    copy: "What fraction of the text neither argues, clarifies, nor supplies relevant evidence?",
    note: "A bad argument is not dead weight merely because it fails. Irrelevant material is.",
  },
  {
    name: "Single issue",
    short: "One objection or several",
    copy: "Does the critique pursue one issue, or several independent objections?",
    note: "This records focus, not quality.",
  },
  {
    name: "Overall",
    short: "All things considered",
    copy: "How good is the critique, taking its force, precision, correctness, and economy together?",
    note: "Start from strength × centrality, then adjust for the rest of the rubric.",
  },
];

function wordmark() {
  return `
    <span class="mpWordmark mpHeaderWordmark">
      <strong>Metaphilosophy</strong>
      <small>Expert ratings of philosophical arguments</small>
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

function externalIcon() {
  return `
    <svg class="mpArrow" aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M7 4H4.8A1.8 1.8 0 0 0 3 5.8v9.4A1.8 1.8 0 0 0 4.8 17h9.4a1.8 1.8 0 0 0 1.8-1.8V13M11 3h6v6M9 11l8-8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function rubricExplorer() {
  return `
    <article class="mpProtocolCard" id="rubric" aria-labelledby="mp-rubric-card-title">
      <div class="mpProtocolHeader">
        <div>
          <span>The rating form</span>
          <h2 id="mp-rubric-card-title">Seven questions about a critique</h2>
        </div>
        <span class="mpProtocolStatus"><i></i>Demonstration only</span>
      </div>

      <div class="mpProtocolBody">
        <div class="mpProtocolDimensions" role="group" aria-label="Rating dimensions">
          ${dimensions
            .map(
              (dimension, index) => `
                <button
                  class="mpProtocolDimension ${index === 0 ? "isActive" : ""}"
                  type="button"
                  data-dimension-index="${index}"
                  aria-pressed="${index === 0 ? "true" : "false"}"
                >
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <strong>${dimension.name}</strong>
                  <small>${dimension.short}</small>
                </button>
              `,
            )
            .join("")}
        </div>

        <div class="mpProtocolReadout" aria-live="polite">
          <p class="mpProtocolEyebrow">The question</p>
          <h3 id="mp-dimension-name">${dimensions[0].name}</h3>
          <p id="mp-dimension-copy">${dimensions[0].copy}</p>
          <div>
            <span>Rubric note</span>
            <strong id="mp-dimension-note">${dimensions[0].note}</strong>
          </div>
        </div>
      </div>

      <footer class="mpProtocolFooter">
        <span>Scores run from 0 to 1</span>
        <span>First ratings are blind and kept permanently</span>
        <a href="${paperHref}#page=24" target="_blank" rel="noreferrer">Read the original rubric ${externalIcon()}</a>
      </footer>
    </article>
  `;
}

function stateCard({ eyebrow, title, metric, detail, tag, tone, href, link }) {
  return `
    <article class="mpStateCard ${tone ? `is-${tone}` : ""}">
      <div class="mpStateCardTop">
        <span>${eyebrow}</span>
        <strong class="mpStateTag">${tag}</strong>
      </div>
      <p class="mpStateMetric">${metric}</p>
      <h3>${title}</h3>
      <p>${detail}</p>
      <a href="${href}">${link} ${arrowIcon()}</a>
    </article>
  `;
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
          <a href="#status">What exists</a>
          <a href="#method">How it works</a>
          <a href="#rubric">Rubric</a>
          <a href="#prior-work">Why arguments</a>
          <a href="${libraryHref}">Library</a>
        </nav>

        <a class="mpHeaderCta" href="${pilotHref}">Read the pilot plan ${arrowIcon()}</a>
      </header>

      <main id="main-content">
        <section class="mpHero" aria-labelledby="mp-hero-title">
          <span class="mpDotGrid" aria-hidden="true"></span>

          <div class="mpHeroCopy mpReveal isVisible">
            <p class="mpHeroStatus"><i></i>Research study not yet open</p>
            <h1 id="mp-hero-title">Philosophers can disagree and still judge arguments.</h1>
            <p>
              Metaphilosophy is a research project by Ellen Sun. It adapts the method introduced in <em>A dataset of rated conceptual arguments</em>: show a position and a critique together, then ask philosophers to judge the critique on several precise dimensions. The first Metaphilosophy study has not begun.
            </p>
            <div class="mpHeroActions">
              <a class="mpButton mpButtonPrimary" href="${pilotHref}">Read the pilot plan ${arrowIcon()}</a>
              <a class="mpButton mpButtonText" href="${libraryHref}">Browse the synthetic library ${arrowIcon()}</a>
            </div>
            <div class="mpHeroProof" aria-label="Current project facts">
              <span><i></i>1,000 synthetic critiques online</span>
              <span><i></i>48 critiques in the planned study</span>
              <span><i></i>0 research ratings collected</span>
            </div>
          </div>

          <div class="mpHeroVisual mpReveal isVisible">
            <span class="mpHeroShape mpHeroShapeA" aria-hidden="true"></span>
            <span class="mpHeroShape mpHeroShapeB" aria-hidden="true"></span>
            ${rubricExplorer()}
          </div>
        </section>

        <section class="mpSection mpStatusSection" id="status" aria-labelledby="mp-status-title">
          <div class="mpSectionHeader">
            <div>
              <p>What is here</p>
              <h2 id="mp-status-title">The library, the prior paper, and the planned study are different things.</h2>
            </div>
            <p>The numbers below should not be added together. They describe three separate bodies of work.</p>
          </div>

          <div class="mpStateGrid">
            ${stateCard({
              eyebrow: "Metaphilosophy",
              title: "Synthetic critique library",
              metric: "1,000",
              detail: "Model-written critiques of 250 positions. They are useful for browsing and testing the interface, but none has an expert score.",
              tag: "Unrated",
              tone: "public",
              href: libraryHref,
              link: "Open the library",
            })}
            ${stateCard({
              eyebrow: "Metaphilosophy",
              title: "Planned expert study",
              metric: "48",
              detail: "Twelve positions with four critiques each. Two independent philosophers would rate every critique. Recruitment for research ratings is closed.",
              tag: "Not started",
              tone: "pilot",
              href: pilotHref,
              link: "Read the plan",
            })}
            ${stateCard({
              eyebrow: "Cooper et al.",
              title: "LMCA dataset",
              metric: "951",
              detail: "Expert-rated critiques reported in the paper that Metaphilosophy builds on. Those ratings belong to the LMCA project, not to Metaphilosophy.",
              tag: "Prior work",
              tone: "external",
              href: paperHref,
              link: "Read the paper",
            })}
          </div>

          <aside class="mpBoundaryNote">
            <strong>The current record</strong>
            <p>LMCA reports 951 rated critiques and 1,458 ratings. Metaphilosophy currently has a separate synthetic library and no research ratings of its own.</p>
          </aside>
        </section>

        <section class="mpSection mpMethodSection" id="method" aria-labelledby="mp-method-title">
          <div class="mpSectionHeader">
            <div>
              <p>How a rating works</p>
              <h2 id="mp-method-title">One position. Four critiques. Two independent raters.</h2>
            </div>
            <p>The substantive method comes from LMCA. Metaphilosophy adds stricter assignment, access, and record-keeping controls around it.</p>
          </div>

          <ol class="mpMethodGrid">
            <li><span>01</span><h3>Read the position in context</h3><p>Raters see the position and all four critiques together. They judge the words on the page rather than guessing the author’s broader view.</p></li>
            <li><span>02</span><h3>Score each critique independently</h3><p>Two philosophers use the same seven-part rubric. Neither sees the other person’s score while making the first judgment.</p></li>
            <li><span>03</span><h3>Keep the first judgment</h3><p>If discussion later changes someone’s mind, the revision is added as a new record. The original score stays in the history.</p></li>
            <li><span>04</span><h3>Publish the uncertainty</h3><p>Some disagreements may remain. The report will show them rather than averaging them into a false consensus.</p></li>
          </ol>
        </section>

        <section class="mpSection mpResearchSection" id="prior-work" aria-labelledby="mp-research-title">
          <div class="mpResearchGrid">
            <article class="mpResearchLead">
              <p>The premise</p>
              <h2 id="mp-research-title">A conclusion can be unsettled even when a particular objection is weak.</h2>
              <p>Philosophers often disagree about the final answer. They can still ask narrower questions: Did this critique attack an important claim? Did it support the objection? Were its claims true? Was it clear? That narrower unit is the basis of the project.</p>
              <div class="mpResearchLinks">
                <a href="${paperHref}" target="_blank" rel="noreferrer">Read <em>A dataset of rated conceptual arguments</em> ${externalIcon()}</a>
                <a href="${pilotHref}">Read the Metaphilosophy study plan ${arrowIcon()}</a>
              </div>
            </article>

            <article class="mpGuardrailPanel">
              <div class="mpGuardrailHead"><span>Rules for the first study</span><strong>Fixed</strong></div>
              <ul>
                <li><strong>Separate sources</strong><span>LMCA ratings, synthetic material, and new Metaphilosophy ratings are never merged or relabelled.</span></li>
                <li><strong>Hide provenance</strong><span>Raters do not see who wrote a critique, whether it came from a model, or how anyone else scored it.</span></li>
                <li><strong>Keep every version</strong><span>Corrections and later reconsiderations do not overwrite the first rating.</span></li>
                <li><strong>Allow unresolved cases</strong><span>An adjudicator may document a disagreement, but cannot invent a compromise score.</span></li>
                <li><strong>Make modest claims</strong><span>Twelve positions can test the workflow. They cannot settle philosophy or rank philosophers.</span></li>
              </ul>
            </article>
          </div>
        </section>

        <section class="mpSection mpImpactSection" id="impact" aria-labelledby="mp-impact-title">
          <div class="mpImpactGrid">
            <div>
              <p>Why build this</p>
              <h2 id="mp-impact-title">AI systems already argue about questions that have no accepted answer key.</h2>
            </div>
            <div>
              <p>That happens in moral reasoning, AI governance, political philosophy, decision theory, and debates about digital minds. Better judgment in those areas would matter.</p>
              <p>The first question is much smaller: can this project collect expert ratings that are understandable, reproducible, and worth the time they cost?</p>
            </div>
          </div>
        </section>

        <section class="mpPreoutreach" aria-labelledby="mp-preoutreach-title">
          <div>
            <p>Status</p>
            <h2 id="mp-preoutreach-title">Research rating recruitment is closed.</h2>
            <p>The protected workflow has passed automated synthetic tests. The next step is a two-person synthetic usability check, followed by a final readiness decision. No research rating assignment is currently available.</p>
          </div>
          <div class="mpPreoutreachActions">
            <a class="mpButton mpButtonPrimary" href="${pilotHref}">Read the study plan ${arrowIcon()}</a>
            <a class="mpButton mpButtonText" href="${libraryHref}">Browse the library ${arrowIcon()}</a>
          </div>
        </section>
      </main>

      <footer class="mpFooter">
        <a href="/" aria-label="Metaphilosophy home">${wordmark()}</a>
        <p>A research project by Ellen Sun. The first expert-rating study has not begun.</p>
        <nav aria-label="Footer navigation">
          <a href="${pilotHref}">Pilot plan</a>
          <a href="${libraryHref}">Synthetic library</a>
          <a href="${paperHref}" target="_blank" rel="noreferrer">LMCA paper</a>
        </nav>
      </footer>
    </div>
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
  const dimensionCopy = document.getElementById("mp-dimension-copy");
  const dimensionNote = document.getElementById("mp-dimension-note");
  const dimensionButtons = [...document.querySelectorAll(".mpProtocolDimension")];

  dimensionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const dimension = dimensions[Number(button.dataset.dimensionIndex)];
      if (!dimension) return;

      dimensionButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("isActive", active);
        item.setAttribute("aria-pressed", String(active));
      });

      if (dimensionName) dimensionName.textContent = dimension.name;
      if (dimensionCopy) dimensionCopy.textContent = dimension.copy;
      if (dimensionNote) dimensionNote.textContent = dimension.note;
    });
  });
}
