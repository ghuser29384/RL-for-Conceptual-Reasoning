const root = document.querySelector("#root");
if (!root) throw new Error("Missing #root mount point");

document.body.classList.add("publicHomeBody");

root.innerHTML = `
  <a class="mpSkip" href="#workspace-gate">Skip to workspace status</a>
  <main class="mpWorkspaceGate" id="workspace-gate">
    <article aria-labelledby="workspace-gate-title">
      <p class="mpWorkspaceEyebrow">Pilot readiness · workspace closed</p>
      <h1 id="workspace-gate-title">The rating workspace is gated until the pilot is ready.</h1>
      <p>
        This workspace is not publicly open. Metaphilosophy has not started production expert ratings. This route will remain closed until the methodology, protected items, qualified panel, calibration, privacy and payment procedures, controlled assignments, and final readiness record have passed their separate gates.
      </p>
      <p>
        No application, assignment, rating task, deadline, payment commitment, or expert-result claim is available here. The public protocol and the synthetic library remain available for inspection.
      </p>
      <div class="mpWorkspaceActions">
        <a class="mpButton mpButtonPrimary" href="/research/">Read the public pilot protocol</a>
        <a class="mpButton mpButtonSecondary" href="/arguments/">Browse the unrated synthetic library</a>
        <a class="mpButton mpButtonText" href="/">Return home</a>
      </div>
    </article>
  </main>
`;
