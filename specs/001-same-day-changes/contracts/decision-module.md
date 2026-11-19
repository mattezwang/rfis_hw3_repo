# Contract: Impact and Decision Module

`frontend/src/domain/`, which holds the only place route impact is calculated (FR-015,
constitution Principle V). Every view uses these functions; none recompute impact. Signatures
are TypeScript. Types are defined in [data-model.md](../data-model.md).

## `simulateRun(run, world) → StopEstimate[]`

Estimated service time and onboard counts for each stop of a run, using the rules in
research.md R-3. Pure; it does not read the clock.

- Completed stops use `completedAt`.
- A pickup's service starts at the later of the arrival and its window start.
- Cancelled trips' stops are skipped.

## `computeImpact(request, world) → RouteImpact`

Implements FR-010, FR-013 and FR-015, plus A-15 and A-16.

- Input: a proposed `time-change` or `cancel` for one trip, and the **current** world (trips,
  runs, vehicles, riders, locations, travel table). Called again whenever a pending request is
  viewed or accepted (A-16).
- Re-sequences the run with the change applied (A-15), simulates the run before and after, and
  returns one `ImpactRow` per stop plus `capacityExceeded`, `othersOutsideWindow`,
  `requesterOutsideWindow`, `decision` and `reasons`.
- A pickup that was already outside its window *before* the change is not counted as pushed
  outside by the change.

## `decideChange(impact) → { decision, reasons }`

Implements FR-011, FR-012, FR-013 and FR-014.

| Condition | Decision | Reason code |
|---|---|---|
| request is a cancellation | `confirm` | none |
| `othersOutsideWindow` is not empty | `route-to-dispatcher` | `other-pickup-outside-window` |
| `capacityExceeded` | `route-to-dispatcher` | `capacity-exceeded` |
| `requesterOutsideWindow` | `route-to-dispatcher` | `requester-window-unreachable` |
| none of the above | `confirm` | none |

Multiple reasons can apply at once. All of them are reported to the dispatcher. The rider is
told only that approval is needed (FR-008).

## `toRiderPreview(impact) → RiderPreview`

Implements FR-004 and FR-008. Returns the rider's own new window, estimated pickup and
`needsApproval`. It never copies other riders' rows.

## Store transitions (`store.ts`)

All take the current `AppData` and a clock time and return new `AppData`. Each appends
ChangeRecords (FR-020).

| Function | Requirement | Effect |
|---|---|---|
| `submitTimeChange(data, tripId, newStart, now)` | FR-002, FR-005, FR-011–FR-013 | Validates (A-11, A-12), computes impact, then applies and marks it (confirm) or creates a pending request (route) |
| `cancelTrip(data, tripId, now)` | FR-003, FR-014 | Withdraws any pending request (A-12), cancels the trip, marks stops removed, releases capacity |
| `acceptChange(data, requestId, dispatcher, now)` | FR-018, FR-022 | Recomputes impact (A-16), applies the change and marks stops in one step |
| `declineChange(data, requestId, dispatcher, reason, now)` | FR-019, FR-023 | Requires a non-empty reason. The trip and manifest are unchanged |

## Errors

Validation failures return a typed result `{ ok: false, error }` with a message suitable for the
rider. They never throw for user input.
