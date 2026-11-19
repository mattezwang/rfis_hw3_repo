---

description: "Task list for Same-Day Trip Changes and Cancellations (V1)"
---

# Tasks: Same-Day Trip Changes and Cancellations

**Input**: Design documents from `/specs/001-same-day-changes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/decision-module.md, quickstart.md

**Tests**: Required for the domain module by constitution Principle V (testable decision logic).
They are written before the code they test. Screens are verified in a real browser
(quickstart.md), not with component tests (research.md R-2).

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on
its own.

**Traceability rule (Principle I)**: every source file created below starts with a header
comment naming the FR, PR and assumption IDs it implements.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: the user story the task belongs to (US1 to US5)

## Path Conventions

Web app, front end only: `frontend/src/`, `frontend/tests/` (plan.md, Project Structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: project initialization

- [X] T001 Create the Vite + React + TypeScript project: `frontend/package.json` (pinned versions; scripts `dev`, `build`, `preview`, `test`), `frontend/tsconfig.json` (strict), `frontend/vite.config.ts` (`base: './'`, Vitest config) and `frontend/index.html`
- [X] T002 [P] Create `docs/v1-build-notes.md` for recording requirements issues noticed during the build, which are logged rather than silently fixed (Principle IV)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: domain types, seed, run simulation and app shell that every story uses

**⚠️ CRITICAL**: no user story work can begin until this phase is complete

- [X] T003 [P] Define entity types in `frontend/src/domain/types.ts` per data-model.md: Rider (data-model.md `Rider.mobility`, `Rider.boardingMinutes`), Vehicle (`Vehicle.seats`, `Vehicle.wheelchairPositions`), Location, Trip (`Trip.status`, `Trip.windowStart`, `Trip.attendant`), Run (`Run.stops`), Stop (`Stop.kind`, `Stop.completedAt`, `Stop.changeMark`), ChangeRequest (`ChangeRequest.kind`, `ChangeRequest.status`, `ChangeRequest.declineReason`), RouteImpact, ImpactRow, RiderPreview, ChangeRecord (`ChangeRecord.actorRole`, `ChangeRecord.event`)
- [X] T004 [P] Implement time helpers in `frontend/src/domain/time.ts`: minutes to and from HH:MM, window end = windowStart + 30 (A-14), service-day bounds
- [X] T005 [P] Implement the simulated clock in `frontend/src/domain/clock.ts`: start 14:30 plus real elapsed time, and an injectable fixed clock for tests (A-17, research.md R-5)
- [X] T006 Create the seeded service day in `frontend/src/domain/seed.ts` per data-model.md §Seed design: Janelle's two trips, runs R-12 and R-14 with stops, vehicles, riders (boarding minutes per A-18), locations and the travel-time table (A-1, PR-003)
- [X] T007 Write tests for `simulateRun` in `frontend/tests/impact.test.ts`: completed stops fixed, waiting for window start, boarding time, onboard counts including an attendant (A-13), cancelled stops skipped
- [X] T008 Implement `simulateRun` in `frontend/src/domain/impact.ts` per contracts/decision-module.md and research.md R-3, so T007 passes
- [X] T009 Implement the state container in `frontend/src/state/AppState.tsx`: React context and reducer over the domain store, mirrored to `localStorage` under a versioned key, and a reset that restores the seed and the clock (PR-002, research.md R-4)
- [X] T010 Implement the app shell in `frontend/src/main.tsx`, `frontend/src/App.tsx` and `frontend/src/styles.css`: role switcher for Rider (Janelle), Dispatcher (Frank) and Driver (PR-001), simulated clock display, Reset demo button (PR-002), visible focus styles and text colours with contrast of at least 4.5:1 (FR-009)

**Checkpoint**: the app opens, switches roles and resets. `simulateRun` is tested.

---

## Phase 3: User Story 1 - Rider changes a same-day pickup time and gets an immediate answer (Priority: P1) 🎯 MVP

**Goal**: a rider previews and submits a pickup-time change, and a change that affects no one is confirmed immediately.

**Independent Test**: quickstart V1–V4 and scenario S1 (16:30 → confirmed).

### Tests for User Story 1 ⚠️

> Write these tests first and make sure they fail before implementing.

- [X] T011 [P] [US1] Write tests in `frontend/tests/decide.test.ts`: `computeImpact` re-sequences the changed pickup and drop-off by time (A-15); `decideChange` returns `confirm` when no other pickup is outside its window and capacity holds (FR-011); a pickup already outside its window before the change is not counted; `toRiderPreview` returns only the own trip's fields (FR-004, FR-008)
- [X] T012 [P] [US1] Write scenario test S1 in `frontend/tests/scenarios.test.ts`: on the seed, Janelle's return trip to 16:30 is confirmed and the trip window becomes 16:30–17:00 (SC-004)
- [X] T013 [P] [US1] Write tests in `frontend/tests/store.test.ts` for `submitTimeChange` validation: same time, earlier than now and outside the service day are rejected with rider-readable errors (data-model.md `ChangeRequest.requestedWindowStart` validation, A-11); a trip that is not `scheduled` cannot be changed (data-model.md `Trip.status`)

### Implementation for User Story 1

- [X] T014 [US1] Implement `computeImpact` in `frontend/src/domain/impact.ts`: re-sequence with the change applied, simulate before and after, and produce ImpactRows, `othersOutsideWindow`, `capacityExceeded` and `requesterOutsideWindow` (FR-010, FR-013, FR-015, A-15)
- [X] T015 [US1] Implement `decideChange` in `frontend/src/domain/decide.ts` with the full decision table in contracts/decision-module.md (FR-011, FR-012, FR-013, FR-014)
- [X] T016 [US1] Implement `toRiderPreview` in `frontend/src/domain/projections.ts`, with fields limited to data-model.md `RiderPreview` (FR-004, FR-008)
- [X] T017 [US1] Implement `submitTimeChange` in `frontend/src/domain/store.ts`, confirm path: validate the request (data-model.md `ChangeRequest.requestedWindowStart` validation; A-11, A-12), compute impact, apply the new window, re-sequence the run, set data-model.md `Stop.changeMark` to `changed` on the requester's stops, and write `submitted` and `confirmed` ChangeRecords (data-model.md `ChangeRecord.event`, `ChangeRecord.actorRole`) with actor `system` for the decision (FR-002, FR-005, FR-020, FR-022, FR-024)
- [X] T018 [US1] Build the rider view in `frontend/src/views/rider/`: `RiderView.tsx`, `TripList.tsx` (today's trips with window and status, actions only on `scheduled` trips; FR-001), `ChangeForm.tsx` (labelled time input, preview of own new window and approval need from `toRiderPreview`; FR-002, FR-004) and `OutcomeStatus.tsx` (`aria-live` region with text status: confirmed, not accepted with reason, or pending; FR-005, FR-006, FR-009)

**Checkpoint**: US1 works on its own. S1 passes. Quickstart V1–V4 behave as described.

---

## Phase 4: User Story 2 - Changes that affect other riders go to the dispatcher (Priority: P2)

**Goal**: changes that push another pickup outside its window, exceed capacity, or cannot reach the requester go to the dispatcher, who accepts or declines with a reason after seeing the impact.

**Independent Test**: quickstart V5–V10 and scenarios S2 and S3.

### Tests for User Story 2 ⚠️

- [X] T019 [P] [US2] Write scenario tests in `frontend/tests/scenarios.test.ts`: S2 (15:45) routed with reason `other-pickup-outside-window`; S3 (15:15) routed with `capacity-exceeded`; while pending, the trip and the R-12 stops are unchanged (FR-012, FR-023, SC-003)
- [X] T020 [P] [US2] Write tests in `frontend/tests/store.test.ts`: `acceptChange` recomputes the impact against the current run (A-16) and applies the change; `declineChange` with an empty reason is rejected; a declined change leaves the trip and manifest unchanged and stores `declineReason` (data-model.md `ChangeRequest.declineReason`, FR-019); a second change while one is pending is rejected (A-12); a requester-unreachable case is routed (FR-013, A-10)

### Implementation for User Story 2

- [X] T021 [US2] Extend `submitTimeChange` in `frontend/src/domain/store.ts` with the route path: create a `pending` ChangeRequest with its decision reasons, leave the trip and stops unchanged, and write `submitted` and `routed` records (FR-007, FR-012, FR-013, A-7)
- [X] T022 [US2] Implement `acceptChange` and `declineChange` in `frontend/src/domain/store.ts` per contracts/decision-module.md: accept recomputes the impact (A-16), applies the change and sets `Stop.changeMark`. Decline requires and stores a non-empty data-model.md `ChangeRequest.declineReason`. Both write `accepted` or `declined` records (data-model.md `ChangeRecord.event`, `ChangeRecord.actorRole` = `dispatcher`) (FR-018, FR-019, FR-020, FR-022, FR-023)
- [X] T023 [US2] Build the dispatcher view in `frontend/src/views/dispatcher/`: `DispatcherView.tsx`, `PendingQueue.tsx` (ordered by requested pickup time; FR-016), `ImpactTable.tsx` (data-model.md `ImpactRow` fields: before and after times, window, outside-window flag, onboard seats and wheelchairs against capacity, mobility note; FR-017) and `DecisionPanel.tsx` (Accept, and Decline with a required reason, shown only beside the impact table; FR-018, FR-019). The impact shown is obtained by calling `computeImpact` on the current state each time a pending change is displayed (A-16). Components contain no impact or decision logic of their own (FR-015, Principle V)
- [X] T024 [US2] Extend the rider view in `frontend/src/views/rider/` to show pending with "your original pickup still stands" and to show not accepted with the dispatcher's reason, never the routing details (FR-005, FR-007, FR-008)

**Checkpoint**: US1 and US2 both work on their own.

---

## Phase 5: User Story 3 - Rider cancels a same-day trip (Priority: P3)

**Goal**: a rider cancels a trip and it is confirmed immediately, with capacity released.

**Independent Test**: quickstart V11 and scenario S4.

### Tests for User Story 3 ⚠️

- [X] T025 [P] [US3] Write tests: S4 cancel is confirmed and Janelle's wheelchair position is no longer counted on R-12 (`frontend/tests/scenarios.test.ts`); cancelling a trip with a pending change withdraws the change and records `withdrawn` (`frontend/tests/store.test.ts`; A-12, FR-014)

### Implementation for User Story 3

- [X] T026 [US3] Implement `cancelTrip` in `frontend/src/domain/store.ts`: withdraw any pending request, set the trip to `cancelled`, set data-model.md `Stop.changeMark` to `removed`, and write `withdrawn`, `cancelled` and `confirmed` records (data-model.md `ChangeRecord.event`, `ChangeRecord.actorRole`) (FR-003, FR-014, FR-020, FR-024)
- [X] T027 [US3] Add a Cancel action with a confirmation step to `frontend/src/views/rider/TripList.tsx`, and the outcome to `OutcomeStatus.tsx` (FR-003, FR-009)

**Checkpoint**: US1 to US3 work on their own.

---

## Phase 6: User Story 4 - Driver manifest reflects accepted changes only, with changes marked (Priority: P4)

**Goal**: drivers see accepted changes only, with changed and removed stops marked.

**Independent Test**: quickstart V4, V6, V8 and V11 (driver checks).

### Tests for User Story 4 ⚠️

- [X] T028 [P] [US4] Write tests in `frontend/tests/scenarios.test.ts`: after an accepted, a declined and a pending change on R-12, the manifest view contains only the accepted change; changed stops carry the change time; a cancelled trip appears as removed (FR-022, FR-023, FR-024, SC-006)

### Implementation for User Story 4

- [X] T029 [US4] Implement `toManifestView` in `frontend/src/domain/projections.ts`: stops in order with estimated times, rider name, mobility note, attendant note and change marks (FR-022, FR-024)
- [X] T030 [US4] Build the driver view in `frontend/src/views/driver/DriverView.tsx`: run selector (R-12, R-14) and manifest list with text labels "Changed HH:MM" and "Removed HH:MM" (FR-022, FR-024)

**Checkpoint**: US1 to US4 work on their own.

---

## Phase 7: User Story 5 - Dispatcher reviews the change history (Priority: P5)

**Goal**: every submission and decision is visible, with actor, role and time.

**Independent Test**: quickstart V12.

### Tests for User Story 5 ⚠️

- [X] T031 [P] [US5] Write tests in `frontend/tests/store.test.ts`: every transition writes a record with actor, role, time, from and to, and reason; automatic decisions have actor `system` (data-model.md `ChangeRecord.actorRole`, `ChangeRecord.event`; FR-020, SC-007)

### Implementation for User Story 5

- [X] T032 [US5] Build `frontend/src/views/dispatcher/ChangeHistory.tsx` (newest first) and add it to the dispatcher view (FR-021)

**Checkpoint**: all user stories work on their own.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T033 [P] Check that every file in `frontend/src/` has a traceability header naming its FR, PR and assumption IDs (Principle I)
- [X] T034 Accessibility pass on the rider screens: keyboard-only walkthrough, labels, live region announcements, contrast, and no status shown by colour alone (FR-009, SC-008)
- [X] T035 Run `npm test` and `npm run build`, and confirm the build loads from `frontend/dist` through a static server with relative paths (research.md R-7)
- [X] T036 Walk through quickstart V1–V14 in a real browser. Fix crashes and clear contradictions of the spec. Record requirements-level observations in `docs/v1-build-notes.md` without changing behaviour (Principle IV)
- [X] T037 Write `README.md` at the repository root: what the prototype is, how to run it, links to the spec and goal model, placeholders for the five deliverable links, and Roles and Responsibilities

---

## Phase 9: V2 revisions from the V1 evaluation

**Purpose**: implement the V2 spec changes (spec.md Revision History). Tests are written before the code, as in V1. Spec, goal model and plan were revised first (Principle IV).

**Independent Test**: quickstart V15–V22.

### Tests for V2 ⚠️

- [ ] T038 [P] Write tests in `frontend/tests/suggest.test.ts`: for S2 (15:45) `suggestTimes` returns 1–3 times nearest first, each confirmed when submitted (SC-010); a rider-unreachable request gets suggestions; no suggestion is earlier than now; no suggestion contains other riders' data (FR-026, A-19, FR-008)
- [ ] T039 [P] Write tests in `frontend/tests/decide.test.ts`: `toRiderPreview` includes `estimatedArrival` equal to the requester's drop-off estimate and `ownWindowUnreachable` for the 15:30 case (data-model.md `RiderPreview.estimatedArrival`, `RiderPreview.ownWindowUnreachable`; FR-025, FR-027)
- [ ] T040 [P] Write tests for `affectedSummary`: S2 names Grace as pushed outside her window; S3 includes an over-capacity item (FR-028)

### Implementation for V2

- [ ] T041 Extend `toRiderPreview` and `riderTrips` in `frontend/src/domain/projections.ts` with data-model.md `RiderPreview.estimatedArrival`, `RiderPreview.ownWindowUnreachable`, and RiderTripView `estimatedArrival` and `suggestions` (FR-025, FR-026, FR-027)
- [ ] T042 Implement `suggestTimes` and `affectedSummary` in `frontend/src/domain/suggest.ts` per contracts/decision-module.md (FR-026, FR-028, A-19)
- [ ] T043 Update the rider view: the preview shows arrival time, the unreachable-window message and suggested times as buttons that load their preview; the confirmation shows arrival; trip cards show arrival; a declined trip shows suggestions (`frontend/src/views/rider/ChangeForm.tsx`, `TripList.tsx`; FR-025–FR-027, FR-009)
- [ ] T044 Add the affected-rider summary above the impact table in `frontend/src/views/dispatcher/ImpactTable.tsx` (FR-028)
- [ ] T045 Fix simulated time at 14:30 (A-17 revised) and give V2 its own storage key (O-11) in `frontend/src/state/AppState.tsx`; update the header text in `frontend/src/App.tsx` and the title in `frontend/index.html` to V2
- [ ] T046 Run `npm test` and `npm run build`. Walk through quickstart V1–V22 in a real browser. Record the results in `docs/evaluation-v2.md`
- [ ] T047 Update `docs/traceability.md` with the V2 requirements and changed statuses, and `README.md` with the V2 links and what changed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: depends on Setup. Blocks all stories
- **US1 (Phase 3)**: depends on Foundational. Provides `computeImpact`, `decideChange` and the rider view that later stories extend
- **US2 (Phase 4)**: depends on US1's `computeImpact`, `decideChange` and `submitTimeChange`
- **US3 (Phase 5)**: depends on Foundational and `computeImpact` (US1). Independent of US2
- **US4 (Phase 6)**: depends on Foundational. Its tests use US1–US3 transitions to produce changes
- **US5 (Phase 7)**: depends on the transitions from US1–US3
- **Polish (Phase 8)**: depends on all stories
- **V2 (Phase 9)**: depends on V1 being frozen (tag `v1.0`) and on the revised spec

### Within Each User Story

Tests → domain functions → store transitions → views.

### Parallel Opportunities

- T003, T004 and T005 (different files)
- In each story, the test tasks marked [P]
- US3 and US4 domain work can run alongside US2 once US1 is done

## Parallel Example: User Story 1

```text
T011 decide.test.ts   |  T012 scenarios.test.ts (S1)  |  T013 store.test.ts (validation)
then T014 → T015 → T016 → T017 → T018
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phases 1 and 2
2. Phase 3 (US1)
3. Stop and validate quickstart V1–V4. This is the rider's immediate-answer path

### Incremental Delivery

US2 adds the dispatcher half of the C-1 compromise, US3 cancellation, US4 the driver's view, and
US5 the history. Each is committed as its own phase. V1 is frozen (tag and branch `v1`) only
after Phase 8.
