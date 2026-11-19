# Research: Same-Day Trip Changes and Cancellations

Phase 0 of `/speckit-plan`. The Technical Context had no open unknowns. This file records the
decisions behind it and the alternatives considered.

## R-1: Application shape

- **Decision**: a static single-page app with no backend, and three role views in one app.
- **Rationale**: the assignment asks for mock data and simplified interactions. A static build
  can be deployed to any static host and kept running for grading at no cost. One app with
  a role switcher lets an evaluator see a rider's change arrive in the dispatcher's queue and
  on the driver's manifest without coordinating several browsers (PR-001).
- **Alternatives considered**: a client and server with a database. This was rejected because
  it adds hosting and moving parts that no requirement in the sprint needs. Three separate apps
  were rejected because they make the cross-role flow in US2 and US4 hard to demonstrate.

## R-2: Framework and tooling

- **Decision**: React with TypeScript, built with Vite, tested with Vitest. Current stable
  versions are pinned in `frontend/package.json`.
- **Rationale**: components map one-to-one onto requirement groups, which keeps the
  traceability matrix's "code" column concrete. TypeScript types encode the entities in
  data-model.md. Vitest runs the domain tests with no browser.
- **Alternatives considered**: plain HTML and JavaScript (fewer dependencies, but no type
  checking of the impact logic, and more hand-written DOM code); a component testing library
  (deferred, because the constitution requires tests on the decision logic, and screens are
  verified in a real browser instead).

## R-3: How route impact is calculated

- **Decision**: a deterministic simulation over the run's ordered stops (A-15):
  1. Completed stops are fixed at their recorded times.
  2. For each remaining stop: arrival = previous departure + travel time between the two
     locations. For a pickup, service starts at the later of the arrival and the window start
     (the van waits, A-4). Departure = service start + boarding time for that rider (A-18).
  3. A pickup is **outside its window** if service starts after the window end.
  4. Onboard counts (seats and wheelchair positions, attendants included, A-13) are tracked
     after every stop and compared with the vehicle's capacity.
  5. To evaluate a change, the run is re-sequenced with the change applied: the changed pickup
     moves to the position for its new time, and its drop-off follows it. Then both the
     "before" and "after" runs are simulated and compared stop by stop.
- **Travel time**: fixed by a seeded table between the seeded locations (A-1). This makes every
  scenario reproducible and keeps the simulation independent of the clock.
- **Rationale**: this is the simplest model that can produce every outcome the spec
  distinguishes: no one affected, another pickup outside its window, capacity exceeded, and the
  requester's own window unreachable. It also produces the per-stop before and after table that
  Frank asked to see (FR-017).
- **Alternatives considered**: real routing or a map API, rejected because it means network
  calls, nondeterminism and deferred tracking scope. Optimizing the insertion position (as a
  real scheduler would) was rejected because it is run-building scope (G-45, deferred). Fixed
  ordering by time keeps the decision explainable.

## R-4: Where state lives and how roles share it

- **Decision**: one reducer over the domain store, held in React context and mirrored to
  `localStorage` under a versioned key. Reset clears the key and reloads the seed.
- **Rationale**: every view reads the same state, so one acceptance updates the rider's status
  and the driver's manifest together (FR-022, DP-3). Mirroring to storage lets an evaluator
  reload without losing their place. The storage is per browser, which suits a demo.
- **Alternatives considered**: state only in memory (lost on reload); a shared server store
  (needs a backend, R-1).

## R-5: Simulated clock

- **Decision**: a clock object created with a start time (14:30 on the service day) and a real
  time origin. It reports simulated time = start + real time elapsed. Tests inject a fixed
  clock.
- **Rationale**: timestamps in the change history and the "later than now" rule (A-11) need a
  current time. A fixed service day means the demo behaves the same whenever it is opened. The
  impact calculation does not read the clock (R-3), so outcomes do not drift while the demo is
  open.
- **Alternatives considered**: the real wall clock, rejected because scenarios would behave
  differently depending on the time of day the grader opens the page.

## R-6: Accessibility approach for rider screens

- **Decision**: native HTML controls (buttons, labelled inputs, a native time field and
  dialog-free flows), one `aria-live="polite"` status region for outcomes, visible focus
  styles, text labels alongside colour for every status, and contrast checked against 4.5:1.
- **Rationale**: this meets FR-009 without a component library. Native controls are keyboard
  operable by default.
- **Alternatives considered**: a UI component library, rejected because it adds a dependency
  and its own accessibility behaviour to audit.

## R-7: Deployment

- **Decision**: build to static files with a relative base path. The host is chosen at the end
  of the sprint by the repository owner. The build output works on GitHub Pages, Netlify,
  Vercel or any static file server, and V1 and V2 can live at separate URLs.
- **Rationale**: the assignment requires deployed V1 and V2 URLs that stay up for grading. The
  choice of host is the repository owner's.
