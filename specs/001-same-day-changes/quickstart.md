# Quickstart: Same-Day Trip Changes and Cancellations (V2)

How to run the prototype and check each acceptance scenario by hand. The seeded scenarios
(S1 to S4) are defined in [data-model.md](data-model.md#seed-design-pr-003).

## Prerequisites

- Node.js 20 or later, and npm

## Run

```bash
cd frontend
npm install
npm run dev        # development server, prints a local URL
npm test           # domain and scenario tests
npm run build      # static build in frontend/dist (relative paths, deployable anywhere)
```

Use the role switcher at the top to move between **Rider (Janelle)**, **Dispatcher (Frank)** and
**Driver**. **Reset demo** restores the seeded service day and the clock (14:30). Reset before
each scenario below.

## Validation scenarios

| # | Steps | Expected | Spec |
|---|---|---|---|
| V1 | Rider: open trips | The morning trip shows completed, with no actions. The return trip shows 17:00–17:30, with Change and Cancel | US1-1, US1-5 |
| V2 | Rider: Change return trip, enter 16:30, review | Preview shows own new window 16:30–17:00 and "confirmed right away". No other rider's information | US1-2, FR-008 |
| V3 | Submit V2 | "Confirmed" with the new window, announced in the status region. The trip shows 16:30–17:00 | US1-3, US1-4 |
| V4 | Driver: R-12 manifest after V3 | Janelle's stops are in their new position with new times, marked "Changed HH:MM" | US4-1 |
| V5 | Rider: change return trip to 15:45 and submit | "Pending dispatcher review", and the original 17:00–17:30 still stands | US2-1, FR-007 |
| V6 | Driver: R-12 manifest after V5 | Unchanged | US4-2 |
| V7 | Dispatcher: open the pending change from V5 | Impact table: every stop whose time moves, before and after, Grace (ambulatory, with attendant) flagged outside her window, onboard seats and wheelchairs against 6 / 2, mobility notes | US2-3 |
| V8 | Dispatcher: Accept | Rider sees "Confirmed". The manifest updates with marks. History shows submitted, routed, accepted | US2-4, US5 |
| V9 | Reset. Rider: change to 15:15 and submit | Pending. Dispatcher sees capacity exceeded (3 wheelchairs, 2 positions), and Grace also pushed outside her window | US2-2 |
| V10 | Dispatcher: Decline without a reason, then with "No wheelchair position free until 15:45" | Blocked without a reason. With a reason, the rider sees "Not accepted" with that reason, and the manifest is unchanged | US2-5 |
| V11 | Reset. Rider: Cancel return trip, confirm | "Confirmed: cancelled". The manifest shows Janelle's stops as removed, with the time | US3, US4-3 |
| V12 | Dispatcher: History | Every event from the scenarios above, with actor, role, time, from and to, and reason. Automatic decisions show "system" | US5 |
| V13 | Rider view, keyboard only | Every step of V2, V3, V5 and V11 can be done with Tab, Shift+Tab, Enter and Space, with visible focus | FR-009, SC-008 |
| V14 | Rider: enter the current pickup time again, a time before 14:30, or submit a second change while one is pending | Rejected at entry with an explanation, or told a change is already pending | Edge cases, A-11, A-12 |

## V2 validation scenarios

These were added for the V2 requirements (spec.md Revision History). V1–V14 above still apply. In V2 the simulated time stays at 14:30 (A-17 revised).

| # | Steps | Expected | Spec |
|---|---|---|---|
| V15 | Rider: change return trip to 16:30, review | The preview also shows "Estimated arrival home" (her drop-off time). After submitting, the confirmation and trip card show the arrival time | FR-025, SC-009 |
| V16 | Rider: change to 15:45, review | Needs approval. Up to 3 "Times that can be confirmed right away" are offered, nearest first, with no other rider's information | FR-026, FR-008 |
| V17 | Choose a suggested time, then submit | The preview loads for that time and says it can be confirmed right away. Submitting confirms it | FR-026, SC-010 |
| V18 | Rider: change to 15:30, review | A plain message says the van cannot reach her between 15:30 and 16:00, and gives the earliest time it could. Suggestions are offered | FR-027 |
| V19 | Request 15:15, submit. Dispatcher declines with a reason. Return to the rider | The trip shows the reason and up to 3 times that can be confirmed now | FR-026, FR-005 |
| V20 | Dispatcher: open a pending 15:45 change | A summary above the table names Grace: pushed outside her window (new time vs window end) | FR-028 |
| V21 | Leave the page open, reload later | The time still shows 14:30 and scenarios behave the same | A-17 (revised) |
| V22 | Open /v1/ and /v2/ in the same browser and make different changes | Neither version's state appears in the other | O-11 |
