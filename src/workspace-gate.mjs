const root = document.querySelector("#root");
if (!root) throw new Error("Missing #root mount point");

document.body.classList.add("publicHomeBody");

root.innerHTML = `
  <a class="mpSkip" href="#workspace-gate">Skip to workspace status</a>
  <main class="mpWorkspaceGate" id="workspace-gate">
    <article aria-labelledby="workspace-gate-title">
      <p class="mpWorkspaceEyebrow">Research workspace</p>
      <h1 id="workspace-gate-title">The research workspace is closed.</h1>
      <p>
        Metaphilosophy is not assigning research ratings yet. The protected software has passed automated synthetic tests, and the next step is a two-person synthetic usability check. The research workspace will open only after the study material, participants, terms, assignments, and final start decision are complete.
      </p>
      <p>
        There is no application, deadline, rating task, or research payment offer on this page.
      </p>
      <div class="mpWorkspaceActions">
        <a class="mpButton mpButtonPrimary" href="/research/">Read the study plan</a>
        <a class="mpButton mpButtonSecondary" href="/arguments/">Browse the synthetic library</a>
        <a class="mpButton mpButtonText" href="/">Return home</a>
      </div>
    </article>
  </main>
`;
