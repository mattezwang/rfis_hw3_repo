# Evaluation of Prototype V1

Step 4 of Assignment 3. Prototype V1 (tag `v1.0`, deployed at
<https://mattezwang.github.io/rfis_hw3_repo/v1/>) was evaluated against the requirements
selected for the sprint and against the stakeholder goals behind them. The traceability matrix
is in [traceability.md](traceability.md).

## How V1 was evaluated

1. **Scenario walkthrough on the deployed site.** Quickstart V1–V14 were run as each role:
   Janelle changing and cancelling her return trip, Frank reviewing, accepting and declining,
   and the driver reading the manifest.
2. **Edge cases beyond the quickstart (E1–E5).**
   - E1: cancelling a trip with a pending change
   - E2: a second change after a confirmed one
   - E3: the rider's view after a dispatcher decision
   - E4: the manifest after accepting a change that makes another rider late
   - E5: the simulated clock running past a trip's window, and browser storage
3. **Stakeholder review.** Each screen was read as Janelle, Frank and Diane would read it,
   using their own words from the transcripts, asking whether it serves the goal and not only
   whether it matches the requirement.
4. **Traceability check.** Quotes were checked against the transcripts by script, goals against
   requirements, and requirements against code. See [traceability.md §How traceability was
   checked](traceability.md#how-traceability-was-checked).

**Result in brief:** 23 of 24 functional requirements are fully satisfied as written, and FR-024
is partially satisfied. Eight of the selected goals are only partly met, and Janelle's top
priority (G-2) is not met at all. So most findings below are **requirements issues**: V1 does
what the spec says, but what the spec says is not enough for the stakeholders' goals.

## Observations

Each observation is classified as:
- **Implementation defect**: the prototype does not satisfy a requirement that was clearly specified.
- **Requirements issue**: the specification is missing information, or is ambiguous, incorrect, or insufficient for the stakeholder's goal.

The "Needed" line says whether the fix is a spec change, an implementation correction, or
further stakeholder clarification.

### O-1: The dispatcher can only accept or decline; nobody offers the rider a time that works

- **What I discovered:** Frank declined Janelle's 15:15 request because no wheelchair position
  was free. The impact table showed him why, and a later time such as 16:00 would have been
  confirmed automatically. But the spec gives him only Accept or Decline. Janelle receives "not
  accepted" and has to guess another time and submit again.
- **Type:** Requirements issue (missing requirement).
- **What it reveals:** Janelle's complaint was "guessing what happened" (00:32:01). A decline
  with no way forward replaces guessing *whether* with guessing *what instead*. Frank wants
  control (00:50:52), not to block riders. Declining is his only tool in V1, even when he can see
  a workable alternative.
- **What needs to change:** when a change cannot be confirmed, the rider should be offered a
  workable alternative.
- **Needed:** spec change. Stakeholder clarification on whether Frank would rather propose times
  himself or have the system suggest them.

### O-2: The rider never sees when she will get home

- **What I discovered:** the preview and confirmation show Janelle's new pickup window and
  estimated pickup, but not her estimated arrival home. The estimate already exists (the
  drop-off row in the dispatcher's impact table) but is not shown to her.
- **Type:** Requirements issue (insufficient specification). The goals that would require it
  (G-6, G-8) were deferred in Step 1.
- **What it reveals:** Janelle said the return trip matters most because "I can miss my
  attendant's evening visit" (00:37:23), and that success means she can "make it home in time
  for my attendant's evening visit" (00:37:58). A pickup time alone does not tell her that. In
  Step 1 I deferred G-6 and G-8 and planned to check during evaluation whether they were
  needed. The prototype shows that they are: the change flow answers "when will the van come?"
  but not Janelle's actual question, "will I be home in time?"
- **What needs to change:** show the rider her own estimated arrival time in the preview and the
  confirmation. This is her own data, so it does not conflict with C-2. Bring the relevant part
  of G-8 into scope.
- **Needed:** spec change and goal model change (move goals back into scope).

### O-3: An estimate outside the rider's own new window is shown without explanation

- **What I discovered:** Janelle asks for 15:30. The preview shows "New pickup window 15:30–16:00,
  Estimated pickup 16:08" and "needs dispatcher approval". The van cannot reach her inside the
  window she chose (A-10, FR-013), but nothing says so. The estimate simply contradicts the
  window.
- **Type:** Requirements issue (missing information). FR-004 does not say what the rider is told
  when her *own* window cannot be met. A-10 only covers routing it to the dispatcher.
- **What it reveals:** this is the self-service version of "I don't know where the vehicle is or
  how delayed it is" (Janelle 00:32:48). Information that contradicts itself is worse than none.
- **What needs to change:** when the requester's window is unreachable, tell the rider plainly
  ("the van can't reach you until about 16:08") and offer the earliest time that works (this
  connects to O-1 and O-4).
- **Needed:** spec change.

### O-4: Finding a time that confirms immediately is trial and error

- **What I discovered:** because of the C-2 privacy decision, the preview says only that approval
  is needed. Janelle tried 15:15 (needs approval), 15:45 (needs approval) and 16:00 (confirmed)
  before getting an immediate answer.
- **Type:** Requirements issue (insufficient). It is a consequence of the C-2 trade-off, which
  V1 implemented correctly.
- **What it reveals:** privacy and self-service are both met in V1, but the cost of the trade-off
  falls on the rider's time. C-2 only prohibits revealing *other riders'* details. Telling
  Janelle *which of her own times* would confirm immediately reveals nothing about anyone else.
- **What needs to change:** the system suggests the nearest pickup times that would be confirmed
  immediately, calculated with the same impact calculation (FR-015). The C-2 decision is kept;
  the suggestion is a refinement within it.
- **Needed:** spec change. This also resolves most of O-1 and O-3 without Frank's involvement.

### O-5: The manifest does not show the driver other riders' stops that moved or became late

- **What I discovered:** after S1 (16:30), Omar's pickup moved from 17:20 to 17:38. After Frank
  accepted S2 (15:45), Grace's pickup moved to 16:25, against a window ending 16:20. On the
  driver's manifest, only Janelle's stops are marked "Changed". Omar's and Grace's rows look
  unchanged, and Grace's late pickup is not flagged.
- **Type:** Requirements issue (ambiguous). FR-024 says "each changed stop", which can mean the
  requester's stops (what V1 does) or every stop whose time moved. V1's reading is defensible,
  so this is not an implementation defect.
- **What it reveals:** Frank's concern was drivers frustrated by "lift schedule and passenger
  notes change mid-run" (00:48:57). Marking only the requester hides the knock-on changes he was
  describing, and a late pickup the driver doesn't know about is exactly how "a manageable
  capacity conflict turns into complaints".
- **What needs to change:** reword FR-024 to say which stops count as changed (for example, any
  stop whose estimated time moves by 5 minutes or more), and add a visible "late: outside
  window" flag on the manifest.
- **Needed:** spec change. The threshold is inferred and needs Frank's confirmation.

### O-6: An accepted change can make another rider late, and no one tells them

- **What I discovered:** when Frank accepts S2, Grace becomes late. Nothing in V1 notifies Grace,
  because notifying affected riders (G-27) was deferred. The dispatcher's view says Grace is
  outside her window, but offers no action for her.
- **Type:** Requirements issue (dependency on a deferred goal).
- **What it reveals:** making Janelle's life easier can recreate Janelle's own problem for Grace:
  "left calling dispatch for answers" (Janelle 00:34:32). The C-1 compromise protects other
  riders only when the dispatcher declines. When he accepts, the protection stops.
- **What needs to change:** either bring G-27 into scope, or at least require that accepting a
  change that makes another rider late shows the dispatcher who must be contacted.
- **Needed:** scope decision (Step 5) and stakeholder clarification with Frank on how riders are
  told today.

### O-7: A pending change has no time limit and no way to reach the rider

- **What I discovered:** after Janelle submits a change that needs approval, it stays pending
  until Frank acts. There is no deadline, and Janelle learns the outcome only by reopening the
  page.
- **Type:** Requirements issue. This is open question Q-2, now visible in the prototype.
- **What it reveals:** FR-006 is met only because "pending" counts as an answer (DP-6). Janelle's
  original failure was a change not made "in time" (00:32:01). Pending without a limit can
  repeat that failure on screen. Frank warned about this: "it'll just move the confusion from the
  phone to the screen" (00:51:24).
- **What needs to change:** a deadline for pending changes (for example, before the earlier of
  the old and new pickup windows), and an escalation if it passes.
- **Needed:** stakeholder clarification (Janelle: how long is acceptable; Frank: what deadline
  he can meet). Q-2 remains open.

### O-8: The window-based meaning of "affected" lets other riders' pickups move silently

- **What I discovered:** S1 was confirmed automatically, and it moved Omar's pickup 18 minutes
  later. That is inside his window, so under A-3 he is not "affected" and Frank never saw it.
- **Type:** Requirements issue. This is open question Q-3, now visible.
- **What it reveals:** the C-1 compromise depends on a definition neither stakeholder gave.
  Frank spoke of "new pickup-window risks for everyone downstream" (00:48:57), which suggests he
  may want to see changes like Omar's.
- **What needs to change:** keep A-3 until Frank answers, but make the cost visible. O-5 shows
  these moves to the driver, and the history could record which riders a confirmed change moved.
- **Needed:** stakeholder clarification (Q-1, Q-3).

### O-9: The impact table lists every stop, so the ones that matter must be found by scanning

- **What I discovered:** the dispatcher's impact table for S2 has 14 rows, most of them
  unchanged or already completed. The rows that matter (Grace outside her window, Janelle's
  moved stops) are highlighted but mixed in with the rest.
- **Type:** Requirements issue (insufficient). FR-017 and G-76 say what must be "visible
  together", not what must stand out.
- **What it reveals:** Frank asked to see "every rider and window that gets hit" (00:47:38): the
  affected ones, not every row. On a busy board, scanning costs time on every decision.
- **What needs to change:** a summary above the table listing the affected riders, by name, and
  why each is affected. Keep the full table below.
- **Needed:** spec change (FR-017).

### O-10: The simulated clock runs on, but the trips do not

- **What I discovered:** I set the simulated clock to 17:10. Janelle's 17:00–17:30 trip still
  showed "Scheduled" and could be changed, and the manifest still showed Ruth waiting for her
  15:00 pickup. The clock advances in real time (A-17), but trip statuses are seed-only (data
  model), so anyone who leaves the demo open for more than about 30 minutes sees an inconsistent
  day.
- **Type:** Requirements issue (the assumptions conflict). The code follows both A-17 and the
  data model exactly, and the two are inconsistent with each other.
- **What it reveals:** a prototyping concern, not a stakeholder one. But it could make the
  prototype look broken to an evaluator who leaves it open.
- **What needs to change:** fix the simulated time at 14:30 for the session (simplest, keeps
  every scenario reproducible), or move trips forward with the clock (beyond the sprint scope).
- **Needed:** spec change (A-17).

### O-11: V1 and V2 would share browser storage on the same site

- **What I discovered:** V1 saves its state in `localStorage` under one key. GitHub Pages serves
  `/v1/` and `/v2/` from the same origin, so a V2 that used the same key would load V1's saved
  state (or the reverse), and V1 could break after V2 is deployed.
- **Type:** Implementation defect, latent. It does not affect V1 today. It would surface when V2
  is deployed alongside it, against PR-002 and the requirement that both versions remain usable.
- **What needs to change:** V2 uses its own storage key. V1 is left untouched, because it is
  frozen.
- **Needed:** implementation correction in V2.

### O-12: Implementation defects found and fixed while building V1

Three implementation defects were found during the build and fixed before V1 was frozen. They
are recorded in [v1-build-notes.md](v1-build-notes.md):
- **D-1:** keyboard focus was lost between steps (FR-009)
- **D-2:** the "Removed" status label was struck through (FR-024)
- **D-3:** a missing-favicon console error

The evaluation found one more cosmetic issue, outside the prototype itself: the deployment
landing page has no favicon. It is fixed on `main`.

### O-13: Independent use by riders cannot be verified without riders

- **What I discovered:** SC-001 (under 2 minutes, without help) and G-37 (independent use) need
  real riders, including riders using assistive technology. The walkthrough shows the flow
  takes 4 actions and works by keyboard, but that is not evidence that Janelle can use it on her
  own.
- **Type:** Requirements issue, of validation rather than specification. The criterion is
  well-defined but cannot be checked in this sprint.
- **Needed:** stakeholder validation (a usability session with riders).

## Summary

| ID | Observation | Type | Needed | Stakeholder goal |
|---|---|---|---|---|
| O-1 | Only accept or decline; no workable alternative offered | Requirements issue: missing | Spec change, plus clarification with Frank | G-14, G-73 |
| O-2 | Rider never sees her arrival time home | Requirements issue: insufficient (deferred goal) | Spec and goal model change | **G-2**, G-6, G-8 |
| O-3 | Estimate outside her own window is unexplained | Requirements issue: missing information | Spec change | G-79, G-14 |
| O-4 | Finding a confirmable time is trial and error | Requirements issue: insufficient (C-2 trade-off) | Spec change | G-9, G-14, G-130 |
| O-5 | Manifest hides other riders' moved or late stops | Requirements issue: ambiguous | Spec change, threshold with Frank | G-148, G-149 |
| O-6 | Accepted change makes another rider late, unannounced | Requirements issue: dependency on deferred goal | Scope decision, clarification | G-26, G-27 |
| O-7 | Pending has no time limit | Requirements issue: open question Q-2 | Stakeholder clarification | G-14, G-19 |
| O-8 | "Affected" lets moves inside a window pass silently | Requirements issue: open question Q-3 | Stakeholder clarification | G-73, G-126 |
| O-9 | Impact table doesn't single out what matters | Requirements issue: insufficient | Spec change | G-75, G-76 |
| O-10 | Clock advances but trips don't | Requirements issue: conflicting assumptions | Spec change | (prototype) |
| O-11 | V1 and V2 would share browser storage | Implementation defect, latent | Implementation correction in V2 | PR-002 |
| O-12 | Focus, label, favicon | Implementation defects | Fixed in V1 | FR-009, FR-024 |
| O-13 | Independent use unverifiable without riders | Requirements issue: validation | Stakeholder validation | G-37 |

**What the evaluation says about the specification.** V1 matches its spec almost exactly. The
spec's weakness was in what the stakeholders needed and the spec left out:
- Janelle's real question is "will I be home in time?", not "when is my pickup?" (O-2).
- A rider with no way forward is still guessing (O-1, O-3, O-4).
- Other riders and the driver need to know about the knock-on effects of a change (O-5, O-6).

The two open questions about the C-1 compromise, Q-2 and Q-3, are now concrete: the prototype
shows what each default does (O-7, O-8). That is something to show Frank and Janelle, rather
than something to decide on their behalf.

Step 5 decides which of these become changes in V2.
