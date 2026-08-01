const paperHref = "/src/assets/LMCA_dataset.pdf";
const pilotHref = "/research/";
const libraryHref = "/arguments/";

const dimensions = [
  {
    name: "Centrality",
    short: "Issue importance",
    copy: "How much would the position weaken if the claims attacked by the critique were successfully refuted?",
    note: "Interpret together with strength; the product is the substantive-impact quantity.",
  },
  {
    name: "Strength",
    short: "Attack success",
    copy: "How successfully does the critique undermine the particular claims or inferences it attacks?",
    note: "A critique can be strong against a minor point or weak against a central one.",
  },
  {
    name: "Correctness",
    short: "Claim accuracy",
    copy: "What proportion of the critique is substantively correct rather than false or misleading?",
    note: "Correctness-sensitive claims should be verified where practical.",
  },
  {
    name: "Clarity",
    short: "Interpretability",
    copy: "After careful reading, can an expert pin down what the critique is arguing and what follows from it?",
    note: "Very low clarity makes the other dimensions less reliable.",
  },
  {
    name: "Dead weight",
    short: "Irrelevant content",
    copy: "How much material fails to contribute to the critique’s argument, clarification, or evidential value?",
    note: "Bad arguments are not automatically dead weight; irrelevant material is.",
  },
  {
    name: "Single issue",
    short: "Focus",
    copy: "Does the critique stay on one line of attack rather than scattering across independent objections?",
    note: "This is recorded separately from whether the critique is good.",
  },
  {
    name: "Overall",
    short: "All considered",
    copy: "How good is the critique all considered—its force, insight, precision, correctness, and economy?",
    note: "Overall is anchored to strength × centrality, then adjusted for the other dimensions.",
  },
];

function wordmark() {
  return `
    <span class="mpWordmark mpHeaderWordmark">
      <strong>Metaphilosophy</strong>
      <small>Human judgment for AI philosophy</small>
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
          <span>Protocol preview</span>
          <h2 id="mp-rubric-card-title">Seven-dimensional critique rating</h2>
        </div>
        <span class="mpProtocolStatus"><i></i>No production data loaded</span>
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
          <p class="mpProtocolEyebrow">What the dimension asks</p>
          <h3 id="mp-dimension-name">${dimensions[0].name}</h3>
          <p id="mp-dimension-copy">${dimensions[0].copy}</p>
          <div>
            <span>Interpretation note</span>
            <strong id="mp-dimension-note">${dimensions[0].note}</strong>
          </div>
        </div>
      </div>

      <footer class="mpProtocolFooter">
        <span>Scores run from 0 to 1</span>
        <span>Initial ratings remain blind and append-only</span>
        <a href="${paperHref}#page=24" target="_blank" rel="noreferrer">Read the source rubric ${externalIcon()}</a>
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
          <a href="#status">Status</a>
          <a href="#method">Method</a>
          <a href="#rubric">Rubric</a>
          <a href="#prior-work">Prior work</a>
          <a href="${libraryHref}">Library</a>
        </nav>

        <a class="mpHeaderCta" href="${pilotHref}">View pilot protocol ${arrowIcon()}</a>
      </header>

      <main id="main-content">
        <section class="mpHero" aria-labelledby="mp-hero-title">
          <span class="mpDotGrid" aria-hidden="true"></span>

          <div class="mpHeroCopy mpReveal isVisible">
            <p class="mpHeroStatus"><i></i>Pilot in preparation · expert ratings have not started</p>
            <h1 id="mp-hero-title">Building the evidence layer for AI philosophy.</h1>
            <p>
              Metaphilosophy is preparing a small, auditable pilot in which qualified human reviewers evaluate philosophical critiques. The goal is to test whether expert judgment can become reliable training and evaluation data without pretending that philosophy has an easy answer key.
            </p>
            <div class="mpHeroActions">
              <a class="mpButton mpButtonPrimary" href="${pilotHref}">Read the pilot protocol ${arrowIcon()}</a>
              <a class="mpButton mpButtonText" href="${libraryHref}">Explore the public synthetic library ${arrowIcon()}</a>
            </div>
            <div class="mpHeroProof" aria-label="Current project facts">
              <span><i></i>1,000 public synthetic critiques</span>
              <span><i></i>48-critique expert pilot planned</span>
              <span><i></i>No Metaphilosophy expert ratings claimed yet</span>
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
              <p>Evidence boundary</p>
              <h2 id="mp-status-title">Clear about what exists—and what does not.</h2>
            </div>
            <p>Metaphilosophy keeps public synthetic material, external prior work, planned expert research, and future training data in separate artifact classes.</p>
          </div>

          <div class="mpStateGrid">
            ${stateCard({
              eyebrow: "Public now",
              title: "Synthetic argument library",
              metric: "1,000",
              detail: "Model-authored critiques across 250 positions and 25 domains. They are public, useful for exploration, and explicitly unrated.",
              tag: "Unrated",
              tone: "public",
              href: libraryHref,
              link: "Browse the release",
            })}
            ${stateCard({
              eyebrow: "Preparing",
              title: "Human-expert pilot",
              metric: "48",
              detail: "Twelve positions, four critiques each, and two blind initial ratings per critique. The protocol is open for methodological criticism; the study has not started.",
              tag: "Not started",
              tone: "pilot",
              href: pilotHref,
              link: "Inspect the design",
            })}
            ${stateCard({
              eyebrow: "External prior work",
              title: "LMCA research release",
              metric: "951",
              detail: "Rated critiques reported by Cooper, Oesterheld, Nguyen, Kastner, and Perez. Metaphilosophy cites this as prior art and does not present those ratings as its own.",
              tag: "External",
              tone: "external",
              href: paperHref,
              link: "Read the paper",
            })}
          </div>

          <aside class="mpBoundaryNote">
            <strong>Source boundary</strong>
            <p>The LMCA paper reports 951 rated critiques and 1,458 ratings. Metaphilosophy’s separate public release contains 1,000 synthetic critiques and zero expert ratings. The proposed pilot would add new human judgments only after all readiness gates pass.</p>
          </aside>
        </section>

        <section class="mpSection mpMethodSection" id="method" aria-labelledby="mp-method-title">
          <div class="mpSectionHeader">
            <div>
              <p>Proposed workflow</p>
              <h2 id="mp-method-title">Measure arguments without manufacturing consensus.</h2>
            </div>
            <p>The pilot is designed to preserve independent judgments, expose uncertainty, and fail closed when the evidence or operating conditions are not adequate.</p>
          </div>

          <ol class="mpMethodGrid">
            <li><span>01</span><h3>Select difficult, contextualized critiques</h3><p>Each position receives four critiques chosen only after source, length, style, attack-family, and acquisition-judge confounds are recorded.</p></li>
            <li><span>02</span><h3>Collect blind initial ratings</h3><p>Two qualified reviewers independently score all four sibling critiques using the same frozen context and seven-dimensional rubric.</p></li>
            <li><span>03</span><h3>Preserve disagreement</h3><p>Original ratings remain immutable. Object-level reconsideration creates a new linked record; unresolved interpretation can remain unresolved.</p></li>
            <li><span>04</span><h3>Report the evidence honestly</h3><p>Results remain position-level and uncertainty-aware. A successful pilot does not automatically authorize a larger dataset or strong causal claims.</p></li>
          </ol>
        </section>

        <section class="mpSection mpResearchSection" id="prior-work" aria-labelledby="mp-research-title">
          <div class="mpResearchGrid">
            <article class="mpResearchLead">
              <p>Why arguments?</p>
              <h2 id="mp-research-title">Important conceptual questions often lack an accessible ground truth.</h2>
              <p>It may still be possible to make progress by evaluating contextualized arguments: whether a critique attacks a central issue, whether it succeeds, whether its claims are correct, and whether its meaning can be pinned down.</p>
              <div class="mpResearchLinks">
                <a href="${paperHref}" target="_blank" rel="noreferrer">Read “A dataset of rated conceptual arguments” ${externalIcon()}</a>
                <a href="${pilotHref}">Read Metaphilosophy’s pilot protocol ${arrowIcon()}</a>
              </div>
            </article>

            <article class="mpGuardrailPanel">
              <div class="mpGuardrailHead"><span>Pre-outreach quality gate</span><strong>Required</strong></div>
              <ul>
                <li><strong>Attribution</strong><span>External ratings and Metaphilosophy records remain visibly separate.</span></li>
                <li><strong>Blindness</strong><span>Source, author/model identity, provisional strata, and other ratings stay hidden initially.</span></li>
                <li><strong>Append-only evidence</strong><span>Initial ratings, corrections, reratings, and adjudication records are never silently overwritten.</span></li>
                <li><strong>No forced convergence</strong><span>Adjudicators cannot impose replacement scores or erase residual disagreement.</span></li>
                <li><strong>Small-sample restraint</strong><span>The 12-position pilot tests workflow feasibility; it cannot settle broad philosophical or model-performance questions.</span></li>
              </ul>
            </article>
          </div>
        </section>

        <section class="mpSection mpImpactSection" id="impact" aria-labelledby="mp-impact-title">
          <div class="mpImpactGrid">
            <div>
              <p>Why test this</p>
              <h2 id="mp-impact-title">AI may increasingly assist decisions where values, concepts, and arguments matter.</h2>
            </div>
            <div>
              <p>Better tools for examining philosophical arguments could be valuable in AI governance, moral uncertainty, digital-mind questions, coordination, and long-run strategy. That is a motivation for the research—not a result the current dataset has established.</p>
              <p>The immediate objective is narrower: determine whether Metaphilosophy can collect expert judgments that are blind, auditable, sufficiently reliable, and operationally sustainable.</p>
            </div>
          </div>
        </section>

        <section class="mpPreoutreach" aria-labelledby="mp-preoutreach-title">
          <div>
            <p>Current operating status</p>
            <h2 id="mp-preoutreach-title">Reviewer intake and adviser outreach remain closed.</h2>
            <p>Metaphilosophy is improving the public product, screening calibration candidates, and completing methodological checks before asking experts for time. No unsolicited rating work or application is currently requested.</p>
          </div>
          <div class="mpPreoutreachActions">
            <a class="mpButton mpButtonPrimary" href="${pilotHref}">Review the protocol ${arrowIcon()}</a>
            <a class="mpButton mpButtonText" href="${libraryHref}">Browse public materials ${arrowIcon()}</a>
          </div>
        </section>
      </main>

      <footer class="mpFooter">
        <a href="/" aria-label="Metaphilosophy home">${wordmark()}</a>
        <p>Human judgment infrastructure for conceptual reasoning. Pilot in preparation; no production expert ratings have started.</p>
        <nav aria-label="Footer navigation">
          <a href="${pilotHref}">Pilot protocol</a>
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
