# Implementation Plan: Same-Day Trip Changes and Cancellations

**Branch**: `001-same-day-changes` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-same-day-changes/spec.md`

## Summary

Riders change or cancel a same-day trip online. Each change is decided by its route impact
(FR-010 to FR-015). Changes that affect no one are confirmed immediately. Changes that push
another pickup outside its window, exceed vehicle capacity, or cannot reach the requesting
rider in time go to the dispatcher, who reviews the full impact and accepts or declines with
a reason (FR-016 to FR-019). The driver's manifest reflects accepted changes only, with changed
stops marked (FR-022 to FR-024), and every event is recorded (FR-020, FR-021).

Technical approach: a static single-page app with three switchable views (rider, dispatcher,
driver) over one in-browser state store, seeded with one mock service day. All impact and
decision logic lives in a pure TypeScript module (`frontend/src/domain/`) with unit and scenario
tests. The views only display its results (constitution, Principle V).

### V2 revision

V2 (from [docs/evaluation-v1.md](../../docs/evaluation-v1.md)) adds four requirements without changing the architecture:
- FR-025 (rider's arrival time) and FR-027 (unreachable window) are new fields on the rider projection, taken from the same `computeImpact` result.
- FR-026 (suggested times) is a new pure function, `suggestTimes`, which runs `computeImpact` over candidate times (A-19) and keeps those that would confirm.
- FR-028 (affected-rider summary) is a new pure function, `affectedSummary`, over `RouteImpact`.

Two implementation changes come with them: time is fixed at 14:30 (A-17 revised), and V2 uses its own browser storage key, because `/v1/` and `/v2/` share an origin on GitHub Pages (O-11).

## Technical Context

**Language/Version**: TypeScript (strict mode)

**Primary Dependencies**: React and React DOM for the views. Vite for the dev server and build.
No other runtime dependencies (see research.md R-2).

**Storage**: In-memory state, mirrored to the browser's `localStorage` so a reload keeps the
demo state. A reset control restores the seed (PR-002).

**Testing**: Vitest for the domain module (impact, decision, state transitions, seeded
scenarios). End-to-end acceptance scenarios are exercised manually in a browser, following
quickstart.md.

**Target Platform**: Current desktop browsers (Chrome, Firefox, Safari, Edge). Usable at phone
width.

**Project Type**: Front-end web application (static SPA, no backend)

**Performance Goals**: Impact calculation and decision complete within 100 ms for a run of up
to 30 stops, far inside the one-minute requirement (FR-006, SC-002).

**Constraints**: V2's browser storage key must differ from V1's (O-11). No network calls at runtime. The build must use a relative base path (`./`) so
it can be served from any static host or subpath. Time comes from an injectable simulated clock
(A-17).

**Scale/Scope**: One service day, one rider persona with two trips, about 8 other riders, a
completed morning run and 2 afternoon runs, 10–20 stops per run, three views.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Pre-design | Post-design |
|---|---|---|---|
| I. Stakeholder Traceability | Every FR traces to goals and evidence. Every module names its FR IDs in a header comment. | Pass: spec FRs carry goal IDs and evidence. | Pass: data-model.md and contracts map entities and functions to FR IDs, and tasks will require header comments. |
| II. Sprint Boundary | Only in-scope goals. Deferred dependencies are mock data. | Pass: booking, run building, vehicle matching and manifests issued are seeded (A-1). | Pass: no booking, tracking, notification or reporting module in the structure. |
| III. Preserve Conflicts and Decisions | The code implements documented decisions only. Unresolved C-7 is not resolved in code. | Pass | Pass: there is no change limit in the design, and the window-based test (A-3) is the only "affected" rule. |
| IV. Specification Before Implementation | Behaviour flows spec → plan → tasks → code. | Pass | Pass: requirements issues found during the build are logged in `docs/v1-build-notes.md`, not silently fixed. |
| V. Testable Decision Logic | Pure decision module, unit tests per decision scenario, one calculation for all views, injectable clock | Pass | Pass: the `computeImpact` and `decideChange` contracts (contracts/decision-module.md) are used by all three views. |
| VI. Accessible and Private by Default | WCAG basics on rider screens; no other-rider data in the rider view | Pass | Pass: the rider view receives a `RiderPreview` projection that has no fields about other riders (data-model.md). V2: suggestions are times only, and the arrival time is the rider's own. |
| V2 re-check | All principles, for FR-025 to FR-028 | Pass | Pass: the new logic is pure and in `domain/` with tests (V). Suggestions and the summary reuse `computeImpact` (FR-015). Spec revised before code (IV). O-5 to O-8 are not resolved in code (III). |

No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-same-day-changes/
├── plan.md              # This file
├── research.md          # Phase 0: decisions and alternatives
├── data-model.md        # Phase 1: entities, state transitions, seed design
├── quickstart.md        # Phase 1: run and validation guide
├── contracts/
│   └── decision-module.md   # Interface of the impact and decision module
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx                  # Role switcher, simulated clock, reset (PR-001, PR-002)
    ├── styles.css
    ├── domain/                  # Pure logic, no React (Principle V)
    │   ├── types.ts             # Entities (data-model.md)
    │   ├── time.ts              # Minutes-of-day helpers and formatting
    │   ├── clock.ts             # Simulated clock (A-17)
    │   ├── impact.ts            # computeImpact: FR-010, FR-013, FR-015, A-15, A-16
    │   ├── decide.ts            # decideChange: FR-011, FR-012, FR-013, FR-014
    │   ├── store.ts             # State transitions and change history: FR-005, FR-007, FR-014,
    │   │                        #   FR-019, FR-020, FR-022, FR-023, FR-024, A-12
    │   ├── projections.ts       # RiderPreview, ManifestView: FR-004, FR-008, FR-024, FR-025, FR-027
    │   ├── suggest.ts           # V2: suggestTimes (FR-026, A-19), affectedSummary (FR-028)
    │   └── seed.ts              # Mock service day: A-1, A-18, PR-003
    ├── state/
    │   └── AppState.tsx         # React context and reducer over store.ts, localStorage
    └── views/
        ├── rider/               # FR-001 to FR-009
        ├── dispatcher/          # FR-016 to FR-021
        └── driver/              # FR-022 to FR-024
frontend/tests/
    ├── impact.test.ts
    ├── decide.test.ts
    ├── store.test.ts
    └── scenarios.test.ts        # Seeded acceptance scenarios: SC-003, SC-004, SC-006, SC-007
```

**Structure Decision**: a single front-end project in `frontend/`, matching the assignment's
recommended repository layout. The `domain/` folder holds all decision logic with no framework
imports, so it can be tested without a browser and reused unchanged by every view.

## Complexity Tracking

None.
