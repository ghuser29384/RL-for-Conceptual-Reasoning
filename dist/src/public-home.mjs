const paperFallbackHref = "/src/assets/LMCA_dataset.pdf";

const dimensions = [
  ["Centrality", "How important is the issue attacked by the critique?"],
  ["Strength", "How successfully does the critique weaken that issue?"],
  ["Correctness", "What proportion of the critique is substantively correct?"],
  ["Clarity", "Can the critique's intended meaning be pinned down?"],
  ["Dead weight", "How much material does not contribute to the argument?"],
  ["Single issue", "Does the critique stay focused on one line of attack?"],
  ["Overall", "How good is the critique, all things considered?"],
];

const authors = ["Emery Cooper*", "Caspar Oesterheld*", "Linh Chi Nguyen", "Alexander Kastner", "Ethan Perez"];

function brandMark(className = "") {
  return `
    <svg class="anMark ${className}" viewBox="0 0 92 92" role="img" aria-label="Metaphilosophy: seven dimensions of argument quality">
      <path class="anMarkBracket" d="M19 11H9v70h10M73 11h10v70H73" />
      <line class="anMarkRail" x1="27" y1="64" x2="27" y2="29" />
      <line class="anMarkRail" x1="35" y1="70" x2="35" y2="22" />
      <line class="anMarkRail" x1="43" y1="58" x2="43" y2="34" />
      <line class="anMarkRail" x1="51" y1="74" x2="51" y2="18" />
      <line class="anMarkRail" x1="59" y1="51" x2="59" y2="41" />
      <line class="anMarkRail" x1="67" y1="66" x2="67" y2="26" />
      <line class="anMarkRail" x1="75" y1="71" x2="75" y2="21" />
      <line class="anMarkAccent" x1="51" y1="37" x2="51" y2="26" />
    </svg>
  `;
}

function arrowIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 18 18" fill="none">
      <path d="M2.5 9h12M10 4.5 14.5 9 10 13.5" stroke="currentColor" stroke-width="1.35" stroke-linecap="square" stroke-linejoin="miter"/>
    </svg>
  `;
}

function downloadIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 18 18" fill="none">
      <path d="M9 2.5v9M5.7 8.7 9 12l3.3-3.3M3 15.5h12" stroke="currentColor" stroke-width="1.35" stroke-linecap="square" stroke-linejoin="miter"/>
    </svg>
  `;
}

function heroMeasure(label, value, position) {
  return `<div class="anHeroMeasure" style="--measure:${position}"><span>${label}</span><i></i><strong>${value}</strong></div>`;
}

export function publicHomePage() {
  return `
    <a class="anSkip" href="#main-content">Skip to content</a>
    <div class="andnowHome">
      <header class="anHeader">
        <a class="anBrand" href="/" aria-label="Metaphilosophy home">
          ${brandMark("anBrandMark")}
          <span>Metaphilosophy</span>
        </a>

        <button class="anMenuButton" type="button" aria-expanded="false" aria-controls="an-navigation">
          <span></span><span></span>
          <span class="srOnly">Open navigation</span>
        </button>

        <nav class="anNavigation" id="an-navigation" aria-label="Primary navigation">
          <a href="#research">Research</a>
          <a href="#dataset">Dataset</a>
          <a href="#method">Method</a>
          <a href="#publication">Publication</a>
          <a href="#about">About</a>
        </nav>

        <a class="anHeaderAction" href="/?section=rating">Research workspace ${arrowIcon()}</a>
      </header>

      <main id="main-content">
        <section class="anHero" aria-labelledby="hero-title">
          <div class="anHeroCopy anReveal isVisible">
            <div class="anKicker"><span>Research release</span><strong>01 / 2026</strong></div>
            <h1 id="hero-title">Rigorous data for better reasoning on hard questions.</h1>
            <p class="anHeroLede">
              We collect, evaluate, and publish expert judgments of philosophical arguments across seven core dimensions.
            </p>
            <div class="anHeroActions">
              <a class="anPrimaryAction" href="#dataset">Explore the dataset ${arrowIcon()}</a>
              <a class="anLineAction" href="${paperFallbackHref}" data-paper-link target="_blank" rel="noreferrer">Read the paper ${arrowIcon()}</a>
            </div>
          </div>

          <div class="anHeroGraphic anReveal isVisible" aria-label="A seven-dimensional argument-quality profile">
            <div class="anHeroGrid" aria-hidden="true"></div>
            <div class="anHeroMarkFrame">
              ${brandMark("anHeroMark")}
            </div>
            ${heroMeasure("Centrality", "0.80", "17%")}
            ${heroMeasure("Strength", "0.62", "31%")}
            ${heroMeasure("Correctness", "0.94", "45%")}
            ${heroMeasure("Clarity", "0.90", "59%")}
            ${heroMeasure("Overall", "0.72", "73%")}
            <div class="anHeroIndex">ARGUMENT PROFILE <strong>1278</strong></div>
          </div>
        </section>

        <section class="anMission anSection" id="research" aria-labelledby="mission-title">
          <div class="anSectionLabel anReveal"><span>01</span><strong>Our mission</strong></div>
          <div class="anMissionStatement anReveal">
            <h2 id="mission-title">Teaching AI what counts as good philosophy.</h2>
          </div>
          <div class="anMissionDetail anReveal">
            <p>
              Metaphilosophy turns human expert judgments of philosophical arguments into datasets for training and evaluating AI systems.
            </p>
            <p>Building a dataset to train AI to do better philosophy.</p>
            <a class="anTextAction" href="#dataset">Explore the dataset ${arrowIcon()}</a>
          </div>
        </section>

        <section class="anDataset anSection" id="dataset" aria-labelledby="dataset-title">
          <div class="anDatasetIntro anReveal">
            <div class="anSectionLabel anSectionLabelDark"><span>02</span><strong>The dataset</strong></div>
            <h2 id="dataset-title">Argument quality, made legible.</h2>
            <p>
              Each record links a position, a critique, and one or more blind expert ratings. Revisions and disagreements remain part of the evidence rather than being erased.
            </p>
          </div>

          <dl class="anDatasetMetrics anReveal">
            <div><dt>Rated critiques</dt><dd>951</dd></div>
            <div><dt>Expert ratings</dt><dd>1,458</dd></div>
            <div><dt>Positions</dt><dd>442</dd></div>
            <div><dt>Model-written critiques</dt><dd>478</dd></div>
          </dl>

          <div class="anDatasetFoot anReveal">
            <span>Domains</span>
            <p>AI safety · decision theory · normative ethics · philosophy of mind · politics</p>
            <a href="${paperFallbackHref}" data-paper-link target="_blank" rel="noreferrer">Dataset methodology ${arrowIcon()}</a>
          </div>
        </section>

        <section class="anMethod anSection" id="method" aria-labelledby="method-title">
          <div class="anMethodHeading anReveal">
            <div class="anSectionLabel"><span>03</span><strong>Method</strong></div>
            <h2 id="method-title">From philosophical text to auditable signal.</h2>
          </div>

          <div class="anMethodSteps">
            <article class="anMethodStep anReveal">
              <span>01</span>
              <h3>Position</h3>
              <p>A concrete claim or argument, read literally and with enough context to identify what is at stake.</p>
            </article>
            <article class="anMethodStep anReveal">
              <span>02</span>
              <h3>Critique</h3>
              <p>An objection that targets a particular issue rather than merely stating a competing conclusion.</p>
            </article>
            <article class="anMethodStep anReveal">
              <span>03</span>
              <h3>Expert profile</h3>
              <p>Seven linked judgments capture impact, quality, precision, focus, and holistic value.</p>
            </article>
            <article class="anMethodStep anReveal">
              <span>04</span>
              <h3>Model evaluation</h3>
              <p>Point-wise and pairwise losses compare model judgments with frozen human evidence.</p>
            </article>
          </div>
        </section>

        <section class="anRubric anSection" aria-labelledby="rubric-title">
          <div class="anRubricLead anReveal">
            <div class="anSectionLabel"><span>04</span><strong>Evaluation system</strong></div>
            <h2 id="rubric-title">Seven dimensions. One disciplined reading.</h2>
            <p>Each dimension answers a different question. Together they preserve the anatomy of a critique instead of collapsing it too early into a single score.</p>
            <div class="anRubricMark">${brandMark()}</div>
          </div>
          <ol class="anRubricList">
            ${dimensions
              .map(
                ([title, description], index) => `
                  <li class="anReveal">
                    <span>${String(index + 1).padStart(2, "0")}</span>
                    <h3>${title}</h3>
                    <p>${description}</p>
                  </li>
                `,
              )
              .join("")}
          </ol>
        </section>

        <section class="anFindings anSection" aria-labelledby="findings-title">
          <div class="anFindingsHeading anReveal">
            <div class="anSectionLabel"><span>05</span><strong>Initial findings</strong></div>
            <h2 id="findings-title">Better models judge arguments better. More thinking is not the whole answer.</h2>
          </div>

          <div class="anFindingsBody">
            <div class="anFindingText anReveal">
              <p>
                Model rankings broadly track general capability. Yet enabling explicit reasoning or “thinking” usually changes performance only slightly, and sometimes makes it worse.
              </p>
              <a class="anTextAction" href="${paperFallbackHref}" data-paper-link target="_blank" rel="noreferrer">Read the experiments ${arrowIcon()}</a>
            </div>

            <div class="anBenchmark anReveal" aria-label="Weighted pairwise ranking error, lower is better">
              <div class="anBenchmarkHeader"><span>Weighted pairwise ranking error</span><strong>Lower is better</strong></div>
              <div class="anBenchmarkRow"><span>GPT-5</span><i><b style="--score:46%"></b></i><strong>0.080</strong></div>
              <div class="anBenchmarkRow"><span>o3-pro</span><i><b style="--score:48%"></b></i><strong>0.083</strong></div>
              <div class="anBenchmarkRow"><span>Claude Opus 4.1</span><i><b style="--score:52%"></b></i><strong>0.090</strong></div>
              <div class="anBenchmarkRow anBenchmarkBaseline"><span>Random baseline</span><i><b style="--score:100%"></b></i><strong>0.173</strong></div>
            </div>
          </div>
        </section>

        <section class="anPublication anSection" id="publication" aria-labelledby="publication-title">
          <div class="anPublicationCopy anReveal">
            <div class="anSectionLabel"><span>06</span><strong>Publication</strong></div>
            <h2 id="publication-title">A dataset of rated conceptual arguments</h2>
            <p class="anAuthors">${authors.map((author) => `<span>${author}</span>`).join("")}</p>
            <p>The paper documents the dataset, scoring functions, model experiments, rating validation, limitations, and complete rubric.</p>
            <div class="anPublicationActions">
              <a class="anPrimaryAction" href="${paperFallbackHref}" data-paper-link target="_blank" rel="noreferrer">Open the paper ${arrowIcon()}</a>
              <a class="anLineAction" href="${paperFallbackHref}" data-paper-link data-paper-download download="LMCA_dataset.pdf">Download PDF ${downloadIcon()}</a>
            </div>
          </div>

          <div class="anCoverStage anReveal" aria-label="Publication cover">
            <div class="anCover">
              <div class="anCoverTop">${brandMark("anCoverMark")}<span>Paper 01</span></div>
              <h3>A dataset of<br>rated conceptual<br>arguments</h3>
              <div class="anCoverRule"></div>
              <p>Emery Cooper · Caspar Oesterheld<br>Linh Chi Nguyen · Alexander Kastner · Ethan Perez</p>
              <div class="anCoverBottom"><span>metaphilosophy.org</span><strong>2026</strong></div>
              <div class="anCoverBars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            </div>
          </div>
        </section>

        <section class="anWorkspaceSection anSection" aria-labelledby="workspace-title">
          <div class="anWorkspaceCopy anReveal">
            <div class="anSectionLabel anSectionLabelDark"><span>07</span><strong>Research workspace</strong></div>
            <h2 id="workspace-title">Built for careful judgment, not fast clicks.</h2>
            <p>The operational interface supports blind rating, calibration, discussion, adjudication, evaluation, release governance, and auditable exports.</p>
            <a class="anInverseAction" href="/?section=rating">Open the workspace ${arrowIcon()}</a>
          </div>

          <div class="anWorkspacePreview anReveal" aria-label="Dark research rating workspace preview">
            <div class="anPreviewCrumb">CONCEPTUAL ARGUMENTS <span>›</span> ITEM 1278</div>
            <h3>Calibration item</h3>
            <div class="anPreviewStatus"><i></i> In progress</div>
            <div class="anPreviewTabs"><span>Argument</span><span>Context</span><span>Rubric</span><span class="active">Rating</span></div>
            ${[80, 62, 94, 90, 8, 100, 72]
              .map((value, index) => {
                const labels = ["Centrality", "Strength", "Correctness", "Clarity", "Dead weight", "Single issue", "Overall"];
                return `<div class="anPreviewRating"><span>${labels[index]}</span><i><b style="--rating:${value}%"></b></i><strong>${value}</strong></div>`;
              })
              .join("")}
            <div class="anPreviewActions"><button type="button">Save draft</button><button type="button">Submit rating</button></div>
          </div>
        </section>
      </main>

      <footer class="anFooter" id="about">
        <a class="anBrand anFooterBrand" href="/">${brandMark("anBrandMark")}<span>Metaphilosophy</span></a>
        <p>Human-rated philosophical reasoning for AI.</p>
        <div><a href="#research">Research</a><a href="#dataset">Dataset</a><a href="/?section=rating">Workspace</a></div>
      </footer>
    </div>
  `;
}

export function bindPublicHomeEvents() {
  document.body.classList.add("publicHomeBody");

  const menuButton = document.querySelector(".anMenuButton");
  const navigation = document.querySelector(".anNavigation");
  if (menuButton && navigation) {
    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("isOpen");
      document.body.classList.remove("anMenuOpen");
    };

    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      navigation.classList.toggle("isOpen", !isOpen);
      document.body.classList.toggle("anMenuOpen", !isOpen);
    });

    navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  const revealItems = document.querySelectorAll(".anReveal:not(.isVisible)");
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
