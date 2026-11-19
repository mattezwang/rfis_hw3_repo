# Paratransit Same-Day Changes Constitution

## Core Principles

### I. Stakeholder Traceability (NON-NEGOTIABLE)

- Every functional requirement MUST cite the goal ID(s) it satisfies from
  `docs/models/goal_model_sprint.py` (Assignment 2 IDs, `G-n`).
- Every requirement MUST either quote its interview evidence (stakeholder, timestamp) from
  `docs/interviews/` or be labelled **Inferred**, with the goal-model reasoning that produced it.
- Every code module or component that implements a requirement MUST name the requirement IDs
  it implements in a header comment, so the traceability matrix can be checked against the code.
- No requirement, threshold or behaviour may be invented in the spec or code without being
  labelled Inferred and recorded as an assumption.

Rationale: the assignment is graded on traceability from transcript to goal to requirement to
code. An unlabelled invention looks the same as a stakeholder need and cannot be validated.

### II. Sprint Boundary

- The prototype MUST implement only the goals inside the sprint boundary defined in
  `docs/goal-model.md` §1.3, as amended in §2.7.
- Deferred goals (§1.4) MUST NOT be implemented. When an in-scope goal depends on a deferred one
  (booked trips, built runs, matched vehicles, issued manifests), the dependency MUST be
  satisfied with seeded mock data, not new features.
- Any scope addition MUST first be made in the goal model and spec, with a reason.

Rationale: a prototype that drifts beyond the boundary can no longer be evaluated against the
selected requirements.

### III. Preserve Conflicts and Decisions

- Every conflict, overlap or open question recorded in `docs/goal-model.md` §2.2–2.6 that
  affects behaviour MUST appear in the spec with its decision type: compromise, prioritized,
  combined, separate, or unresolved.
- Code MUST implement the documented decision and nothing stricter or looser. Unresolved
  conflicts (for example C-7) MUST NOT be quietly resolved in code.
- Removing a conflicting goal or requirement is prohibited. The relationship and reasoning are
  kept.

Rationale: the decisions are human judgments that the evaluation in Step 4 must be able to test.

### IV. Specification Before Implementation

- Behaviour changes MUST be made in `spec.md` first, then propagated to `plan.md` and
  `tasks.md`, and only then to code.
- Each released version MUST be frozen as a git tag and branch (`v1`, `v2`) that contains the
  goal model, spec, Spec Kit artifacts and source code of that version together.
- Problems found while building V1 that are requirements issues MUST be recorded for evaluation
  rather than silently fixed in code.

Rationale: V1 and V2 are compared in the assignment, so each must reflect its own specification.

### V. Testable Decision Logic

- The route-impact calculation and the accept-or-route decision MUST live in a pure,
  framework-free module with unit tests. Each acceptance scenario that involves a decision
  MUST have a test.
- User interface components MUST display the module's results and MUST NOT recompute impact
  themselves. The rider view, the dispatcher view and the automatic decision all use one
  calculation.
- Time MUST come from an injectable clock fixed to the simulated service day, so every scenario
  is reproducible regardless of when the prototype is opened.

Rationale: the decision rule (G-125 to G-127) is the most uncertain requirement in the sprint.
It has to be checkable independently of the screens.

### VI. Accessible and Private by Default

- Rider-facing screens MUST meet the WCAG 2.1 AA basics the prototype can demonstrate: every
  task operable by keyboard, labelled form controls, visible focus, status changes announced
  through a live region, text contrast of at least 4.5:1, and no information conveyed by colour
  alone.
- The rider view MUST NOT expose any other rider's name, pickup time, address or mobility
  details (G-129, G-130).

Rationale: the primary rider stakeholder uses a wheelchair and asked for a system she can use
independently. Privacy is a stated conflict resolution (C-2).

## Prototype Constraints

- A static single-page application in `frontend/`, built with Vite, React and TypeScript. There
  is no backend, database or authentication. Roles are switched in the interface.
- All data is mock data seeded for one simulated service day. State lives in memory, may be
  persisted to browser storage for convenience, and MUST be resettable to the seed from the
  interface.
- The build MUST work from a relative base path, so the same output can be deployed to any
  static host or subpath.
- Dependencies are kept minimal. Each runtime dependency beyond React needs a stated reason
  in the plan.

## Development Workflow and Quality Gates

- Spec Kit order: constitution → specify → clarify → plan → tasks → analyze → implement. Each
  stage is committed separately.
- Before a version is frozen: unit tests pass, the production build succeeds, and every
  acceptance scenario has been exercised once in a real browser.
- Commits are made locally. Pushing to the remote requires the repository owner's approval.

## Governance

This constitution governs the spec, plan, tasks and code in this repository. Where another
document conflicts with it, the constitution wins until amended.

- Amendments are made by editing this file, with a version bump and a dated note in the commit
  message explaining why.
- Versioning: MAJOR for removing or redefining a principle, MINOR for adding a principle or
  section or materially expanding one, PATCH for wording.
- `/speckit-analyze` and the human reviewer check every plan and task list against these
  principles before implementation starts.

**Version**: 1.0.0 | **Ratified**: 2026-11-18 | **Last Amended**: 2026-11-18
