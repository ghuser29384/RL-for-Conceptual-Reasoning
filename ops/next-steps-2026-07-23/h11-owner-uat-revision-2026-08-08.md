# H-11 owner-UAT revision — 2026-08-08

**Decision owner:** Ellen Sun  
**Decision:** External experts are not required for the pre-pilot product-usability test. Ellen Sun may perform the product acceptance test herself.  
**Research-use state:** `research_ratings_authorized=false`

## Corrected distinction

The prior H-11 plan conflated two different questions:

1. **Does the product work and feel usable?** This can be tested by the project owner through a structured synthetic user-acceptance test.
2. **Do qualified philosophy raters produce valid expert labels under the rubric?** This still requires qualified external raters during Pilot 01 and cannot be established by owner QA.

Accordingly, the separate paid external-expert usability tranche is no longer a prerequisite for H-12.

## Revised H-11 gate

H-11 is satisfied for product readiness when Ellen Sun completes the controlled synthetic owner-UAT below and no unresolved P0 or P1 defect remains.

Required owner-UAT coverage:

- fresh protected-browser entry on the exact accepted preview release;
- pseudonymous synthetic owner-test identity;
- single-use invitation redemption;
- synthetic-session consent;
- one position with four sibling critiques;
- complete LMCA-derived rubric entry;
- autosave feedback;
- browser close and resume;
- final submission and locked state;
- one correction or withdrawal path;
- synthetic debrief and rubric-comprehension questions;
- operator-side evidence review;
- private/public export separation;
- desktop and narrow-mobile rendering;
- confirmation that no operator identity, other participant identity, invitation token, or protected/real research item is exposed;
- confirmation that `research_ratings_authorized=false` throughout.

## Pass standard

H-11 owner-UAT passes only if:

- every required path above is completed;
- no data loss or unexplained state transition occurs;
- no unresolved P0 or P1 defect remains;
- the owner can accurately explain centrality, strength, `strength × centrality`, low-clarity treatment, and why initial ratings remain immutable;
- the complete evidence record identifies the exact release, deployment, browser/device context, timestamps, and observed defects; and
- no real research rating, payment, participant invitation, or public claim is created.

## First-rater canary safeguard

Because owner testing cannot reproduce the perspective of an unfamiliar target user, the first actual qualified rater must complete a synthetic calibration bundle before seeing any research item. The calibration is part of ordinary rater onboarding, not a separate external QA engagement.

The first-rater canary must confirm:

- rubric comprehension;
- autosave, resume, lock, correction, and support-path clarity;
- absence of hidden metadata or non-synthetic material; and
- no unresolved P0/P1 defect.

Only after that calibration passes may the first rater receive Pilot 01 research assignments.

## External-expert boundary

External experts remain necessary for:

- actual expert ratings;
- inter-rater agreement and disagreement evidence;
- adjudication where triggered; and
- bounded methodological advice.

They are no longer required merely to prove that the product interface functions.

The two already-sent institutional forwarding inquiries are not automatically followed up. No response, cancellation, repurposing, or additional outreach is authorized without a separate owner decision.

## Authorization boundary

This revision does not authorize:

- participant access;
- additional outreach;
- payment or honorarium commitment;
- research ratings;
- production deployment;
- H-11 passage before the owner-UAT is completed;
- H-12 sign-off;
- merger of the broader programme PR.

## Immediate next action

Prepare one synthetic owner-test identity, one exact four-critique assignment, and one single-use invitation on the protected preview. Then Ellen Sun completes the owner-UAT on desktop and narrow mobile under the protocol above. No research item or external participant is involved.
