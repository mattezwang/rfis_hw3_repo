# Goal Model and Sprint Decisions

This file records how the sprint scope was chosen from the goal models and, in later steps, how the goal model changed for the sprint.

- **Interview transcripts (Assignment 1):** [Janelle, rider](interviews/janelle-rider.csv), [Frank, dispatcher](interviews/frank-dispatcher.csv), [Diane, budget manager](interviews/diane-budget-manager.csv)
- **Goal models (Assignment 2):** [`models/hw2-baseline/`](models/hw2-baseline/), with one model per stakeholder plus the [combined model](models/hw2-baseline/goal_model_combined.py) and its [Mermaid diagram link](models/hw2-baseline/mermaid.txt)

Goal IDs (`G-n`), conflict IDs (`C-n`), inconsistency IDs (`I-n`) and use case IDs (`UC-n`) are the ones used in Assignment 2. Goals marked **(inferred)** are not stated in any transcript; they are highlighted yellow in the combined model.

---

## Step 1: Reconciling the models and choosing the sprint scope

### 1.1 Source models and how they were reconciled

I completed this assignment alone, so the models being reconciled are the three stakeholder models I built in Assignment 2, one per interview:

| Model | Stakeholder | Goals | ID range |
|---|---|---|---|
| `goal_model_Janelle.py` | Rider who uses the service five days a week and a larger-than-standard wheelchair | 37 | G-1 to G-37 |
| `goal_model_Frank.py` | Dispatcher with 19 years' experience | 49 | G-38 to G-85, G-145 |
| `goal_model_Diane.py` | Paratransit budget manager | 46 | G-86 to G-123, G-137 to G-144 |
| `goal_model_combined.py` | Merged model | 131 | adds G-124 to G-136 |

Before using the combined model as the basis for the sprint, I checked it against the three individual models again:

- **No goal was lost in the merge.** Fourteen goals from the individual models are missing from the combined model, and each one is a documented merge into a goal that was rewritten to carry both meanings: G-33→G-61, G-34→G-63, G-39 and G-88→G-7, G-43 and G-117→G-3, G-44→G-5, G-46→G-29, G-49→G-32, G-78→G-27, G-80→G-9, G-82→G-98, G-85→G-76, G-118→G-45.
- **The places where the models describe the same thing differently matter for this sprint.** Janelle, Frank and Diane each describe the phone problem from their own role: rider hold time (G-3), routine calls (G-43) and call-center transactions (G-117). The merge combined them into G-3, so one feature that removes avoidable change calls serves all three stakeholders.
- **The two goals the sprint depends on most come from different models and conflict.** Janelle's G-14, an immediate outcome for a change, and Frank's G-73, dispatcher control of same-day changes, are conflict C-1. The resolution, G-125 to G-128, exists only in the combined model. No stakeholder has seen it.
- **The baseline was re-run against the `goalmodeling` package.** The combined model still runs from its new location in this repository and produces the same Mermaid link that was submitted for Assignment 2.

### 1.2 Candidate feature areas

I grouped the combined model into feature areas by the subtree each area satisfies, then scored each area on the three criteria in the assignment.

| # | Feature area | Main goals | Core | User-facing | Uncertainty | Stakeholders |
|---|---|---|---|---|---|---|
| **A** | **Same-day change and cancellation** | G-9 (change part), G-41, G-73, G-125 | **High.** This is Janelle's failure story and Frank's "where the board starts to unravel". | **High.** It covers the rider portal and the dispatcher board. | **High.** Resolving C-1 depends on goals no stakeholder stated. | Janelle, Frank, Diane |
| B | Live van tracking and arrival estimate | G-10, G-20 to G-27 | High for Janelle | High (rider) | High, but technical: is the estimate accurate? | Janelle |
| C | Online booking | G-11, G-15, G-16, G-48, G-134 | Medium. It is a prerequisite, but booking already works by phone the day before. | High (rider) | Low. Booking forms are well understood; the only open question is late requests (C-6). | Janelle, Frank |
| D | Next-day run building and conflict flags | G-45, G-51, G-54 to G-62 | High for Frank | Dispatcher only | Medium | Frank, Diane |
| E | Vehicle matching | G-28, G-31, G-32, G-131 | High for Janelle | Low. It is mostly a back-end rule. | Medium (C-3, fit versus deadhead) | Janelle, Frank, Diane |
| F | Driver manifests and notes | G-29, G-63, G-65, G-68 | Medium | Driver | Low | Frank, Janelle |
| G | Trip-level cost data and reconciliation | G-90, G-98 to G-103, G-121 | High for Diane | Internal staff only | Low to medium (data definitions) | Diane |
| H | No-show and late-cancel patterns | G-42, G-83, G-120 | Low | Dispatcher | Low | Frank, Diane |

### 1.3 Selected scope: same-day change and cancellation (area A)

**Area A is the only one that scores high on all three criteria, and it is the only one that involves all three stakeholders.**

**Core.** It is the problem each stakeholder raised when asked what goes wrong:
- Janelle: "once my workday ended early, I needed to change my pickup that same day, but I was stuck on hold and couldn't get the change made in time" (00:32:01). When asked what matters most, she named the return trip (00:37:23), and a same-day pickup change is what puts the return trip at risk.
- Frank: "Same-day changes are where the board starts to unravel" (00:47:38), and "one person's convenience can put six other pickups outside their window" (00:50:52).
- Diane: "we look first for more accurate scheduling and fewer avoidable phone transactions" (00:59:57), and "every avoidable mile and phone transaction has a budget consequence" (01:03:42).

**User-facing.** It touches two of the three stakeholders directly: the rider submits a change and sees the outcome, and the dispatcher reviews its impact on the run. It also shows the result to the third party involved, the driver, through the manifest.

**Uncertainty.** This is the main reason for the choice. Fifteen of the 25 goals in scope are **(inferred)**. They include the whole C-1 compromise: auto-accept when no one else is affected (G-126), route to the dispatcher otherwise (G-127), and show a pending status (G-128). Specifically:
- Neither Janelle nor Frank has seen the compromise. Janelle asked for "an immediate confirmation instead of guessing what happened". A *pending* status may feel to her like more guessing.
- Frank said "I'd still need control over same-day changes". He may not accept changes being applied without him, even when they affect nobody else.
- "Affects another rider's window or capacity" is not defined. For example, it is unclear whether moving another pickup within its window counts as affecting that rider.
- "Immediate" was interpreted as one minute (G-19). That is my reading, not Janelle's.
- How much of the route impact a rider may see without exposing other riders' details (C-2, G-129 and G-130) is untested.

Each of these is a **requirements** uncertainty: whether the specified behavior is the right behavior. A prototype with mock data can expose them, because they show up as soon as someone uses the screens. Area B is just as uncertain, but in a technical way. Whether an arrival estimate is trustworthy depends on live GPS and traffic data, so a prototype with fake vehicle positions would teach us nothing about it.

#### Goals inside the sprint boundary

Quotes are traced in the Assignment 2 models. "Partial" means only part of the goal's refinement is in scope.

| Goal | Text (combined model) | Source | In scope |
|---|---|---|---|
| **Rider side** | | | |
| G-9 | Rider manages own trips online and makes routine changes without calling | Janelle 00:38:44, Frank 00:50:52 | Partial: change and cancel only, no booking (G-11) |
| G-12 | Rider changes pickup online if workday ends early | Janelle 00:32:01 | Yes |
| G-13 | Rider cancels ride online if ride no longer needed | Janelle 00:32:01 | Yes |
| G-14 | Rider sees outcome or pending status immediately if change submitted | Janelle 00:32:01 (rewritten, inferred) | Yes |
| G-17 | Rider shown confirmation if change accepted | Janelle 00:32:01 | Yes |
| G-18 | Rider shown reason if change not accepted | inferred | Yes |
| G-128 | Rider shown pending status if change awaits dispatcher | inferred (C-1) | Yes |
| G-19 | Outcome or pending status shown within 1 minute of submission | inferred | Yes |
| G-79 | Rider sees effect of change before submitting | Frank 00:50:52 | Yes |
| G-130 | Rider shown only own new window and approval need | inferred (C-2) | Yes |
| G-129 | Avoid: other riders' trip or mobility details disclosed to riders | inferred (C-2) | Yes |
| G-36 | Rider portal conforms to WCAG 2.1 AA | inferred from Janelle 00:36:15 | Yes, for the screens built |
| **Deciding the change** | | | |
| G-125 | Same-day change decided by route impact if rider submits change | inferred (C-1) | Yes |
| G-126 | Change accepted automatically if no other rider window or capacity affected | inferred (C-1) | Yes |
| G-127 | Change routed to dispatcher if another rider window or capacity affected | inferred (C-1) | Yes |
| **Dispatcher side** | | | |
| G-73 | Dispatcher controls same-day changes that affect other riders, capacity or shared routes | Frank 00:50:52 (rewritten, inferred) | Yes |
| G-72 | Whole route impact shown if same-day change affects another rider window or capacity | Frank 00:49:55 (rewritten, inferred) | Partial: without the cost effect (G-132) |
| G-75 | Every affected rider and window shown | Frank 00:47:38 | Yes |
| G-76 | Capacity, mobility needs and pickup windows visible together on one board | Frank 00:49:55 | Yes, for the affected run |
| G-74 | Change applied if dispatcher accepts after seeing impact | Frank 00:47:38 | Yes |
| G-77 | Change history records who changed what and when | Frank 00:47:38, 00:49:55 | Yes |
| **Effect on the run** | | | |
| G-145 | Driver manifest matches accepted changes | inferred (H10) | Yes |
| G-64 | Updated manifest and notes pushed to driver if change accepted | Frank 00:49:55, 00:50:52 | Yes, as a manifest view (no device push) |
| G-67 | Avoid: driver manifest changed if change not accepted | inferred (H10) | Yes |
| G-53 | Trip removed and capacity released if trip cancelled | inferred (H9) | Yes |

**Parent goals the sprint contributes to but does not complete:** G-41 (same-day change applied without cascading delay), G-3 (reduce avoidable calls, call-center transactions and hold time), G-38 (stability of daily runs), G-1 (rider independence and certainty), and G-2 (rider home in time for the attendant's evening visit).

**Dependencies replaced by mock data.** A same-day change only makes sense on top of things the sprint does not build. These are seeded as fixed data rather than implemented:
- trips already booked (G-11, G-15)
- vehicles already matched to riders' mobility needs (G-28, G-32)
- next-day runs already built and free of conflicts (G-45, G-51)
- driver manifests already issued (G-63)

### 1.4 Priorities considered and deferred

Each of these was a reasonable sprint candidate. They are deferred, not removed, and remain in the goal model.

| Deferred | Goals | Why it ranked lower for this sprint |
|---|---|---|
| Live tracking and arrival estimate | G-10, G-20 to G-27 | It matters most to Janelle, and on criteria it comes second to area A. Its uncertainty depends on real GPS and traffic data that mock data cannot reproduce, so V1 would only show a map, not whether the estimate can be trusted. It also serves only one stakeholder. |
| Online booking, including late requests | G-11, G-15, G-16, G-48, G-134, C-6 | Same-day change depends on booking, but booking is the lower-risk half. Riders already book by phone the day before and Janelle described that as working. Booked trips are seeded as mock data instead. |
| Phone channel for riders who cannot use the portal | G-135 | Important for riders who cannot use the portal, but it keeps today's process rather than testing a new one. |
| Next-day run building and conflict flags | G-45, G-51, G-54 to G-62 | High value for Frank, but it is visible only to dispatchers and involves no stakeholder conflict. Built, conflict-free runs are seeded instead. |
| Vehicle matching | G-28, G-31, G-32, G-131, C-3 | Janelle cares about it a great deal, but it is a back-end assignment rule with little to evaluate through an interface. |
| Driver acknowledgement and delivery to devices | G-66, G-84, G-65 | The sprint shows the updated manifest (G-64) but not delivery or acknowledgement. Those need a driver device and timing that mock data cannot represent. |
| Notifying other affected riders | G-27, G-26 | It follows from a dispatcher accepting a change, but needs a notification channel. It is a candidate for a later sprint. |
| Cost effect of a change (Diane's view on the board) | G-132, C-4 | It needs the trip-level cost data in area G, which is out of scope. G-72 is therefore only partly satisfied, and this is recorded rather than hidden. |
| Trip-level cost data, reconciliation, budget, compliance | G-86 subtree (G-87 to G-123, G-136 to G-144) | Diane's goals are real, but none of her interface is rider- or dispatcher-facing. In this sprint she is represented by G-3, fewer avoidable phone transactions, and by the change record (G-77), which is the start of the linked records she wants (G-98). |
| Boarding and driver preparation | G-4, G-29, G-30, G-35, G-133, C-5 | These happen on the road and are carried out by people, not software. A prototype cannot show much about them. |
| No-show patterns, early warnings, board handoff | G-42, G-70, G-71, G-83 | Low uncertainty and dispatcher-only. |
| Attendant-visit timing | G-6, G-8 | Janelle's top priority sits behind G-2, but G-6 and G-8 are inferred, and the Assignment 2 matrix showed no use case step captures the attendant visit time. I left them out of V1 deliberately and will check during evaluation whether the change flow needs them. |

---

## Step 2: Relationships within the sprint scope

### 2.1 The updated goal model

- **Model:** [`models/goal_model_sprint.py`](models/goal_model_sprint.py). It runs against `goalmodeling` 0.1.6 and writes [`models/sprint-mermaid.txt`](models/sprint-mermaid.txt), a mermaid.live link.
- **Colour key:**
  - green: in scope, stated in a transcript
  - yellow: in scope, inferred
  - blue: parent goal the sprint contributes to but does not complete
  - grey (dashed): deferred, kept for context
  - red border: new or rewritten in Assignment 3
- **What it contains:** the sprint boundary from §1.3, one level of deferred context around it so the boundary is visible, every conflict touching the scope, and the decisions below. Deferred subtrees are collapsed to a single grey goal. They are unchanged in the [combined model](models/hw2-baseline/goal_model_combined.py), which stays as the Assignment 2 baseline.
- **Diagram:** rendered below. It is wide, so use GitHub's full-screen or pan controls, or open the [mermaid.live link](models/sprint-mermaid.txt). Conflicts are the edges labelled 🗲. Grey dashed goals are outside the sprint.

<!-- BEGIN sprint goal model (generated by docs/models/goal_model_sprint.py) -->
```mermaid
flowchart BT
annotationnode116["H12"]:::stroke -.- node116
node116((" ")) ===> node117
node102[/"G-1: Improve rider independence and certainty on daily trips"/] --- node116
annotationnode101["H12"]:::stroke -.- node101
node101((" ")) ===> node102
node97[/"Achieve[G-2: Rider home in time for attendant evening visit]"/] --- node101
annotationnode96["H4"]:::stroke -.- node96
node96((" ")) ===> node97
node92[/"Achieve[G-6: Return trip booked to arrive before attendant visit]"/] --- node96
node92[/"Achieve[G-6: Return trip booked to arrive before attendant visit]"/]
node95[/"Achieve[G-150: Rider shown own estimated arrival time before and after a change]"/]:::bold --- node96
node94{{TripPortal}} --- node95
node95[/"Achieve[G-150: Rider shown own estimated arrival time before and after a change]"/]
node93[/"Achieve[G-8: Rider home before attendant visit <b>If</b> picked up within window]"/] --- node96
node93[/"Achieve[G-8: Rider home before attendant visit <b>If</b> picked up within window]"/]

node97[/"Achieve[G-2: Rider home in time for attendant evening visit]"/]
node28[/"G-3: Reduce avoidable phone calls, call-center transactions and rider hold time"/] --- node101
annotationnode27["H4"]:::stroke -.- node27
node27((" ")) ===> node28
node25[/"Achieve[G-9: Rider manages own trips online and makes routine changes without calling]"/] --- node27
annotationnode24["H7"]:::stroke -.- node24
node24((" ")) ===> node25
node0[/"Achieve[G-11: Rider books trip online]"/] --- node24
node0[/"Achieve[G-11: Rider books trip online]"/]
node2[/"Achieve[G-12: Rider changes pickup time online <b>If</b> plans change on day of trip]"/]:::bold --- node24
node1{{fa:fa-person Rider}} --- node2
node2[/"Achieve[G-12: Rider changes pickup time online <b>If</b> plans change on day of trip]"/]
node4[/"Achieve[G-13: Rider cancels ride online <b>If</b> ride no longer needed]"/]:::bold --- node24
node3{{fa:fa-person Rider}} --- node4
node4[/"Achieve[G-13: Rider cancels ride online <b>If</b> ride no longer needed]"/]
node13[/"Achieve[G-14: Rider sees outcome or pending status immediately <b>If</b> change submitted]"/] --- node24
annotationnode12["P3"]:::stroke -.- node12
node12((" ")):::filled ===> node13
node6[/"Achieve[G-17: Rider shown confirmation <b>If</b> change accepted]"/]:::bold --- node12
node5{{TripPortal}} --- node6
node6[/"Achieve[G-17: Rider shown confirmation <b>If</b> change accepted]"/]
node8[/"Achieve[G-18: Rider shown reason <b>If</b> change not accepted]"/]:::bold --- node12
node7{{TripPortal}} --- node8
node8[/"Achieve[G-18: Rider shown reason <b>If</b> change not accepted]"/]
node10[/"Achieve[G-128: Rider shown pending status <b>If</b> change awaits dispatcher]"/]:::bold --- node12
node9{{TripPortal}} --- node10
node10[/"Achieve[G-128: Rider shown pending status <b>If</b> change awaits dispatcher]"/]
node11[/"Every submitted change is accepted, not accepted or pending"\]:::bold --- node12

node13[/"Achieve[G-14: Rider sees outcome or pending status immediately <b>If</b> change submitted]"/]
node15[/"Maintain[G-19: Outcome or pending status shown within 1 minute of submission]"/]:::bold --- node24
node14{{TripPortal}} --- node15
node15[/"Maintain[G-19: Outcome or pending status shown within 1 minute of submission]"/]
node23[/"Achieve[G-79: Rider sees effect of change before submitting]"/] --- node24
annotationnode22["H4"]:::stroke -.- node22
node22((" ")) ===> node23
node17[/"Maintain[G-130: Rider shown only own new window and approval need]"/]:::bold --- node22
node16{{TripPortal}} --- node17
node17[/"Maintain[G-130: Rider shown only own new window and approval need]"/]
node19[/"Achieve[G-151: Rider offered nearest pickup times that would be confirmed immediately <b>If</b> requested change cannot be]"/]:::bold --- node22
node18{{TripPortal}} --- node19
node19[/"Achieve[G-151: Rider offered nearest pickup times that would be confirmed immediately <b>If</b> requested change cannot be]"/]
node21[/"Achieve[G-152: Rider told the van cannot reach the requested window <b>If</b> own window unreachable]"/]:::bold --- node22
node20{{TripPortal}} --- node21
node21[/"Achieve[G-152: Rider told the van cannot reach the requested window <b>If</b> own window unreachable]"/]

node23[/"Achieve[G-79: Rider sees effect of change before submitting]"/]

node25[/"Achieve[G-9: Rider manages own trips online and makes routine changes without calling]"/]
node26[/"Achieve[G-10: Rider knows actual vehicle status while waiting]"/] --- node27
node26[/"Achieve[G-10: Rider knows actual vehicle status while waiting]"/]

node28[/"G-3: Reduce avoidable phone calls, call-center transactions and rider hold time"/]
node98[/"Achieve[G-4: Rider boards assigned vehicle safely without rushing]"/] --- node101
node98[/"Achieve[G-4: Rider boards assigned vehicle safely without rushing]"/]
node100[/"G-5: Maximize ability of riders and staff to use system independently and without confusion"/] --- node101
annotationnode99["H3"]:::stroke -.- node99
node99((" ")) ===> node100
node30[/"Maintain[G-36: Rider portal conforms to WCAG 2.1 AA]"/]:::bold --- node99
node29{{TripPortal}} --- node30
node30[/"Maintain[G-36: Rider portal conforms to WCAG 2.1 AA]"/]
node32[/"Achieve[G-37: Rider completes trip tasks without staff help]"/]:::bold --- node99
node31{{fa:fa-person Rider}} --- node32
node32[/"Achieve[G-37: Rider completes trip tasks without staff help]"/]
node36[/"Maintain[G-76: Capacity, mobility needs and pickup windows visible together on one board]"/]:::bold --- node99
node35{{DispatchBoard}} --- node36
node36[/"Maintain[G-76: Capacity, mobility needs and pickup windows visible together on one board]"/]

node100[/"G-5: Maximize ability of riders and staff to use system independently and without confusion"/]

node102[/"G-1: Improve rider independence and certainty on daily trips"/]
node91[/"G-38: Improve stability of daily runs"/] --- node116
annotationnode90["H12"]:::stroke -.- node90
node90((" ")) ===> node91
node79[/"Achieve[G-7: Van arrives within pickup window with stable headway and on-time performance <b>If</b> trip booked]"/] --- node90
annotationnode78["P7"]:::stroke -.- node78
node78((" ")) ===> node79
node77[/"Achieve[G-45: Next-day runs cut accurately and built without conflicts]"/] --- node78
annotationnode76["P1"]:::stroke -.- node76
node76((" ")) ===> node77
node75[/"Maintain[G-50: Run assignments match active trips]"/] --- node76
annotationnode74["H9"]:::stroke -.- node74
node74((" ")) ===> node75
node71[/"Achieve[G-52: Run and driver assigned <b>If</b> trip matched]"/] --- node74
node71[/"Achieve[G-52: Run and driver assigned <b>If</b> trip matched]"/]
node73[/"Achieve[G-53: Trip removed and capacity released <b>If</b> trip cancelled]"/]:::bold --- node74
node72{{DispatchBoard}} --- node73
node73[/"Achieve[G-53: Trip removed and capacity released <b>If</b> trip cancelled]"/]

node75[/"Maintain[G-50: Run assignments match active trips]"/]

node77[/"Achieve[G-45: Next-day runs cut accurately and built without conflicts]"/]
node66[/"Maintain[G-29: Driver prepared and informed of current run]"/] --- node78
annotationnode65["H11"]:::stroke -.- node65
node65((" ")) ===> node66
node64[/"Cease[G-65: Dispatcher phoning drivers to relay changes]"/] --- node65
annotationnode63["H4"]:::stroke -.- node63
node63((" ")) ===> node64
node61[/"Maintain[G-145: Driver manifest matches accepted changes]"/] --- node63
annotationnode60["H10"]:::stroke -.- node60
node60((" ")) ===> node61
node57[/"Achieve[G-64: Updated manifest and notes pushed to driver <b>If</b> change accepted]"/]:::bold --- node60
node56{{DispatchBoard}} --- node57
node57[/"Achieve[G-64: Updated manifest and notes pushed to driver <b>If</b> change accepted]"/]
node59[/"Avoid[G-67: Driver manifest changed <b>If</b> change pending or declined]"/]:::bold --- node60
node58{{DispatchBoard}} --- node59
node59[/"Avoid[G-67: Driver manifest changed <b>If</b> change pending or declined]"/]

node61[/"Maintain[G-145: Driver manifest matches accepted changes]"/]
node62[/"Achieve[G-66: Driver acknowledges updated manifest]"/] --- node63
node62[/"Achieve[G-66: Driver acknowledges updated manifest]"/]

node64[/"Cease[G-65: Dispatcher phoning drivers to relay changes]"/]

node66[/"Maintain[G-29: Driver prepared and informed of current run]"/]

node79[/"Achieve[G-7: Van arrives within pickup window with stable headway and on-time performance <b>If</b> trip booked]"/]
node84[/"Maintain[G-40: Board accurate throughout shift and at handoff]"/] --- node90
annotationnode83["H4"]:::stroke -.- node83
node83((" ")) ===> node84
node81[/"Maintain[G-77: Change history records who changed what and when]"/]:::bold --- node83
node80{{DispatchBoard}} --- node81
node81[/"Maintain[G-77: Change history records who changed what and when]"/]
node82[/"Achieve[G-68: Driver road notes captured in system]"/] --- node83
node82[/"Achieve[G-68: Driver road notes captured in system]"/]

node84[/"Maintain[G-40: Board accurate throughout shift and at handoff]"/]
node88[/"Achieve[G-41: Same-day change applied without cascading delay]"/] --- node90
annotationnode87["H4"]:::stroke -.- node87
node87((" ")) ===> node88
node47[/"Maintain[G-73: Dispatcher controls same-day changes that affect other riders, capacity or shared routes]"/] --- node87
annotationnode46["P4"]:::stroke -.- node46
node46((" ")) ===> node47
node41[/"Achieve[G-72: Whole route impact shown <b>If</b> same-day change affects another rider window or capacity]"/] --- node46
annotationnode40["P5"]:::stroke -.- node40
node40((" ")) ===> node41
node34[/"Achieve[G-75: Every affected rider and window shown]"/]:::bold --- node40
node33{{DispatchBoard}} --- node34
node34[/"Achieve[G-75: Every affected rider and window shown]"/]
node36[/"Maintain[G-76: Capacity, mobility needs and pickup windows visible together on one board]"/]:::bold --- node40
node39[/"Achieve[G-153: Affected riders and reasons summarized above the route impact]"/]:::bold --- node40
node38{{DispatchBoard}} --- node39
node39[/"Achieve[G-153: Affected riders and reasons summarized above the route impact]"/]
node37[/"Achieve[G-132: Overtime and deadhead effect of a fix shown with route impact]"/] --- node40
node37[/"Achieve[G-132: Overtime and deadhead effect of a fix shown with route impact]"/]

node41[/"Achieve[G-72: Whole route impact shown <b>If</b> same-day change affects another rider window or capacity]"/]
node43[/"Achieve[G-74: Change applied <b>If</b> dispatcher accepts after seeing impact]"/]:::bold --- node46
node42{{fa:fa-person Dispatcher}} --- node43
node43[/"Achieve[G-74: Change applied <b>If</b> dispatcher accepts after seeing impact]"/]
node45[/"Achieve[G-146: Change declined with reason <b>If</b> dispatcher rejects after seeing impact]"/]:::bold --- node46
node44{{fa:fa-person Dispatcher}} --- node45
node45[/"Achieve[G-146: Change declined with reason <b>If</b> dispatcher rejects after seeing impact]"/]

node47[/"Maintain[G-73: Dispatcher controls same-day changes that affect other riders, capacity or shared routes]"/]
node55[/"Achieve[G-125: Same-day change decided by route impact <b>If</b> rider submits change]"/] --- node87
annotationnode54["P3"]:::stroke -.- node54
node54((" ")):::filled ===> node55
node49[/"Achieve[G-126: Change accepted automatically <b>If</b> no other pickup pushed outside its window and no vehicle capacity exceeded]"/]:::bold --- node54
node48{{DispatchBoard}} --- node49
node49[/"Achieve[G-126: Change accepted automatically <b>If</b> no other pickup pushed outside its window and no vehicle capacity exceeded]"/]
node51[/"Achieve[G-127: Change routed to dispatcher <b>If</b> another pickup pushed outside its window or vehicle capacity exceeded]"/]:::bold --- node54
node50{{DispatchBoard}} --- node51
node51[/"Achieve[G-127: Change routed to dispatcher <b>If</b> another pickup pushed outside its window or vehicle capacity exceeded]"/]
node52[/"A change either pushes another pickup outside its window or exceeds capacity, or it does neither"\]:::bold --- node54
node53[/"Removing a stop never pushes a later pickup outside its window (A-4)"\]:::bold --- node54

node55[/"Achieve[G-125: Same-day change decided by route impact <b>If</b> rider submits change]"/]
node70[/"G-148: Minimize driver disruption from mid-run manifest changes"/] --- node87
annotationnode69["H8"]:::stroke -.- node69
node69((" ")) ===> node70
node68[/"Achieve[G-149: Changed stops marked on manifest with time of change]"/]:::bold --- node69
node67{{DriverApp}} --- node68
node68[/"Achieve[G-149: Changed stops marked on manifest with time of change]"/]

node70[/"G-148: Minimize driver disruption from mid-run manifest changes"/]
node85[/"Achieve[G-27: Rider alerted once, before the pickup window opens, <b>If</b> van predicted outside window or trip changes]"/] --- node87
node85[/"Achieve[G-27: Rider alerted once, before the pickup window opens, <b>If</b> van predicted outside window or trip changes]"/]
node86[/"Achieve[G-70: Early warning shown <b>If</b> schedule at risk]"/] --- node87
node86[/"Achieve[G-70: Early warning shown <b>If</b> schedule at risk]"/]

node88[/"Achieve[G-41: Same-day change applied without cascading delay]"/]
node89[/"Achieve[G-42: Repeated no-show and late-cancel patterns visible]"/] --- node90
node89[/"Achieve[G-42: Repeated no-show and late-cancel patterns visible]"/]

node91[/"G-38: Improve stability of daily runs"/]
node115[/"G-86: Maximize responsible use of public funds while keeping service compliant"/] --- node116
annotationnode114["H12"]:::stroke -.- node114
node114((" ")) ===> node115
node113[/"G-93: Maximize favorable variance on cost per trip, overtime and invoices"/] --- node114
annotationnode112["H4"]:::stroke -.- node112
node112((" ")) ===> node113
node111[/"G-109: Minimize cost per passenger trip"/] --- node112
annotationnode110["H4"]:::stroke -.- node110
node110((" ")) ===> node111
node28[/"G-3: Reduce avoidable phone calls, call-center transactions and rider hold time"/] --- node110

node111[/"G-109: Minimize cost per passenger trip"/]

node113[/"G-93: Maximize favorable variance on cost per trip, overtime and invoices"/]
node109[/"Cease[G-90: Manual reconciliation in variance analysis]"/] --- node114
annotationnode108["H4"]:::stroke -.- node108
node108((" ")) ===> node109
node107[/"Achieve[G-103: Trip-level cost allocation data available]"/] --- node108
annotationnode106["P5"]:::stroke -.- node106
node106((" ")) ===> node107
node105[/"Achieve[G-98: Reservation, dispatch, trip, cancellation and no-show records linked and recorded per rider]"/] --- node106
node105[/"Achieve[G-98: Reservation, dispatch, trip, cancellation and no-show records linked and recorded per rider]"/]

node107[/"Achieve[G-103: Trip-level cost allocation data available]"/]

node109[/"Cease[G-90: Manual reconciliation in variance analysis]"/]

node115[/"G-86: Maximize responsible use of public funds while keeping service compliant"/]
node104[/"Avoid[G-129: Other riders' trip or mobility details disclosed to riders]"/] --- node116
annotationnode103["H8"]:::stroke -.- node103
node103((" ")) ===> node104
node17[/"Maintain[G-130: Rider shown only own new window and approval need]"/]:::bold --- node103

node104[/"Avoid[G-129: Other riders' trip or mobility details disclosed to riders]"/]

node117[/"G-124: Maximize reliable, compliant and cost-responsible paratransit service"/]
node118 ---x node88
node118[\"O-3: Rider changes trip without seeing route impact"\]

node23 ---x node118
node23[/"Achieve[G-79: Rider sees effect of change before submitting]"/]
node118[\"O-3: Rider changes trip without seeing route impact"\]

node119 ---x node88
node119[\"O-6: Accepted change makes another rider late without notice"\]

node13 --"#128498;"--- node47
node47[/"Maintain[G-73: Dispatcher controls same-day changes that affect other riders, capacity or shared routes]"/]
node13[/"Achieve[G-14: Rider sees outcome or pending status immediately <b>If</b> change submitted]"/]

node23 --"#128498;"--- node104
node104[/"Avoid[G-129: Other riders' trip or mobility details disclosed to riders]"/]
node23[/"Achieve[G-79: Rider sees effect of change before submitting]"/]

node25 --"#128498;"--- node88
node88[/"Achieve[G-41: Same-day change applied without cascading delay]"/]
node25[/"Achieve[G-9: Rider manages own trips online and makes routine changes without calling]"/]

node57 --"#128498;"--- node70
node70[/"G-148: Minimize driver disruption from mid-run manifest changes"/]
node57[/"Achieve[G-64: Updated manifest and notes pushed to driver <b>If</b> change accepted]"/]


classDef bold stroke-width:3,stroke:#000
classDef filled fill:#000;
classDef nostroke stroke-width:0,fill-opacity:0.0
classDef stroke stroke-dasharray: 5 5,fill-opacity:0.0,text-align:left

    classDef stated fill:#C8E6C9,color:#000
classDef yellow fill:#FFFF00,color:#000
classDef partial fill:#DCEBFA,color:#000
classDef deferred fill:#EEEEEE,color:#777,stroke:#AAA,stroke-dasharray:4 3
classDef changed stroke:#D32F2F,stroke-width:4
classDef v2 stroke:#6A1B9A,stroke-width:5
class node2,node4,node6,node32,node43,node34,node36,node81,node23,node57,node70 stated
class node13,node8,node15,node30,node73,node59,node41,node47,node55,node49,node51,node10,node104,node17,node61,node45,node68,node95,node19,node21,node39 yellow
class node102,node97,node28,node100,node25,node66,node91,node84,node88,node75,node64,node79,node77,node117 partial
class node98,node92,node93,node26,node0,node85,node89,node71,node62,node82,node86,node105,node107,node109,node111,node113,node115,node37 deferred
class node2,node59,node49,node51,node45,node70,node68 changed
class node95,node19,node21,node39,node97 v2
```
<!-- END sprint goal model -->

### 2.2 Overlaps

| ID | Requirements | Relationship | Decision | Why |
|---|---|---|---|---|
| OV-1 | G-79 "rider sees effect before submitting" (Frank) and G-14/G-17 "rider sees whether change is accepted" (Janelle) | Both tell the rider about the same change, at different moments: before submission and after. | **Keep separate, build as one flow** (preview → submit → outcome). Both use the same display rule, G-130. | They trace to different stakeholders and answer different questions. Frank wants the rider to understand the change before making it; Janelle wants to know the result. Merging them would lose one of the two traces. |
| OV-2 | G-75 "every affected rider and window shown", G-76 "capacity, mobility and windows together on one board", and the impact test inside G-126/G-127 | The dispatcher's impact view and the automatic decision both depend on the same calculation: which pickups move, and does capacity hold. | **Combine into one impact calculation** that drives both the auto-decision and the dispatcher's view. G-75 and G-76 stay as separate IDs, one for content and one for layout. | If the system decided with one calculation and showed the dispatcher another, the dispatcher could see "no one affected" on a change the system sent for approval, or the reverse. One calculation keeps what Frank sees consistent with what the system decided. |
| OV-3 | G-77 change history (Frank) and G-98 linked reservation, dispatch, cancellation and no-show records (Diane, deferred) | Same events. Frank wants to know "exactly what was changed and when" (00:49:55); Diane wants "cleaner linkage between reservations, dispatch events, completed trips, cancellations, and no-shows" (01:04:24). | **Combine at the data level, prioritize Frank's view.** One change record (trip, who, role, what changed, when, outcome, reason) satisfies G-77 now and is the record G-98 would link later. | This gives Diane a future benefit at no extra cost. Building the reporting side now would pull in the deferred area G. |
| OV-4 | G-3, G-43 and G-117: hold time, routine calls and call-center transactions | Already merged into G-3 in Assignment 2 | **Keep merged** | This overlap is the reason the sprint serves all three stakeholders (§1.1). |

### 2.3 Dependencies

| ID | Dependency | Consequence for the sprint |
|---|---|---|
| DP-1 | G-125, deciding by route impact, needs runs, vehicle capacities, pickup windows and travel times to exist (G-45, G-32, G-28, all deferred). | They are seeded as mock data: one service day, several runs, fixed travel times between stops. This is assumption A-1. |
| DP-2 | **G-18, showing the rider a reason when a change is not accepted, had no supplier for dispatcher decisions.** G-74 covers the dispatcher accepting a change, but nothing in the combined model makes the dispatcher give a reason when declining. | **Added G-146:** "Change declined with reason if dispatcher rejects after seeing impact". It is the converse of G-74 (H10), placed under G-73. Without it, G-18 cannot be satisfied for any change that reaches the dispatcher. |
| DP-3 | G-17 (rider confirmation) and G-64 (driver manifest) are both triggered by the same event: a change being accepted, whether by G-126 or G-74. | **One accept event updates both.** The rider must never see "confirmed" while the driver's manifest still shows the old time, or the reverse. |
| DP-4 | G-67, never changing the manifest unless a change is accepted, interacts with the new pending state (G-128), which did not exist when G-67 was written. | **G-67 rewritten** to "...if change pending or declined". A pending change leaves the original trip and manifest untouched. |
| DP-5 | G-77, the change history, has three writers: the rider (submit), the system (auto-decision) and the dispatcher (accept or decline). | Every state change writes a record with the actor's role, so "who made it" is never blank. Auto-decisions are attributed to "system". |
| DP-6 | G-19 (outcome or pending within one minute) can always be met only because G-128 lets the system answer "pending" while the dispatcher decides. | G-19 holds. But **nothing bounds how long a change may stay pending**. Janelle's failure was precisely that her change wasn't made "in time". This is recorded as open question Q-2, not invented. |
| DP-7 | G-130 limits what the rider sees of the same data G-75 shows the dispatcher. | The impact calculation is computed once (OV-2) and shown through two views by role. The rider view gets only the rider's own trip fields. |
| DP-8 | G-36 (WCAG 2.1 AA) applies to every rider-facing goal: G-12, G-13, G-14, G-17, G-18, G-128 and G-79. | This becomes a quality requirement on the rider screens: keyboard operable, labelled controls, status messages announced to screen readers, sufficient contrast. |
| DP-9 | G-13, cancelling online, feeds Frank's deferred late-cancel patterns (G-42) and Diane's no-show capacity tracking (G-144). | The change record keeps the cancellation time, so a later sprint can classify late cancellations. The sprint does not apply a late-cancel policy, because none was described in the interviews (Q-5). |

### 2.4 Conflicts

Every conflict stays in the model as a `ConflictLink`. None was removed.

#### C-1: Immediate outcome for the rider vs. dispatcher control (G-14 × G-73), carried from Assignment 2

- **Evidence:** Janelle wants to "see whether the change is accepted, and get an immediate confirmation instead of guessing what happened" (00:32:01). Frank says "I'd still need control over same-day changes, vehicle capacity, and shared routes, because one person's convenience can put six other pickups outside their window" (00:50:52).
- **Trade-off:** If every change goes to Frank, Janelle waits for a person and we are back to the phone queue on a screen. Frank warned about exactly that: "it'll just move the confusion from the phone to the screen" (00:51:24). If every change applies automatically, Frank loses the control he asked for, and other riders pay for one rider's convenience.
- **Decision: compromise (kept from Assignment 2).** G-125 decides each change by its route impact. A change that affects no one else is accepted automatically (G-126); a change that does is routed to the dispatcher (G-127), and the rider sees *pending* (G-128).
- **New sub-decision: what "affected" means.** Neither stakeholder defined it. There were two readings:
  1. **Strict:** any shift to another rider's scheduled pickup time counts. Nearly every change on a shared run would go to Frank, and Janelle would rarely get an immediate answer.
  2. **Window-based:** affected only if another pickup is pushed *outside its window*, or vehicle capacity is exceeded.

  **I chose the window-based reading** (assumption A-3, written into G-126/G-127). Frank describes the harm in terms of windows: "put six other pickups outside their window", "put half a route outside its window" (00:46:39). Janelle's goal also needs most isolated changes to be answered immediately. The risk is that Frank also talks about "new pickup-window *risks* for everyone downstream" (00:48:57), which suggests he may want changes that leave a pickup inside its window but at its edge to come to him too. **The prototype will make this visible. It is open question Q-3.**
- **Status: compromise, unvalidated.** Q-1 and Q-2 must be answered by the stakeholders.

#### C-2: Rider sees the effect of a change vs. other riders' privacy (G-79 × G-129), carried from Assignment 2

- **Evidence:** Frank says "The rider should see what they're changing" (00:50:52). Showing the full route impact would reveal other riders' pickup times, addresses or mobility devices.
- **Decision: prioritize privacy, with a partial view.** G-130 shows the rider only their own new window and whether dispatcher approval will be needed, never who or what else is affected.
- **Trade-off accepted:** the rider cannot tell *why* a change needs approval. This is noted as something to watch during evaluation.

#### C-7: Easier self-service vs. stable runs (G-9 × G-41), new

- **Evidence:** Frank names "too many same-day changes hitting the board" as an early sign that "the schedule starts cascading" (00:45:27). On rider self-service he says "it could cut down the routine calls, but if riders change a trip without seeing the route impact, I'd spend more time cleaning up the damage" (00:50:52).
- **The conflict:** a 20-minute hold currently discourages changes. Removing it (G-9) is likely to *increase* the number of same-day changes, which works against G-41 and Frank's board stability. Assignment 2 modelled the second half of Frank's quote as obstacle O-3, resolved by G-79, but not the volume effect.
- **Decision: documented as unresolved.** G-125 limits the damage, because only changes that affect no one apply automatically. But the sprint does not limit how many changes a rider can make or warn when there are too many (G-70, deferred). Choosing a limit would be a policy decision about riders' access to service, which neither the rider nor the dispatcher stated and which Diane's ADA constraint (G-96) bears on. **It needs agency clarification (Q-4).**

#### C-8: Push every accepted change to the driver vs. driver disruption (G-64 × G-148), new

- **Evidence:** Frank wants to "push updated manifests and notes straight to the driver" (00:49:55). In the same interview he says "Drivers get frustrated when the lift schedule and passenger notes change mid-run" (00:48:57). This second statement was **not modelled in Assignment 2**. I found it while tracing G-64 back to the transcript, and added it as **G-148**, a soft goal stated by Frank.
- **The conflict:** auto-acceptance (G-126) means manifests change mid-run without a dispatcher call. That is more disruption, not less.
- **Decision: compromise, G-149.** Changed stops are marked on the manifest with the time of the change, so a driver can see at a glance what moved. Driver acknowledgement (G-66) stays deferred because it needs a driver device.

#### C-4: Dispatcher fixes vs. overtime (G-55 × G-116), carried, outside the sprint

The sprint touches this conflict only through G-132, the cost effect shown with the route impact, which is deferred (§1.4). G-72 is therefore marked *partial* in the model. The conflict stays in the combined model unchanged.

C-3, C-5 and C-6 involve only deferred goals and are unchanged in the combined model.

### 2.5 Assumptions made for the sprint

| ID | Assumption | Relates to |
|---|---|---|
| A-1 | Trips, runs, vehicles and manifests for the service day already exist and are seeded as mock data. Travel times between stops are fixed in a lookup table, with no routing engine. | DP-1 |
| A-2 | "Immediately" means within one minute (G-19, from Assignment 2). In the prototype, the decision is shown as soon as the change is submitted. | G-14, G-19 |
| A-3 | "Affected" means another pickup is pushed outside its window, or a vehicle's seating or wheelchair capacity is exceeded at any point on the run. | C-1, G-126, G-127 |
| A-4 | Cancelling a trip never pushes another pickup outside its window, because a driver who arrives early waits for the window to open. Cancellations are therefore always auto-accepted, and capacity is released (G-53). | G-13, G-125 |
| A-5 | Riders can change the pickup time or cancel. Changing the pickup *address* is out of scope, because Janelle's example was a time change. | G-12 |
| A-6 | G-12's condition "workday ends early" was Janelle's example, not a limit. Any same-day pickup time change, earlier or later, is in scope. | G-12 (rewritten) |
| A-7 | While a change is pending, the original trip stands and the driver's manifest is unchanged. | DP-4, G-67 |
| A-8 | One rider and one dispatcher persona are enough for the prototype. There is no login or authentication; roles are switched in the interface. | prototype |
| A-9 | Riders who cannot use the portal still phone reservation staff (G-135, deferred). The sprint does not replace that channel. | G-135 |

Added while writing the spec (Step 3), when its edge cases needed an answer. All are inferred:

| ID | Assumption | Relates to |
|---|---|---|
| A-10 | If the assigned van cannot reach the requesting rider within their new window, the change goes to the dispatcher instead of being confirmed or rejected automatically. | G-125 |
| A-11 | A new pickup time must be later than the current time and within the service day. | G-12 |
| A-12 | A trip can have at most one pending change. Cancelling withdraws a pending change. | G-128, G-13 |
| A-13 | A personal care attendant occupies a seat for capacity purposes. | G-35, G-126 |
| A-14 | The pickup window is 30 minutes long, starting at the scheduled pickup time. This follows common paratransit practice; no stakeholder gave a length. | G-126, G-127 |

A-15 to A-18 are prototype modelling assumptions (stop ordering, recalculating a pending change, the simulated clock, seeded boarding times). They are recorded in the spec's Clarifications section ([specs/001-same-day-changes/spec.md](../specs/001-same-day-changes/spec.md)).

### 2.6 Open questions for stakeholder clarification

| ID | For | Question | Why it matters |
|---|---|---|---|
| Q-1 | Frank | Is it acceptable for a change that pushes no one outside their window to apply without you? | C-1 depends on it. He said he needs "control over same-day changes" without qualification. |
| Q-2 | Janelle | Is "pending, dispatcher reviewing" acceptable, and how long could it stay pending before it is no use to you? | A pending status may feel like the "guessing" she wanted to stop (DP-6). |
| Q-3 | Frank | Should a change that leaves another pickup inside its window, but close to the edge, still come to you? | This decides between the window-based and strict readings in C-1. |
| Q-4 | Agency (Diane, Frank) | Should the number of same-day changes per rider or per run be limited or flagged? | C-7 is unresolved. Any limit affects ADA obligations (G-96). |
| Q-5 | Agency | Is there a late-cancel policy, and should riders be told when a cancellation counts as late? | DP-9 |

### 2.7 Summary of changes to the goal model

| Change | Goal or link | Type | Reason |
|---|---|---|---|
| Added | G-146 Change declined with reason if dispatcher rejects | inferred, H10 | DP-2. G-18 had no supplier. |
| Added | G-148 Minimize driver disruption from mid-run manifest changes | **stated** (Frank 00:48:57) | C-8. It was missed in Assignment 2. |
| Added | G-149 Changed stops marked on manifest with time of change | inferred | Resolves C-8 |
| Added | C-7 ConflictLink G-9 × G-41 | new conflict | Unresolved (Q-4) |
| Added | C-8 ConflictLink G-64 × G-148 | new conflict | Compromise G-149 |
| Added | Domain property "Removing a stop never pushes a later pickup outside its window" | assumption A-4 | Lets G-125's case split cover cancellations |
| Rewritten | G-12 condition "plans change on day of trip" | interpretation | A-6 |
| Rewritten | G-67 "...if change pending or declined" | dependency | DP-4 |
| Rewritten | G-126, G-127 conditions use the window-based test | decision | C-1 sub-decision, A-3 |
| Marked partial | G-72 (G-132 deferred), G-9 (G-11 deferred) | scope | §1.3 |
| Preserved | C-1, C-2 links, O-3 obstacle and resolution | | Not removed |

With G-146, G-148 and G-149, the sprint boundary now holds 28 goals. 17 are inferred and 11 are stated in a transcript.

---

## Step 5: Revisions after evaluating V1

The V1 evaluation ([evaluation-v1.md](evaluation-v1.md)) found that V1 matched its spec, but the spec was not enough for several stakeholder goals. This section records which findings changed the goal model for V2, which did not, and why. The V1 model is preserved at tag `v1.0`. The diagram above is the V2 model; V2 additions have a purple border.

### 5.1 What changed in the goal model

| Change | Goal | From observation | Reasoning |
|---|---|---|---|
| **G-2 moved from deferred to partly in scope** | G-2 Rider home in time for attendant evening visit | O-2 | In Step 1 I deferred G-6 and G-8 and planned to check during evaluation whether the change flow needed them. It did: V1 tells Janelle when the van will come, but not what she actually asked, "will I be home in time?" (00:37:23, 00:37:58). G-6 (booking against the visit time) and G-8 (driver delivers on time) stay deferred, because they belong to booking and on-road service. |
| **Added** | G-150 Rider shown own estimated arrival time before and after a change | O-2 | This is the information part of G-2 that the change flow can deliver. Janelle: it "would let me plan my workday and my trip home with less uncertainty" (00:36:47). It is the rider's own data, so it does not touch C-2. |
| **Added** | G-151 Rider offered nearest pickup times that would be confirmed immediately if the requested change cannot be | O-1, O-4 | V1 left the rider guessing after "needs approval" or a decline. C-2 forbids showing other riders' details, but suggesting the rider's *own* workable times reveals nothing about anyone else. This refines the C-2 decision instead of reversing it: G-129 still holds. |
| **Added** | G-152 Rider told when the van cannot reach the requested window | O-3 | FR-013 routed this case to the dispatcher (A-10), but the rider saw an estimate that contradicted her own window, with no explanation. |
| **Added** | G-153 Affected riders and reasons summarized above the route impact | O-9 | Frank asked to see "every rider and window that gets hit" (00:47:38). V1 showed every stop and left him to find the affected ones. |
| **Added obstacle** | O-6 Accepted change makes another rider late without notice, obstructing G-41 | O-6 | Kept visible with no resolution (see 5.3). |

### 5.2 Conflicts revisited

| Conflict | V1 decision | After evaluation |
|---|---|---|
| C-1 immediate outcome vs dispatcher control | Compromise: decide by route impact | **Kept, still unvalidated.** The evaluation made its two open questions concrete: changes can stay pending indefinitely (O-7, Q-2), and a confirmed change moved Omar 18 minutes without Frank seeing it (O-8, Q-3). V2 reduces the cost to the rider (G-151 offers times that confirm immediately), but the compromise itself waits for Frank and Janelle. |
| C-2 rider sees effect vs others' privacy | Privacy prioritized | **Refined.** The trade-off fell on the rider's time (O-4). G-151 and G-152 give the rider more, using her own data only, so privacy is unchanged. |
| C-7 self-service vs stable runs | Unresolved | **Unchanged.** G-151 may raise the number of confirmed same-day changes slightly, which strengthens the case for asking the agency (Q-4). |
| C-8 push changes vs driver disruption | Compromise: mark changed stops | **Kept. The ambiguity is now documented (O-5).** V1 marks only the requester's stops. Whether knock-on moves should be marked, and above what threshold, is a question for Frank (new Q-6). It was not changed in V2, so the threshold is not invented. |

### 5.3 Findings deliberately not changed in V2

| Observation | Why not in V2 | Where it is kept |
|---|---|---|
| O-5 manifest hides other riders' moved or late stops | Needs a threshold only Frank can give. Changing FR-024 now would replace one ambiguity with an invented number | Q-6, C-8 |
| O-6 accepted change makes another rider late without notice | Telling riders (G-27) is deferred, and how riders are informed today is unknown. Inventing a process would be a requirement no stakeholder stated | Obstacle O-6, Q-7 |
| O-7 pending has no time limit | Needs Janelle (what is acceptable) and Frank (what he can meet) | Q-2 |
| O-8 moves inside a window pass silently | Depends on what Frank means by "affected" | Q-3 |
| O-13 independent use unverified | Needs real riders | SC-001 |

### 5.4 Assumptions revised

| ID | V1 | V2 | Why |
|---|---|---|---|
| A-17 | Simulated clock starts at 14:30 and advances in real time | **Simulated time is fixed at 14:30** for the whole session | O-10: the clock advanced but trips did not, so a demo left open looked broken. Fixing time keeps every scenario reproducible |
| A-19 (new) | n/a | Suggested times are searched in 5-minute steps, up to 90 minutes either side of the requested time, later than now, within the service day. At most 3 are offered, nearest first | G-151 needs a bounded search. The numbers are inferred and easy to tune |
