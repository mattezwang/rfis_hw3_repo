# Feature Specification: Same-Day Trip Changes and Cancellations

**Feature Branch**: `001-same-day-changes`

**Created**: 2026-11-18

**Status**: Draft (V1)

**Input**: User description: "Same-day trip changes and cancellations for paratransit riders. A rider changes or cancels a trip online. Each change is decided by its route impact: changes that affect no one else are confirmed immediately, and changes that push another rider outside their pickup window or exceed vehicle capacity go to the dispatcher, who reviews the impact and accepts or declines. The driver's manifest reflects accepted changes only. Scope, goals and decisions are those in docs/goal-model.md Steps 1–2."

**Sources**: the goal IDs (`G-n`), conflicts (`C-n`), overlaps (`OV-n`), dependencies (`DP-n`), assumptions (`A-n`) and open questions (`Q-n`) referenced here are defined in [docs/goal-model.md](../../docs/goal-model.md) and [docs/models/goal_model_sprint.py](../../docs/models/goal_model_sprint.py). Interview evidence is cited as *Stakeholder HH:MM:SS* from [docs/interviews/](../../docs/interviews/). Requirements marked **Inferred** are not stated in any interview.

**Stakeholders**: Janelle (rider, uses a larger-than-standard wheelchair, travels five days a week), Frank (dispatcher, 19 years), Diane (paratransit budget manager).

## Clarifications

### Session 2026-11-18

These were answered by the developer from the goal model and common paratransit practice. None of them changes a stakeholder decision; the stakeholder-level questions remain open as Q-1 to Q-5.

- Q: When a rider changes a pickup time, where do their pickup and drop-off go in the van's run? → A: The run keeps its stops in order of scheduled time. The changed pickup moves to the position matching its new time, its drop-off follows it, and all other stops keep their order. Estimated times then follow from travel time between stops and boarding time, with the van waiting at a pickup if it arrives before the window opens. (A-15)
- Q: If other changes are applied to a run while a change is pending, which impact does the dispatcher see? → A: The impact is recalculated against the run as it is when the dispatcher views the change, and again when they accept it. A pending change is never re-decided automatically. (A-16, FR-017)
- Q: What is "the current time" in the prototype? → A: A simulated clock that starts at 14:30 on the seeded service day and advances in real time. Resetting the prototype resets the clock. (A-17)
- Q: How long does boarding take when estimating stop times? → A: A fixed boarding time per mobility need, seeded with the data (shorter for ambulatory riders, longer for wheelchair users, longest for larger-than-standard chairs). Calculating boarding time from mobility needs is goal G-133, which is deferred, so it is mock data here. (A-18)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rider changes a same-day pickup time and gets an immediate answer (Priority: P1)

Janelle's workday ends early. She opens her trips for today, picks her return trip, and requests an earlier pickup time. Before submitting, she sees her own new estimated pickup window and whether the change can be confirmed right away. When the change affects no one else on the van, she submits it and sees a confirmation immediately, without phoning anyone.

**Why this priority**: This is Janelle's reported failure: "once my workday ended early, I needed to change my pickup that same day, but I was stuck on hold and couldn't get the change made in time" (*Janelle 00:32:01*). The return trip is what she said matters most (*Janelle 00:37:23*). Rider self-service is also how all three stakeholders' concern about avoidable calls is met (G-3).

**Independent Test**: Using the seeded service day, a rider changes the return trip to a time that affects no other pickup, and sees a confirmation with the new window. This can be done without any dispatcher action.

**Acceptance Scenarios**:

1. **Given** the rider has a same-day trip that has not been picked up, **When** they open their trips, **Then** they see each of today's trips with its pickup window and status, and can choose to change or cancel any trip not yet picked up.
2. **Given** the rider has entered a new pickup time, **When** they review the change before submitting, **Then** they see their own new estimated pickup window and whether the change will be confirmed immediately or needs dispatcher approval, and nothing about any other rider.
3. **Given** a requested change pushes no other pickup outside its window and exceeds no vehicle capacity, **When** the rider submits it, **Then** the change is confirmed immediately, the rider sees a confirmation with the new pickup window, and the trip shows the new window.
4. **Given** a rider has submitted any change, **When** the outcome is shown, **Then** it appears within one minute of submission and is one of: confirmed, not accepted (with a reason), or pending.
5. **Given** a trip has already been picked up or completed, **When** the rider views it, **Then** it cannot be changed or cancelled.

---

### User Story 2 - Changes that affect other riders go to the dispatcher (Priority: P2)

Janelle requests a pickup time that would push another rider's pickup outside their window, or would put more wheelchairs on the van than it can carry. The change does not apply. She sees that it is pending dispatcher review and that her original pickup still stands. Frank sees the pending change with its full impact on the run: every rider whose time moves, old and new times, which pickups fall outside their windows, and capacity and mobility needs along the run. He accepts it, or declines it with a reason. Janelle's status updates to confirmed or not accepted with Frank's reason.

**Why this priority**: This is the compromise for conflict C-1 between Janelle's need for an immediate answer and Frank's need for control: "I'd still need control over same-day changes, vehicle capacity, and shared routes, because one person's convenience can put six other pickups outside their window" (*Frank 00:50:52*). It also meets Frank's request to "show me every rider and window that gets hit before I accept the change" (*Frank 00:47:38*).

**Independent Test**: Using the seeded service day, a rider submits a change known to push another pickup outside its window. It appears as pending for the rider and in the dispatcher's queue with its impact. The dispatcher accepts one such change and declines another with a reason, and the rider sees each outcome.

**Acceptance Scenarios**:

1. **Given** a requested change would push another rider's pickup outside its window, **When** the rider submits it, **Then** the change is not applied, the rider sees "pending dispatcher review" and that their original pickup still stands, and the change appears in the dispatcher's pending queue.
2. **Given** a requested change would exceed the van's wheelchair or seating capacity at any point on the run, **When** the rider submits it, **Then** it is routed to the dispatcher in the same way.
3. **Given** a pending change, **When** the dispatcher opens it, **Then** they see, on one screen, every stop on the run whose time changes with its old and new estimated time and pickup window, which pickups would fall outside their windows, the onboard wheelchair and seat counts against the van's capacity along the run, and each rider's mobility needs.
4. **Given** the dispatcher has the impact on screen, **When** they accept the change, **Then** it is applied, the rider sees a confirmation, and the driver's manifest is updated.
5. **Given** the dispatcher has the impact on screen, **When** they decline the change, **Then** they must enter a reason, the original trip stands, the driver's manifest is unchanged, and the rider sees "not accepted" with that reason.

---

### User Story 3 - Rider cancels a same-day trip (Priority: P3)

Janelle no longer needs her return trip. She cancels it online and sees a confirmation immediately. The trip is removed from the run and its space on the van is released.

**Why this priority**: Janelle asked to "update or cancel the ride online" (*Janelle 00:32:01*). Cancellation never harms other riders' windows (A-4), so it always confirms immediately. Releasing the space (G-53) keeps the run accurate for Frank.

**Independent Test**: A rider cancels a trip that has not been picked up, sees a confirmation, and the trip no longer appears on the driver's manifest except as a marked removal.

**Acceptance Scenarios**:

1. **Given** a same-day trip not yet picked up, **When** the rider cancels it and confirms, **Then** the cancellation is confirmed immediately and the trip shows as cancelled.
2. **Given** a trip has been cancelled, **When** the run's capacity is calculated, **Then** that rider's seat or wheelchair position is no longer counted.

---

### User Story 4 - Driver manifest reflects accepted changes only, with changes marked (Priority: P4)

A driver views their run's manifest. When a change is accepted, the manifest shows the new stop order and times, and each changed stop is marked with the time of the change. A cancelled stop is shown as removed, with the time. Pending or declined changes never appear.

**Why this priority**: Frank wants to "push updated manifests and notes straight to the driver instead of making me chase people by phone" (*Frank 00:49:55*). He also said "Drivers get frustrated when the lift schedule and passenger notes change mid-run" (*Frank 00:48:57*), which is why changes are marked (C-8).

**Independent Test**: After an accepted change, a declined change and a pending change on the same run, the driver's manifest shows only the accepted change, marked with its time.

**Acceptance Scenarios**:

1. **Given** a change is accepted (automatically or by the dispatcher), **When** the driver views the manifest, **Then** it shows the updated stop order and times, the changed stops are marked with the time of the change, and the rider's confirmation and the manifest update come from the same acceptance.
2. **Given** a change is pending or declined, **When** the driver views the manifest, **Then** the manifest shows the original stop and time.
3. **Given** a trip is cancelled, **When** the driver views the manifest, **Then** the stop is shown as removed, with the time of cancellation.

---

### User Story 5 - Dispatcher reviews the change history (Priority: P5)

When a rider calls back unhappy, Frank opens the change history and sees exactly what was changed, by whom, and when, including decisions the system made automatically.

**Why this priority**: Frank: "keep a clear record of who made it and when" (*Frank 00:47:38*) and "when a rider calls back angry, we need to know exactly what was changed and when" (*Frank 00:49:55*). The same record is the first piece of Diane's linked trip records (OV-3).

**Independent Test**: After several submissions and decisions, the history lists each one with trip, actor and role, what changed, time, outcome and any reason.

**Acceptance Scenarios**:

1. **Given** a rider submits a change, the system decides it, or the dispatcher accepts or declines it, **When** the dispatcher opens the history, **Then** each of these events appears with the trip, who acted and in what role (rider, system or dispatcher), the old and new values, the time, the outcome, and any reason.
2. **Given** a change was confirmed automatically, **When** it appears in the history, **Then** the deciding actor is recorded as "system", never blank.

---

### Edge Cases

- **Change that also makes the rider's own new window unreachable**: the assigned van cannot reach the rider within the new window without being late. The change is routed to the dispatcher rather than confirmed or rejected automatically (**Inferred**, A-10).
- **New time equal to the current pickup time**: nothing changes. The rider is told there is nothing to submit.
- **New time before the current time, or after the end of the service day**: not accepted at entry, with an explanation. Nothing is submitted (A-11).
- **A second change submitted while one is pending for the same trip**: not allowed. The rider sees that the earlier change is still pending (A-12).
- **Cancelling a trip that has a pending change**: allowed. The pending change is withdrawn and recorded as withdrawn, and the cancellation is confirmed (A-12).
- **Change that moves a pickup later so a downstream pickup becomes late, but still inside its window**: not counted as affecting that rider under the window-based reading (A-3). It is confirmed automatically. This is deliberate in V1 and is open question Q-3.
- **The run changes while a change is pending**, for example because another change on the same run was accepted: the dispatcher sees the impact recalculated against the current run, and acceptance uses the current impact. The pending change is not re-decided automatically, even if it would now affect no one (A-16).
- **Many same-day changes on one run**: no limit or warning in V1. C-7 is unresolved (Q-4).
- **Rider with a personal care attendant**: the attendant occupies a seat for capacity purposes and is shown on the driver's manifest as riding at no charge. The manifest note is existing seeded data (G-35, deferred); the seat counts toward capacity (A-13).

## Requirements *(mandatory)*

### Functional Requirements

Each requirement lists the goals it satisfies and its evidence.

**Rider: viewing, changing and cancelling trips**

- **FR-001**: The system MUST show the rider each of their trips for the current service day, with pickup location, pickup window and status (scheduled, picked up, completed, cancelled, change pending).
  *Goals: G-9 · Evidence: "I want to book and change rides online" (Janelle 00:38:44)*
- **FR-002**: The rider MUST be able to request a new pickup time for any same-day trip that has not been picked up.
  *Goals: G-12 · Evidence: "I needed to change my pickup that same day" (Janelle 00:32:01) · A-5, A-6*
- **FR-003**: The rider MUST be able to cancel any same-day trip that has not been picked up, after a confirmation step.
  *Goals: G-13 · Evidence: "update or cancel the ride online" (Janelle 00:32:01)*
- **FR-004**: Before submitting a change, the system MUST show the rider their own new estimated pickup window and whether the change will be confirmed immediately or needs dispatcher approval.
  *Goals: G-79, G-130 · Evidence: "The rider should see what they're changing" (Frank 00:50:52) · C-2 (Inferred limit)*
- **FR-005**: After a change is submitted, the system MUST show the rider one of three outcomes: confirmed (with the new window), not accepted (with a reason), or pending dispatcher review.
  *Goals: G-14, G-17, G-18, G-128 · Evidence: "see whether the change is accepted, and get an immediate confirmation instead of guessing what happened" (Janelle 00:32:01) · G-18 and G-128 Inferred*
- **FR-006**: The outcome or pending status MUST be shown within one minute of submission.
  *Goals: G-19 · Inferred reading of "immediate" (A-2)*
- **FR-007**: While a change is pending, the rider MUST see that their original pickup still stands, and their status MUST update when the dispatcher decides.
  *Goals: G-128, G-14 · Inferred (A-7)*
- **FR-008**: The rider's view MUST NOT show any other rider's name, pickup time, address, mobility needs, or the details of why approval is needed.
  *Goals: G-129, G-130 · Inferred, resolves C-2*
- **FR-009**: Every rider task (viewing trips, changing, cancelling, reading outcomes) MUST be completable by keyboard alone. Form controls MUST be labelled, status changes announced to assistive technology, text contrast at least 4.5:1, and no outcome conveyed by colour alone.
  *Goals: G-36, G-37 · Evidence: "accessible enough that I can use it independently" (Janelle 00:36:15) · WCAG 2.1 AA reading Inferred*

**Deciding a change**

- **FR-010**: For every change, the system MUST calculate the route impact on the rider's run: the new estimated time of every stop, which pickups fall outside their windows, and the onboard wheelchair and seat counts against the van's capacity at every point on the run.
  *Goals: G-125, G-75 · Inferred (C-1), OV-2*
- **FR-011**: The system MUST confirm a change automatically when it pushes no other rider's pickup outside its window and exceeds no vehicle capacity.
  *Goals: G-126 · Inferred, resolves C-1 · A-3*
- **FR-012**: The system MUST route a change to the dispatcher, without applying it, when it pushes another rider's pickup outside its window or exceeds vehicle capacity at any point on the run.
  *Goals: G-127, G-73 · Evidence: "one person's convenience can put six other pickups outside their window" (Frank 00:50:52) · A-3*
- **FR-013**: The system MUST route a change to the dispatcher when the assigned van cannot reach the requesting rider within their new window.
  *Goals: G-125 · Inferred (A-10)*
- **FR-014**: A cancellation MUST be confirmed automatically, and the trip's seat or wheelchair position MUST be released from the run.
  *Goals: G-126, G-53 · Inferred (A-4)*
- **FR-015**: The rider's preview (FR-004), the automatic decision (FR-011, FR-012, FR-013) and the dispatcher's impact view (FR-017) MUST all come from one impact calculation, so they never disagree.
  *Goals: G-75, G-125, G-130 · OV-2, DP-7*

**Dispatcher: reviewing and deciding**

- **FR-016**: The dispatcher MUST see a queue of all pending changes, ordered by the requested pickup time.
  *Goals: G-73, G-127 · Evidence: Frank 00:50:52*
- **FR-017**: For a pending change, calculated against the run as it currently stands, the dispatcher MUST see on one screen: every rider and stop on the run whose time changes, their old and new estimated times and pickup windows, which pickups fall outside their windows, the onboard wheelchair and seat counts against capacity along the run, and each rider's mobility needs.
  *Goals: G-72, G-75, G-76 · Evidence: "show me every rider and window that gets hit before I accept the change" (Frank 00:47:38); "with capacity, mobility needs, and pickup windows all visible together" (Frank 00:49:55)*
- **FR-018**: The dispatcher MUST be able to accept a pending change only from the screen showing its impact. Accepting applies the change.
  *Goals: G-74, G-72 · Evidence: "before I accept the change" (Frank 00:47:38)*
- **FR-019**: The dispatcher MUST be able to decline a pending change only after entering a reason. Declining leaves the original trip in place, and the reason is shown to the rider.
  *Goals: G-146, G-18 · Inferred (DP-2)*

**Records**

- **FR-020**: The system MUST record every submission, automatic decision, dispatcher decision, withdrawal and cancellation with: trip, actor name and role (rider, system, dispatcher), old and new values, time, outcome and reason, if any.
  *Goals: G-77 · Evidence: "keep a clear record of who made it and when" (Frank 00:47:38); "we need to know exactly what was changed and when" (Frank 00:49:55) · DP-5, OV-3*
- **FR-021**: The dispatcher MUST be able to view the full change history for the service day, newest first.
  *Goals: G-77 · Evidence: Frank 00:49:55*

**Driver manifest**

- **FR-022**: When a change is accepted, automatically or by the dispatcher, the driver's manifest MUST show the updated stop order and times in the same step as the rider's confirmation.
  *Goals: G-64, G-145, G-17 · Evidence: "push updated manifests and notes straight to the driver" (Frank 00:49:55) · DP-3*
- **FR-023**: A pending or declined change MUST NOT alter the driver's manifest.
  *Goals: G-67 · Inferred (H10, A-7)*
- **FR-024**: Each changed stop on the manifest MUST be marked with the time of the change. A cancelled stop MUST be shown as removed, with the time of cancellation.
  *Goals: G-149, G-148 · Evidence: "Drivers get frustrated when the lift schedule and passenger notes change mid-run" (Frank 00:48:57) · G-149 Inferred, resolves C-8*

### Prototype Requirements

These support demonstrating and evaluating the prototype. They do not come from stakeholders.

- **PR-001**: The prototype MUST let the evaluator switch between the rider, dispatcher and driver views.
- **PR-002**: The prototype MUST be resettable to the seeded service day from any view.
- **PR-003**: The seeded service day MUST include at least one change of each kind: one that affects no one, one that pushes another pickup outside its window, one that exceeds wheelchair capacity, and a cancellation, so every acceptance scenario can be demonstrated.

### Key Entities

- **Rider**: a person who travels. Has a name, mobility needs (ambulatory, standard wheelchair, larger-than-standard wheelchair), and whether a personal care attendant may accompany them.
- **Trip**: one ride for one rider on the service day. Has a pickup location, drop-off location, pickup window (a start time and a window length), status, and assigned run. An attendant travelling with the rider is recorded on the trip.
- **Vehicle**: a van with a number of seats and a number of wheelchair positions.
- **Run**: one vehicle and driver's ordered sequence of pickup and drop-off stops for the day.
- **Stop**: a pickup or drop-off for one trip on a run, with an estimated time.
- **Change Request**: a rider's request to change a trip's pickup time or cancel it. Has the requested values, the impact calculated for it, and a status: confirmed, pending, not accepted or withdrawn.
- **Route Impact**: the result of calculating a change against its run. For each stop: old and new estimated time, whether a pickup falls outside its window, and onboard seat and wheelchair counts against capacity. Also the decision it implies.
- **Change Record**: one entry in the change history (FR-020).

## Requirements Decisions

How the overlaps, dependencies and conflicts from [docs/goal-model.md §2](../../docs/goal-model.md#step-2-relationships-within-the-sprint-scope) are reflected in this spec. None of the conflicting goals were removed.

| Ref | Relationship | Decision type | What the spec does |
|---|---|---|---|
| OV-1 | G-79 preview (Frank) and G-14/G-17 outcome (Janelle) | Separate, one flow | FR-004 before submission, FR-005 after. Both follow FR-008. |
| OV-2 | G-75/G-76 impact view and the G-126/G-127 decision | Combined | One calculation (FR-010, FR-015) |
| OV-3 | G-77 change history (Frank) and G-98 linked records (Diane, deferred) | Combined at data level, Frank prioritized | FR-020 records the fields G-98 will need. No reporting in V1. |
| DP-2 | G-18 needs a reason from the dispatcher | New goal G-146 | FR-019 makes the reason mandatory. |
| DP-3 | G-17 and G-64 are triggered by the same acceptance | Single event | FR-022 |
| DP-4 | G-67 and the pending state | G-67 rewritten | FR-023 |
| C-1 | Immediate outcome (G-14, Janelle) vs dispatcher control (G-73, Frank) | **Compromise, unvalidated** | FR-011, FR-012: decide by route impact. "Affected" means pushed outside the window or capacity exceeded (A-3). Q-1, Q-2, Q-3 remain open. |
| C-2 | Rider sees effect (G-79) vs others' privacy (G-129) | **Privacy prioritized** | FR-004 shows only the rider's own window and the approval need. FR-008 |
| C-7 | Easier self-service (G-9) vs stable runs (G-41) | **Unresolved** | No limit or warning on the number of changes. Recorded as Q-4 for agency clarification. |
| C-8 | Pushing changes to the driver (G-64) vs driver disruption (G-148) | **Compromise** | FR-024 marks changed and removed stops with times. Driver acknowledgement (G-66) is deferred. |
| C-4 | Dispatcher fixes vs overtime (G-55 × G-116) | Outside scope | G-132 (cost effect in the impact view) is deferred, so G-72 is partially satisfied. |

### Open Questions for Stakeholder Clarification

These are not blocking. V1 implements the stated default so the question can be tested.

| ID | For | Question | V1 default |
|---|---|---|---|
| Q-1 | Frank | Is it acceptable for a change that pushes no one outside their window to apply without the dispatcher? | Yes (FR-011) |
| Q-2 | Janelle | Is "pending dispatcher review" acceptable, and how long can it remain pending before it is no use? | Pending is shown with no time limit (FR-007). |
| Q-3 | Frank | Should a change that leaves another pickup inside its window, but later, still come to the dispatcher? | No, the window-based reading (A-3) |
| Q-4 | Agency | Should same-day changes per rider or per run be limited or flagged? | No limit (C-7) |
| Q-5 | Agency | Is there a late-cancel policy riders should be told about? | None shown. The cancellation time is recorded (FR-020). |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A rider can go from opening their trips to seeing the outcome of a pickup-time change in under 2 minutes, without help.
- **SC-002**: 100% of submitted changes show an outcome or pending status within 1 minute of submission.
- **SC-003**: Across all seeded scenarios, 0 changes that push another pickup outside its window or exceed capacity are applied without dispatcher acceptance.
- **SC-004**: Across all seeded scenarios, 100% of changes that affect no other rider are confirmed without dispatcher involvement.
- **SC-005**: 0 instances of another rider's name, time, address or mobility needs appear in the rider's view.
- **SC-006**: In 100% of scenarios, the driver's manifest matches the set of accepted changes. No pending or declined change appears on it.
- **SC-007**: 100% of submissions and decisions appear in the change history, with an actor and a time.
- **SC-008**: Every rider task can be completed using the keyboard alone.

## Assumptions

- **A-1**: Trips, runs, vehicles and manifests for the service day already exist (from booking, run building and vehicle matching, all deferred) and are seeded as mock data. Travel times between stops are fixed.
- **A-2**: "Immediately" means within one minute (G-19).
- **A-3**: A change "affects" another rider when it pushes their pickup outside its window, or when a vehicle's seat or wheelchair capacity is exceeded at any point on the run. A pickup that moves later but stays inside its window is not affected.
- **A-4**: Cancelling a trip never pushes another pickup outside its window, because a driver who arrives early waits for the window to open.
- **A-5**: Riders change the pickup time or cancel. Changing pickup or drop-off addresses is out of scope.
- **A-6**: Any same-day pickup time change, earlier or later, is in scope. Janelle's early finish is the motivating example, not a limit.
- **A-7**: While a change is pending, the original trip stands and the driver's manifest is unchanged.
- **A-8**: One rider persona (Janelle), one dispatcher and the drivers of the seeded runs are enough to demonstrate the feature. There is no sign-in; the evaluator switches roles.
- **A-9**: Riders who cannot use the online service still phone reservation staff (G-135, deferred). This feature does not replace that channel.
- **A-10** (**Inferred**): If the assigned van cannot reach the requesting rider within their new window, the change goes to the dispatcher, who can judge alternatives such as another run that this prototype does not model.
- **A-11** (**Inferred**): A new pickup time must be later than the current time and within the service day.
- **A-12** (**Inferred**): A trip can have at most one pending change. Cancelling withdraws a pending change.
- **A-13** (**Inferred**): A personal care attendant occupies a seat for capacity purposes.
- **A-14**: The pickup window is 30 minutes long, starting at the scheduled pickup time, so a requested pickup time T gives a window of T to T+30. This follows common paratransit practice; no stakeholder specified a length.
- **A-15**: Stops on a run stay in order of scheduled time. A changed pickup moves to the position for its new time, and its drop-off follows it (Clarifications).
- **A-16**: A pending change's impact is recalculated against the current run whenever the dispatcher views or accepts it. It is never re-decided automatically (Clarifications).
- **A-17**: The prototype's current time is a simulated clock starting at 14:30 on the service day (Clarifications).
- **A-18**: Boarding time is fixed per mobility need and seeded with the data, standing in for deferred goal G-133 (Clarifications).
- **Out of scope** (deferred in docs/goal-model.md §1.4): booking, live vehicle tracking and arrival estimates, notifying other affected riders (G-27), driver acknowledgement (G-66), cost and overtime effects in the impact view (G-132), run building and conflict flags, vehicle matching, reporting, no-show patterns, and attendant-visit timing (G-6, G-8).
