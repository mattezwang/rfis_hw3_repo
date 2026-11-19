# Same-Day Paratransit Trip Changes: Spec-Driven Development

17-626 Requirements for Information Systems, Assignment 3.

A prototype for paratransit riders to change or cancel a same-day trip online. Each change is
decided by its impact on the van's route. A change that affects no other rider is confirmed
immediately. A change that would push another rider outside their pickup window, or exceed the
van's capacity, goes to the dispatcher, who sees the full route impact and accepts or declines
with a reason. The driver's manifest shows accepted changes only.

The requirements come from interviews with a rider (Janelle), a dispatcher (Frank) and a budget
manager (Diane), modelled as goal models in Assignment 2, and specified and built with
[GitHub Spec Kit](https://github.github.io/spec-kit/).

## Deliverables

| # | Deliverable | Link |
|---|---|---|
| 1 | GitHub Version 1 (goal model, spec, Spec Kit artifacts, source) | [`v1` branch](https://github.com/mattezwang/rfis_hw3_repo/tree/v1) (tag `v1.0`) |
| 2 | GitHub Version 2 (revised goal model, spec, Spec Kit artifacts, source) | [`v2` branch](https://github.com/mattezwang/rfis_hw3_repo/tree/v2) (tag `v2.0`) |
| 3 | Prototype V1 (deployed) | <https://mattezwang.github.io/rfis_hw3_repo/v1/> |
| 4 | Prototype V2 (deployed) | <https://mattezwang.github.io/rfis_hw3_repo/v2/> |
| 5 | Requirements analysis and learning log | [docs/learning-log.md](docs/learning-log.md) |

## What changed from V1 to V2

The V1 evaluation found that V1 did what its spec said, but the spec missed what the stakeholders needed most. V2 changes the requirements first, then the code:

| V2 change | Why (V1 finding) |
|---|---|
| Janelle sees her **estimated arrival home** before and after a change (FR-025) | Her top priority is getting home before her attendant's evening visit, and V1 only showed pickup times (O-2) |
| When a time needs approval or is declined, she is **offered times that confirm right away** (FR-026) | V1 left her guessing after "needs approval" or a decline (O-1, O-4) |
| An **unreachable window is explained** in plain words (FR-027) | V1 showed an estimate that contradicted her own window (O-3) |
| Frank sees a **summary of affected riders** above the impact table (FR-028) | V1 made him scan every stop (O-9) |
| Simulated time **fixed at 14:30**, with separate storage per version | V1's clock ran while trips stood still (O-10). V1 and V2 share a site (O-11) |

Deliberately unchanged, as open questions for the stakeholders: driver manifest marking of knock-on changes (Q-6), telling riders made late by an accepted change (Q-7), how long a change may stay pending (Q-2), and what counts as "affected" (Q-3). Details: [evaluation-v1.md](docs/evaluation-v1.md), [evaluation-v2.md](docs/evaluation-v2.md), [goal-model.md §Step 5](docs/goal-model.md#step-5-revisions-after-evaluating-v1), [spec revision history](specs/001-same-day-changes/spec.md#revision-history).

## Where things are

| Path | Contents |
|---|---|
| [docs/goal-model.md](docs/goal-model.md) | Sprint scope selection (Step 1), overlaps, dependencies, conflicts and decisions (Step 2) |
| [docs/models/goal_model_sprint.py](docs/models/goal_model_sprint.py) | Sprint goal model (`goalmodeling` framework), with a [diagram link](docs/models/sprint-mermaid.txt) |
| [docs/models/hw2-baseline/](docs/models/hw2-baseline/) | Assignment 2 goal models, use cases and traceability matrix (the source of goal IDs) |
| [docs/interviews/](docs/interviews/) | Interview transcripts (Assignment 1) |
| [docs/traceability.md](docs/traceability.md) | Requirements Traceability Matrix: transcript → goal → requirement → code → status, for V1 (Step 4) |
| [docs/evaluation-v1.md](docs/evaluation-v1.md) | Evaluation of Prototype V1: observations classified as implementation defects or requirements issues (Step 4) |
| [docs/evaluation-v2.md](docs/evaluation-v2.md) | V2 changes, verification, and goal satisfaction V1 → V2 (Step 5) |
| [docs/v1-build-notes.md](docs/v1-build-notes.md) | Requirements observations logged while building V1, input to the Step 4 evaluation |
| [.specify/memory/constitution.md](.specify/memory/constitution.md) | Spec Kit constitution: traceability, sprint boundary, preserving conflicts, spec before code |
| [specs/001-same-day-changes/](specs/001-same-day-changes/) | Spec Kit artifacts: [spec](specs/001-same-day-changes/spec.md), [plan](specs/001-same-day-changes/plan.md), [research](specs/001-same-day-changes/research.md), [data model](specs/001-same-day-changes/data-model.md), [contract](specs/001-same-day-changes/contracts/decision-module.md), [tasks](specs/001-same-day-changes/tasks.md), [analysis](specs/001-same-day-changes/analysis.md), [quickstart](specs/001-same-day-changes/quickstart.md) |
| [frontend/](frontend/) | Prototype source (React, TypeScript, Vite). Decision logic is in [frontend/src/domain/](frontend/src/domain/) |

## Deployment

Both prototypes are published by GitHub Pages from [.github/workflows/pages.yml](.github/workflows/pages.yml).
Each version is built from its own tag (`v1.0`, `v2.0`), so the V1 site stays as it was when V1 was
frozen. Landing page: <https://mattezwang.github.io/rfis_hw3_repo/>

## Run the prototype locally

Requires Node.js 20 or later.

```bash
cd frontend
npm install
npm run dev      # open the printed local URL
npm test         # 44 domain and scenario tests
npm run build    # static build in frontend/dist
```

Use the buttons at the top to switch between **Rider (Janelle)**, **Dispatcher (Frank)** and
**Driver**. **Reset demo** restores the seeded service day (simulated time 14:30). The
[quickstart](specs/001-same-day-changes/quickstart.md) lists scenarios to try. For example,
change Janelle's return trip to 16:30 (confirmed immediately), 15:45 (sent to the dispatcher)
or 15:15 (exceeds wheelchair capacity).