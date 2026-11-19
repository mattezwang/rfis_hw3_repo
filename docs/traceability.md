# Requirements Traceability Matrix (Prototype V1)

Step 4 of Assignment 3. It traces each requirement in the V1 specification to its interview
evidence, its goal in the goal model, and the code that implements it, and records whether
Prototype V1 satisfies it.

- **Requirement**: requirement IDs in [specs/001-same-day-changes/spec.md](../specs/001-same-day-changes/spec.md) (V1, tag `v1.0`)
- **Interview evidence**: transcripts from Assignment 1 in [docs/interviews/](interviews/), cited as *Stakeholder HH:MM:SS*. "Inferred" means no interview states it; the goal model records the reasoning.
- **Goal model reference**: goal IDs from Assignment 2, as used in [docs/models/goal_model_sprint.py](models/goal_model_sprint.py)
- **Code / implementation**: paths under `frontend/src/`, with the function or component name
- **Verified by**: unit and scenario tests in `frontend/tests/`, and the quickstart walkthrough (V1–V14) run against the deployed V1 at <https://mattezwang.github.io/rfis_hw3_repo/v1/>
- **Observation**: findings from the evaluation, detailed in [evaluation-v1.md](evaluation-v1.md)

Evaluated 2026-11-18 on the deployed V1.

## Functional requirements

| Requirement | Interview evidence | Goal model reference | Code / implementation | Verified by | Status |
|---|---|---|---|---|---|
| **FR-001** Show the rider today's trips with pickup window, status and any pending change | Janelle 00:38:44 "I want to book and change rides online" | G-9 | `domain/projections.ts` › `riderTrips`; `views/rider/TripList.tsx` | V1 walkthrough; `store.test.ts` | Fully satisfied |
| **FR-002** Request a new pickup time for a same-day trip not yet picked up | Janelle 00:32:01 "I needed to change my pickup that same day" | G-12 | `domain/store.ts` › `submitTimeChange`, `validateTimeChange`; `views/rider/ChangeForm.tsx` | V2–V3, V14; `store.test.ts` (validation) | Fully satisfied |
| **FR-003** Cancel a same-day trip, with a confirmation step | Janelle 00:32:01 "update or cancel the ride online" | G-13 | `domain/store.ts` › `cancelTrip`; `TripList.tsx` (Cancel, "Yes, cancel trip") | V11; `scenarios.test.ts` S4 | Fully satisfied |
| **FR-004** Before submitting, show the rider's own new window and whether approval is needed | Frank 00:50:52 "The rider should see what they're changing" | G-79, G-130 | `domain/store.ts` › `previewTimeChange`; `domain/projections.ts` › `toRiderPreview`; `ChangeForm.tsx` (review step) | V2, V5; `decide.test.ts` | Fully satisfied as written. Goal only partly met: O-2, O-3, O-4 |
| **FR-005** Show one of three outcomes: confirmed, not accepted with reason, or pending | Janelle 00:32:01 "see whether the change is accepted, and get an immediate confirmation instead of guessing what happened" | G-14, G-17, G-18, G-128 | `ChangeForm.tsx` › `submit`; `views/rider/OutcomeStatus.tsx`; `TripList.tsx` › `StatusNote` | V3, V5, V10 | Fully satisfied |
| **FR-006** Outcome or pending status within one minute | Inferred reading of "immediate" (Janelle 00:32:01) | G-19 | Synchronous decision in `store.ts` › `submitTimeChange`, shown by `OutcomeStatus.tsx` | V3, V5: shown on submit | Fully satisfied |
| **FR-007** While pending, the original pickup stands, and the status updates on decision | Inferred (C-1) | G-128, G-14 | `store.ts` › `submitTimeChange` (route path leaves the trip unchanged); `TripList.tsx` › `StatusNote` | V5, V8, V10; `scenarios.test.ts` S2 | Fully satisfied as written. Goal concern: O-7 |
| **FR-008** No other rider's data in the rider's view | Inferred (C-2) | G-129, G-130 | `projections.ts` › `toRiderPreview` (only own fields), `riderTrips` | V2, V5; `decide.test.ts` (preview has no other rider) | Fully satisfied |
| **FR-009** Rider tasks by keyboard, labelled controls, announced status, contrast at least 4.5:1, no colour-only status | Janelle 00:36:15 "accessible enough that I can use it independently" | G-36, G-37 | `OutcomeStatus.tsx` (`aria-live`); `ChangeForm.tsx` (labels, `aria-describedby`, focus); `TripList.tsx` (focus return); `styles.css` | V13 keyboard walkthrough; contrast check (lowest 6.29:1) | Fully satisfied (after D-1 was fixed during the build) |
| **FR-010** Calculate impact on every stop: new times, windows, onboard capacity | Frank 00:47:38 "show me every rider and window that gets hit"; Frank 00:48:57 | G-125, G-75 | `domain/impact.ts` › `simulateRun`, `computeImpact` | `impact.test.ts`, `decide.test.ts` | Fully satisfied |
| **FR-011** Confirm automatically when no other pickup is pushed outside its window and capacity holds | Inferred (C-1 compromise) | G-126 | `domain/decide.ts` › `decideChange` | S1; `decide.test.ts`, `scenarios.test.ts` | Fully satisfied. Validation pending: O-8 (Q-1, Q-3) |
| **FR-012** Route to the dispatcher when another pickup is pushed outside its window or capacity is exceeded | Frank 00:50:52 "one person's convenience can put six other pickups outside their window" | G-127, G-73 | `decide.ts` › `decideChange`; `store.ts` › `submitTimeChange` (route path) | S2, S3; `scenarios.test.ts` | Fully satisfied |
| **FR-013** Route when the van cannot reach the requester within the new window | Inferred (A-10) | G-125 | `impact.ts` › `computeImpact` (`requesterOutsideWindow`); `decideChange` | 15:30 request on live V1; `decide.test.ts` | Fully satisfied. Rider message: O-3 |
| **FR-014** Cancellation always confirmed, and capacity released | Inferred (A-4) | G-126, G-53 | `decide.ts` (cancel → confirm); `store.ts` › `cancelTrip`; `impact.ts` › `simulateRun` (skips cancelled) | S4; `scenarios.test.ts` | Fully satisfied |
| **FR-015** One impact calculation for preview, decision and dispatcher view | Inferred (OV-2) | G-75, G-125, G-130 | `impact.ts` › `computeImpact`, called from `previewTimeChange`, `submitTimeChange`, `currentImpact` | Code inspection; the views contain no impact logic | Fully satisfied |
| **FR-016** Queue of pending changes ordered by requested time | Frank 00:50:52 | G-73, G-127 | `store.ts` › `pendingQueue`; `views/dispatcher/PendingQueue.tsx` | V7; `store.test.ts` | Fully satisfied |
| **FR-017** One screen: every affected rider and stop, before and after, outside-window flags, capacity, mobility needs | Frank 00:47:38 "show me every rider and window that gets hit before I accept the change"; Frank 00:49:55 "with capacity, mobility needs, and pickup windows all visible together" | G-72, G-75, G-76 | `store.ts` › `currentImpact`; `views/dispatcher/ImpactTable.tsx` | V7, V9 | Fully satisfied. Goal G-72 partial (G-132 deferred). Usability: O-9 |
| **FR-018** Accept only from the impact screen, which applies the change | Frank 00:47:38 "before I accept the change" | G-74, G-72 | `store.ts` › `acceptChange`; `views/dispatcher/DecisionPanel.tsx` | V8; `store.test.ts` | Fully satisfied |
| **FR-019** Decline only with a reason, shown to the rider | Inferred (DP-2) | G-146, G-18 | `store.ts` › `declineChange`; `DecisionPanel.tsx`; `TripList.tsx` › `StatusNote` | V10; `store.test.ts` | Fully satisfied |
| **FR-020** Record every submission, decision, withdrawal and cancellation, with actor, role, time and reason | Frank 00:47:38 "keep a clear record of who made it and when"; Frank 00:49:55 | G-77 | `store.ts` › `record` (called by every transition) | `store.test.ts` (history); live V1 edge case E1 | Fully satisfied |
| **FR-021** Dispatcher views the full history, newest first | Frank 00:49:55 "we need to know exactly what was changed and when" | G-77 | `views/dispatcher/ChangeHistory.tsx` | V8, V12 | Fully satisfied |
| **FR-022** Accepted change updates the manifest in the same step as the rider's confirmation | Frank 00:49:55 "push updated manifests and notes straight to the driver" | G-64, G-145, G-17 | `store.ts` › `applyChange`; `projections.ts` › `toManifestView`; `views/driver/DriverView.tsx` | V4, V8; `scenarios.test.ts` | Fully satisfied |
| **FR-023** Pending or declined changes never alter the manifest | Inferred (H10) | G-67 | `store.ts` (route and decline paths leave stops unchanged); `toManifestView` | V6, V10; `scenarios.test.ts` | Fully satisfied |
| **FR-024** Each changed stop marked with the time of change; cancelled stops shown as removed | Frank 00:48:57 "Drivers get frustrated when the lift schedule and passenger notes change mid-run" | G-149, G-148 | `store.ts` › `applyChange` (`changeMark` on the requester's stops); `DriverView.tsx` | V4, V11; `scenarios.test.ts` | **Partially satisfied.** Only the requester's stops are marked. Other riders' stops that moved (Omar +18 min, Grace +11 min and late) are not marked or flagged: O-5 |

## Prototype requirements

| Requirement | Interview evidence | Goal model reference | Code / implementation | Verified by | Status |
|---|---|---|---|---|---|
| **PR-001** Switch between rider, dispatcher and driver views | n/a (prototype support) | n/a | `App.tsx` (role buttons) | All walkthroughs | Fully satisfied |
| **PR-002** Reset to the seeded day | n/a | n/a | `state/AppState.tsx` › `reset`; `App.tsx` (Reset demo) | Walkthrough | Fully satisfied. Clock behaviour: O-10 |
| **PR-003** Seed demonstrates each kind of change | n/a | A-1 (deferred goals replaced by mock data) | `domain/seed.ts` › `createSeed` | `scenarios.test.ts` (baseline, S1–S4) | Fully satisfied |

## Stakeholder goals: satisfaction after evaluating V1

A requirement can be fully satisfied while the goal behind it is only partly met. When that
happens, it points to a requirements issue rather than an implementation defect.

| Goal | Stakeholder | Satisfaction in V1 | Why |
|---|---|---|---|
| G-12, G-13 change or cancel online | Janelle | Satisfied | FR-002, FR-003 |
| G-14 immediate outcome | Janelle | **Partial** | Immediate only when no one else is affected. Otherwise "pending", with no time limit (O-7). This is by design under C-1 and still unvalidated |
| G-79 see the effect before submitting | Frank | **Partial** | The rider sees only "needs approval": not why, not what would work (O-4), and an estimate outside her own window is unexplained (O-3) |
| G-129, G-130 privacy | (inferred) | Satisfied | FR-008 |
| G-36, G-37 independent, accessible use | Janelle | **Partial** | Keyboard, labels and contrast are verified. Independent use by the rider (SC-001) cannot be verified without real users (O-13) |
| G-125–G-127 decide by route impact | (inferred, C-1) | Satisfied as specified | The rule is unvalidated with Frank and Janelle (O-8, Q-1, Q-3) |
| G-73, G-74, G-146 dispatcher control | Frank | Satisfied | FR-016–FR-019 |
| G-72, G-75, G-76 whole route impact | Frank | **Partial** | All information is shown, but the stops that matter are not distinguished from the rest (O-9). Cost effect G-132 is deferred |
| G-77 change history | Frank | Satisfied | FR-020, FR-021 |
| G-64, G-145, G-67 manifest reflects accepted changes | Frank | Satisfied | FR-022, FR-023 |
| G-148, G-149 minimize driver disruption | Frank | **Partial** | Other riders' moved stops and late pickups are not marked (O-5) |
| G-53 capacity released on cancel | (inferred) | Satisfied | FR-014 |
| **G-2** rider home before the attendant's evening visit | Janelle (top priority) | **Not satisfied** | Sub-goals G-6 and G-8 were deferred in Step 1. The prototype never shows Janelle when she will get home (O-2) |
| G-26 rider not left without information | Janelle (outside the sprint) | **Harmed** | An accepted change can make Grace late with no one telling her (O-6) |
| G-3 fewer avoidable calls | All three | Not measurable | Needs real use. V1 removes the call for every change that affects no one |

## Success criteria

| Criterion | Result |
|---|---|
| SC-001 change to outcome in under 2 minutes, without help | **Not verified.** It needs real riders. A walkthrough takes 4 actions (Change → time → Review → Submit) |
| SC-002 outcome within 1 minute | Met (immediate) |
| SC-003 no change affecting others applied without the dispatcher | Met (S2, S3, scenario tests) |
| SC-004 every change affecting no one confirmed without the dispatcher | Met (S1, S4) |
| SC-005 no other rider's data in the rider view | Met (`decide.test.ts`, walkthrough) |
| SC-006 manifest matches accepted changes only | Met. See O-5 for what the manifest does not show |
| SC-007 every event in the history, with actor and time | Met (`store.test.ts`, E1) |
| SC-008 every rider task by keyboard | Met (V13) |

## How traceability was checked

- **Transcript → spec and goal model**: a script compared every quoted stakeholder statement
  in `spec.md` and `goal-model.md` against the transcript CSVs. All 22 quotes appear word for
  word, at the cited speaker and timestamp.
- **Goal → requirement**: every goal in the sprint boundary maps to at least one requirement
  (spec, Selected Stakeholder Goals), and every requirement cites at least one goal.
- **Requirement → code**: every file in `frontend/src/` names the requirements it implements
  in its header comment, and every function and component named above exists. The decision
  logic is covered by 34 tests.
- **Requirement → behaviour**: each requirement was exercised on the deployed V1
  (quickstart V1–V14 plus edge cases E1–E5 in the evaluation).
