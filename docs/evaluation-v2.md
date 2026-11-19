# Prototype V2: Changes and Verification

Step 5 of Assignment 3. V2 (tag `v2.0`, deployed at
<https://mattezwang.github.io/rfis_hw3_repo/v2/>) revises V1 using the findings in
[evaluation-v1.md](evaluation-v1.md). The changes were made in this order: goal model
([goal-model.md §Step 5](goal-model.md#step-5-revisions-after-evaluating-v1)), then the
specification ([spec.md Revision History](../specs/001-same-day-changes/spec.md#revision-history)),
then the plan, data model, contract and tasks (Phase 9), and only then the code.

## What changed between V1 and V2

| Change | V1 behaviour | V2 behaviour | Requirement | Goal | From |
|---|---|---|---|---|---|
| **Arrival time home** | Janelle saw only her pickup window and estimated pickup | The preview, confirmation and each trip card show her estimated arrival home | FR-025 | G-150, G-2 | O-2 |
| **Times that confirm right away** | "Needs approval" or a decline left her to guess another time | Up to 3 nearby pickup times that would confirm immediately, each with van and home times. Choosing one loads its preview. Offered after a decline too | FR-026, FR-005 | G-151, G-14, G-79 | O-1, O-4 |
| **Unreachable window explained** | An estimate outside her chosen window, with no explanation | "The van can't reach you between 15:30 and 16:00. The earliest it could pick you up is about 16:08." | FR-027 | G-152 | O-3 |
| **Affected-rider summary** | Frank scanned a 14-row table for the affected riders | A summary above the table names each affected rider and why | FR-028 | G-153, G-75 | O-9 |
| **Fixed simulated time** | Clock advanced while trips stood still | Time fixed at 14:30, so every scenario is reproducible | A-17 (revised) | (prototype) | O-10 |
| **Separate storage** | One storage key | V2 uses its own key, so V1 and V2 do not interfere on the shared site | (implementation) | PR-002 | O-11 |

Unchanged and still open on purpose: O-5 (Q-6), O-6 (Q-7), O-7 (Q-2), O-8 (Q-3), O-13. See
[goal-model.md §5.3](goal-model.md#53-findings-deliberately-not-changed-in-v2).

## Verification

- **Tests:** 44 pass. 10 are new for V2: `suggest.test.ts`, plus the V2 preview tests in
  `decide.test.ts`. They were written before the code and failed first, unlike in V1. They
  check that every suggestion confirms when submitted (SC-010), that no suggestion is in the
  past, that suggestions contain times only (FR-008), that the arrival time is the rider's own
  drop-off estimate, and the affected-rider summary.
- **Browser walkthrough (quickstart V15–V21)** on the production build:

| # | Result |
|---|---|
| V15 | 16:30: the preview shows "Estimated arrival home 17:09". The confirmation says "You should be home around 17:09". The trip card shows arrival 17:44 before the change and 17:09 after |
| V16 | 15:45: needs approval. Offered 16:00, 16:05 and 16:10, each "home about 17:09". No other rider's information |
| V17 | Choosing 16:00 loads its preview ("can be confirmed right away"), and submitting confirms it |
| V18 | 15:30: "The van can't reach you between 15:30 and 16:00. The earliest it could pick you up is about 16:08", with suggestions |
| V19 | 15:15 declined with a reason: the trip shows the reason and 3 times that confirm now. Choosing one confirms |
| V20 | 15:45 pending: the summary reads "Grace T.: pickup would be 16:25, after their window ends at 16:20". For 15:15 it also lists Ruth and Luis as on board while over capacity |
| V21 | Stored state from 3 hours earlier still shows 14:30 |
| V22 | *Pending deployment.* V2's code uses its own storage key (`same-day-changes:v2`, V1 uses `same-day-changes:v1`). To be confirmed on the live site |

- **Regression:** V1 scenarios (S1–S4, accept, decline, cancel, the manifest) behave as before. The keyboard-only
  flow works end to end, including choosing a suggestion, with focus kept on the task at every step.

## Requirements and goals: V1 → V2

| Goal | V1 | V2 |
|---|---|---|
| **G-2** home before the attendant's visit (Janelle's top priority) | Not satisfied | **Partially satisfied.** She now sees when she will be home, before and after each change. Booking and on-road delivery against the visit time (G-6, G-8) remain deferred |
| G-14 immediate outcome | Partial | **Improved.** For any change, she can now pick a time that confirms right away instead of waiting on "pending" |
| G-79 see the effect before submitting | Partial | **Satisfied.** Own window, estimates, arrival, why her window can't be met, and what would work |
| G-129, G-130 privacy (C-2) | Satisfied | **Still satisfied.** Suggestions and arrival use her own trip only (tested) |
| G-72, G-75, G-76 route impact for Frank | Partial | **Improved.** The affected riders are named first. Cost effect (G-132) is still deferred |
| G-148, G-149 driver disruption | Partial | Unchanged (O-5 waits for Frank, Q-6) |
| G-26 rider not left without information | Harmed | Unchanged (O-6 waits for Frank, Q-7) |

## What V2 revealed

- **The arrival time changes what a "good" answer is.** For the 15:30 request, approval would
  get Janelle home around 16:43, while any time that confirms right away gets her home around
  17:09. In V1 the choice was invisible. In V2 she can weigh certainty now against getting home
  earlier, which matters with an attendant's visit to make. This is new information for open
  question Q-2: how long Janelle would wait may depend on how much earlier she would get home.
- **Suggestions reduce pressure on the dispatcher, but do not remove C-7.** Every suggested time
  confirms without Frank, so self-service is easier still. Whether same-day change volume should
  be watched (Q-4) is more relevant now, not less.
