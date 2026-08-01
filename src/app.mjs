const root = document.querySelector("#root");

if (!root) throw new Error("Missing #root mount point");

root.innerHTML = `
  <main class="mpWorkspaceGate" id="main-content">
    <article>
      <p class="mpWorkspaceEyebrow">Research workspace · not publicly open</p>
      <h1>The rating workspace is gated until the pilot is ready.</h1>
      <p>
        Metaphilosophy has not started production expert ratings. The public workspace will open only after the methodology, protected items, qualified panel, payment and privacy process, blind assignment, and final readiness record have all been approved.
      </p>
      <div class="mpWorkspaceActions">
        <a class="mpButton mpButtonPrimary" href="/research/">Read the pilot protocol</a>
        <a class="mpButton mpButtonText" href="/arguments/">Explore the unrated synthetic library</a>
        <a class="mpButton mpButtonText" href="/">Return home</a>
      </div>
    </article>
  </main>
`;
