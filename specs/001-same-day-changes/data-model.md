# Data Model: Same-Day Trip Changes and Cancellations

Phase 1 of `/speckit-plan`. These are the entities from the spec's Key Entities, with fields,
validation rules and state transitions. Times are minutes after midnight on the service day,
shown as HH:MM.

## Entities

### Rider
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | Shown to the dispatcher and driver only (FR-008) |
| mobility | `ambulatory` \| `wheelchair` \| `wheelchair-large` | Determines capacity use and boarding time |
| boardingMinutes | number | Seeded per mobility need (A-18) |
| mobilityNote | string | Shown on the dispatcher impact view and the manifest (FR-017) |

### Vehicle
| Field | Type | Notes |
|---|---|---|
| id | string | |
| seats | number | Ambulatory seats, including attendant seats (A-13) |
| wheelchairPositions | number | Each wheelchair rider uses one position |

### Location
| Field | Type | Notes |
|---|---|---|
| id | string | |
| label | string | For example "Office Park, Bldg 4". Shown to the rider for their own trips only |

Travel time between two locations is looked up in a seeded table (research.md R-3).

### Trip
| Field | Type | Notes |
|---|---|---|
| id | string | |
| riderId | string | |
| runId | string | |
| pickupLocationId, dropoffLocationId | string | Fixed (A-5) |
| windowStart | number | Pickup window = windowStart to windowStart + 30 (A-14) |
| attendant | boolean | Attendant rides at no charge and uses a seat (A-13) |
| status | `scheduled` \| `picked-up` \| `completed` \| `cancelled` | |

**Validation**: only `scheduled` trips can be changed or cancelled (spec US1 scenario 5).

### Run
| Field | Type | Notes |
|---|---|---|
| id | string | |
| vehicleId, driverName | string | |
| startLocationId | string | Garage |
| startTime | number | Pull-out time |
| stops | Stop[] | Ordered (A-15) |

### Stop
| Field | Type | Notes |
|---|---|---|
| tripId | string | |
| kind | `pickup` \| `dropoff` | |
| completedAt | number \| null | Fixed time for stops already served. Others are estimated |
| changeMark | `{ kind: 'changed' \| 'removed', at: number }` \| null | Shown on the manifest (FR-024) |

### ChangeRequest
| Field | Type | Notes |
|---|---|---|
| id | string | |
| tripId | string | |
| kind | `time-change` \| `cancel` | |
| requestedWindowStart | number \| null | For time changes |
| submittedAt | number | Simulated clock |
| status | `confirmed` \| `pending` \| `not-accepted` \| `withdrawn` | |
| decisionReasons | DecisionReason[] | Why it was routed (FR-012, FR-013) |
| declineReason | string \| null | Required when not accepted (FR-019) |
| decidedAt, decidedBy | number \| null, `system` \| dispatcher name | |

**Validation**:
- a new time must differ from the current one, be later than now, and be inside the service day (A-11)
- at most one `pending` request per trip (A-12)

### RouteImpact (calculated, never stored as the source of truth)
| Field | Type | Notes |
|---|---|---|
| requestKind | `time-change` \| `cancel` | Needed by the decision rule (cancellations always confirm) |
| rows | ImpactRow[] | One per stop on the run after the change |
| capacityExceeded | boolean | Any point on the run over seats or wheelchair positions |
| othersOutsideWindow | string[] | Trip IDs of other riders pushed outside their window |
| requesterOutsideWindow | boolean | A-10 |
| decision | `confirm` \| `route-to-dispatcher` | FR-011 to FR-014 |
| reasons | DecisionReason[] | `other-pickup-outside-window`, `capacity-exceeded`, `requester-window-unreachable` |

### ImpactRow
| Field | Notes |
|---|---|
| tripId, riderName, kind, mobilityNote, locationLabel | Dispatcher only (FR-017) |
| windowStart, windowEnd | Pickups only |
| before, after | Estimated service time before and after the change (null if added or removed) |
| outsideWindowAfter | Pickups only |
| onboardSeatsAfter, onboardWheelchairsAfter | Counts after this stop, against capacity |
| isRequester | true for the changed trip's stops |

### RiderPreview (projection for the rider view; FR-004, FR-008)
| Field | Notes |
|---|---|
| tripId | The rider's own trip |
| newWindowStart, newWindowEnd | Own new window |
| estimatedPickup | Own estimated pickup time after the change |
| needsApproval | boolean |

It has **no** fields about other riders, so the rider view cannot display them (Principle VI).

### ChangeRecord (FR-020)
| Field | Notes |
|---|---|
| id, at | Simulated time |
| tripId, riderName | |
| actor, actorRole | For example "Janelle" / `rider`, "system" / `system`, "Frank" / `dispatcher` |
| event | `submitted`, `confirmed`, `routed`, `accepted`, `declined`, `withdrawn`, `cancelled` |
| from, to | Old and new pickup window (or "cancelled") |
| reason | Decision reasons or decline reason |

## State transitions

### ChangeRequest

```text
                ┌── decision = confirm ──────────────────────► confirmed
submit ─► (impact) ┤
                └── decision = route-to-dispatcher ─► pending ─┬─ dispatcher accepts ──► confirmed
                                                               ├─ dispatcher declines ─► not-accepted (reason required)
                                                               └─ rider cancels trip ──► withdrawn
cancel ─► confirmed (always, A-4)
```

Each arrow writes one ChangeRecord. A `confirmed` transition applies the change to the trip and
run, and marks the affected stops (FR-022, FR-024) in a single reducer step (DP-3).

### Trip

```text
scheduled ── confirmed time change ──► scheduled (new windowStart, stops re-sequenced)
scheduled ── confirmed cancel ───────► cancelled (stops shown as removed, capacity released)
picked-up / completed: seeded only; no transitions in this feature
```

## Seed design (PR-003)

The seed contains one service day, simulated clock starting at 14:30 (A-17):

- **Janelle** (`wheelchair-large`, boarding 7 min): morning trip home → Office Park, `completed`,
  on morning run **R-3** (all stops completed).
  Return trip Office Park → home, window **17:00–17:30**, on run **R-12**.
- **Run R-12** (van V-07: 6 seats, 2 wheelchair positions, driver Dana Morales): pull-out 14:00,
  two stops already completed. Its afternoon riders include two wheelchair users whose trips
  overlap between about 15:00 and 15:50, an ambulatory rider with an attendant (window 15:50),
  and riders after 17:00.
- **Run R-14**: a second afternoon run, unaffected by Janelle's trips, so the driver view has
  more than one manifest.

The seed is tuned so these requests on Janelle's return trip produce these outcomes. The
scenario tests check them (tasks.md):

| ID | Request | Expected decision | Why |
|---|---|---|---|
| S1 | New pickup 16:30 | confirm | No other pickup outside its window, capacity holds |
| S2 | New pickup 15:45 | route to dispatcher | Grace's pickup (ambulatory, with attendant) is pushed outside its window |
| S3 | New pickup 15:15 | route to dispatcher | Three wheelchairs onboard with two positions (capacity exceeded). Grace's pickup is also pushed outside its window |
| S4 | Cancel | confirm | A-4. Janelle's wheelchair position released |
