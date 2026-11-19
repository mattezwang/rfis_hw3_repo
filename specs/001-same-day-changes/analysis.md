# Specification Analysis Report (/speckit-analyze)

**Date**: 2026-11-18 · **Artifacts**: spec.md, plan.md, tasks.md, data-model.md,
contracts/decision-module.md, constitution v1.0.0

`/speckit-analyze` is read-only. The remediation listed at the end was approved as part of the
Step 3 plan ("fix anything it finds before writing code") and was applied in the same commit
as this report.

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| D1 | Constitution (Principle V) | HIGH | tasks.md T023; spec FR-015, FR-017 | The dispatcher view task does not say it must take the impact from `computeImpact` on the *current* run (A-16) and must not recompute in the view. Principle V requires one calculation for every view. | Amend T023 to require `computeImpact` against current state at render time, with no impact logic in components. |
| E1 | Coverage (constrained field) | HIGH | tasks.md T022; data-model.md `ChangeRequest.declineReason` | The task implementing decline does not cite `ChangeRequest.declineReason`. Only test task T020 does. | Cite data-model.md `ChangeRequest.declineReason` in T022. |
| E2 | Coverage (constrained field) | HIGH | tasks.md T017; data-model.md `ChangeRequest.requestedWindowStart` validation | The implementing task for validation cites assumptions only. The field citation appears only in test task T013. | Cite data-model.md `ChangeRequest.requestedWindowStart` in T017. |
| E3 | Coverage (constrained field) | HIGH | tasks.md T017, T022, T026; data-model.md `ChangeRecord.actorRole`, `ChangeRecord.event` | The tasks that write history records do not cite the record fields. Only test task T031 does. T022 does not mention writing records at all, although FR-020 covers dispatcher decisions. | Cite both fields in T017, T022 and T026, and add "write `accepted` / `declined` records" to T022. |
| F1 | Inconsistency | MEDIUM | spec.md FR-001; data-model.md `Trip.status` | FR-001 lists "change pending" as a trip status, but in the data model pending is a ChangeRequest status, not a Trip status. | Reword FR-001: trip status plus whether a change is pending. |
| F2 | Inconsistency | MEDIUM | data-model.md §Seed design; `Trip.runId` | Janelle's completed morning trip has no run. The seed lists only afternoon runs R-12 and R-14, but every trip needs a `runId`. | Add a completed morning run R-3 to the seed design. |
| F3 | Inconsistency | MEDIUM | contracts/decision-module.md `decideChange`; data-model.md RouteImpact | `decideChange(impact)` branches on "request is a cancellation", but RouteImpact has no field saying what kind of request it is. | Add `requestKind` to RouteImpact. |
| F4 | Inconsistency | LOW | plan.md Scale/Scope | "about 20 stops per run" overstates the seed, which has about 10–16 stops on R-12. | Change to "10–20 stops per run". |
| C1 | Underspecification | LOW | spec.md SC-001 | "Under 2 minutes, without help" needs a person to measure. No build task can satisfy it. | No change. It is measured during the Step 4 evaluation. |

## Coverage Summary

| Requirement | Has task? | Task IDs | Notes |
|---|---|---|---|
| FR-001 | Yes | T018 | F1 wording |
| FR-002 | Yes | T017, T018 | |
| FR-003 | Yes | T026, T027 | |
| FR-004 | Yes | T016, T018 | |
| FR-005 | Yes | T017, T018, T024 | |
| FR-006 | Yes | T018 | Outcome is computed in the browser on submit, well within 1 minute |
| FR-007 | Yes | T021, T024 | |
| FR-008 | Yes | T011, T016, T024 | |
| FR-009 | Yes | T010, T018, T027, T034 | |
| FR-010 | Yes | T014 | |
| FR-011 | Yes | T015 | |
| FR-012 | Yes | T015, T021 | |
| FR-013 | Yes | T014, T015, T020, T021 | |
| FR-014 | Yes | T015, T026 | |
| FR-015 | Yes | T014, T023 | D1 |
| FR-016 | Yes | T023 | |
| FR-017 | Yes | T023 | D1 |
| FR-018 | Yes | T022, T023 | |
| FR-019 | Yes | T022, T023 | E1 |
| FR-020 | Yes | T017, T021, T022, T026, T031 | E3 |
| FR-021 | Yes | T032 | |
| FR-022 | Yes | T017, T022, T029, T030 | |
| FR-023 | Yes | T019, T022 | |
| FR-024 | Yes | T017, T026, T029, T030 | |
| PR-001 to PR-003 | Yes | T010, T009, T006 | |
| SC-003, SC-004, SC-006, SC-007 | Yes | T012, T019, T028, T031 | Scenario tests |
| SC-005, SC-008 | Yes | T011, T034 | |
| SC-001, SC-002 | n/a | | Measured at evaluation (C1) |

## Constrained-Field Coverage

| Field | Canonical location | Implementing tasks | Notes |
|---|---|---|---|
| `Rider.mobility`, `Rider.boardingMinutes` | data-model.md Rider | T003, T006 | OK |
| `Vehicle.seats`, `Vehicle.wheelchairPositions` | data-model.md Vehicle | T003, T006 | OK |
| `Trip.status`, `Trip.windowStart`, `Trip.attendant` | data-model.md Trip | T003 | OK |
| `Stop.kind`, `Stop.completedAt`, `Stop.changeMark` | data-model.md Stop | T003, T017, T026 | OK |
| `ChangeRequest.kind`, `ChangeRequest.status` | data-model.md ChangeRequest | T003 | OK |
| `ChangeRequest.requestedWindowStart` (validation) | data-model.md ChangeRequest | T017 after fix | E2 |
| `ChangeRequest.declineReason` | data-model.md ChangeRequest | T022 after fix | E1 |
| `ChangeRecord.actorRole`, `ChangeRecord.event` | data-model.md ChangeRecord | T017, T022, T026 after fix | E3 |

## Constitution Alignment

D1 (Principle V) is the only constitution finding. No requirement contradicts a principle.
Unresolved conflict C-7 is not resolved by any task. No task builds a deferred goal.

## Unmapped Tasks

None. T001, T002 and T033–T037 are setup or quality-gate tasks required by the constitution.

## Metrics

- Total requirements: 24 FR + 3 PR. Success criteria: 8
- Total tasks: 37
- Coverage: 100% of FR and PR have at least one task
- Ambiguity count: 0 · Duplication count: 0 · Critical issues: 0 · High: 4 · Medium: 3 · Low: 2

## Next Actions and Remediation Applied

All HIGH and MEDIUM findings were fixed before `/speckit-implement`:

- D1: T023 now requires `computeImpact` against current state, with no impact logic in views
- E1, E2, E3: field citations added to T017, T022 and T026. T022 now writes `accepted` and `declined` records
- F1: FR-001 reworded
- F2: morning run R-3 added to the seed design
- F3: `requestKind` added to RouteImpact
- F4: plan scale corrected
- C1: no change. SC-001 is evaluated in Step 4
