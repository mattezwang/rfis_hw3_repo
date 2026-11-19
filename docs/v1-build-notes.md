# V1 Build Notes

Requirements-level observations noticed while building and smoke-testing Prototype V1
(quickstart V1–V14, 2026-11-18). Constitution Principle IV says these are **recorded, not
silently fixed**: V1 implements the spec as written, and these notes are input to the Step 4
evaluation. They are first impressions from the developer, not the evaluation itself.

## Requirements-level observations (not changed in V1)

| # | Observed while | Observation | Spec reference | Likely type |
|---|---|---|---|---|
| N-1 | V4, driver manifest after S1 (16:30) | Omar's pickup moved from 17:20 to 17:38, still inside his window. The manifest marks only Janelle's stops as "Changed", so the driver cannot see that Omar's time moved. FR-024 says "each changed stop", which can mean the requester's stops or every stop whose time shifted. | FR-024, G-149, C-8 | Requirements issue: ambiguous |
| N-2 | V8, dispatcher accepts S2 (15:45) | After acceptance, Grace's pickup is outside her window. Nothing tells Grace. Notifying other riders (G-27) is deferred, so an accepted change can leave another rider "without information", the very thing Janelle complained about (G-26). | FR-018, G-27 (deferred), G-26 | Requirements issue: dependency on a deferred goal |
| N-3 | V10, dispatcher declines S3 | The dispatcher can only accept or decline. They cannot offer the rider a workable alternative, even though the impact table shows one would exist (16:00 confirms automatically). Janelle gets "not accepted" and has to guess another time. That puts her back to "guessing what happened" (Janelle 00:32:01). | FR-018, FR-019, C-1, Q-2 | Requirements issue: missing requirement |
| N-4 | V2/V5, rider preview | Because of C-2 (privacy), the preview says only that approval is needed, not which times would confirm immediately. Finding a confirmable time is trial and error (15:15 approval, 15:45 approval, 16:00 confirmed). | FR-004, FR-008, C-2 | Requirements issue: consequence of the C-2 trade-off |
| N-5 | V5, pending | A pending change has no time limit, and the rider learns of the decision only by reopening the page. If the dispatcher is busy, Janelle may again not get her change "made in time". | FR-007, DP-6, Q-2 | Requirements issue: open question made visible |
| N-6 | V3/V4, S1 | Under the window-based reading of "affected" (A-3), S1 moved Omar 18 minutes later without the dispatcher seeing it. Frank spoke of "pickup-window *risks* for everyone downstream". | FR-011, A-3, Q-3 | Requirements issue: open question made visible |
| N-7 | V2, rider preview | The preview shows Janelle's estimated pickup but not her estimated arrival home. Her stated top priority is getting home before her attendant's evening visit (G-2). The arrival time is already calculated (the drop-off row) but not shown to her, because G-6 and G-8 were deferred. | FR-004, G-2, G-6, G-8 (deferred) | Requirements issue: deferred goal appears needed |
| N-8 | V7, dispatcher impact table | The table lists every stop on the run (14 rows), including the many that do not change. The rows that matter (moved, flagged, over capacity) have to be found by scanning. | FR-017, G-76 | Requirements issue: "visible together" doesn't say which rows matter |

## Implementation defects found and fixed during the build

These did not match a clearly specified requirement and were corrected in V1.

| # | Defect | Requirement | Fix |
|---|---|---|---|
| D-1 | Keyboard focus dropped to the top of the page when the change form opened, when the preview appeared, and after submitting or cancelling. The task was still possible but disorienting. | FR-009, SC-008 | Focus moves to the time field, then the preview heading, then back to the trip heading |
| D-2 | On the manifest, the "Removed HH:MM" label was struck through along with the row, which made the status hard to read. | FR-024 | Strike-through applies to every cell except the status |
| D-3 | Browser console showed a 404 for a missing favicon. | n/a | Inline favicon |

## Process notes

- The domain functions (`impact.ts`, `decide.ts`, `store.ts`) were written alongside their tests
  rather than strictly test-first, so T011–T031 did not each fail before passing. All 34 tests
  pass.
- Seed tuning: in the first seed, Mei's pickup was already outside its window before any change,
  and S2 was confirmed instead of being routed. Grace's window was moved to 15:50 and Mei's to
  18:15 so the scenarios in data-model.md hold. A baseline test now checks that the seed starts
  with every pickup inside its window.
