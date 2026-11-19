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
| 1 | GitHub Version 1 (goal model, spec, Spec Kit artifacts, source) | [`v1` branch](https://github.com/mattezwang/rfis_hw3_repo/tree/v1) |
| 2 | GitHub Version 2 | *To be added in Step 5* |
| 3 | Prototype V1 (deployed) | *Deployment URL to be added* |
| 4 | Prototype V2 (deployed) | *To be added in Step 5* |
| 5 | Requirements analysis and learning log | [docs/learning-log.md](docs/learning-log.md) *(to be written in Step 6)* |

## Where things are

| Path | Contents |
|---|---|
| [docs/goal-model.md](docs/goal-model.md) | Sprint scope selection (Step 1), overlaps, dependencies, conflicts and decisions (Step 2) |
| [docs/models/goal_model_sprint.py](docs/models/goal_model_sprint.py) | Sprint goal model (`goalmodeling` framework), with a [diagram link](docs/models/sprint-mermaid.txt) |
| [docs/models/hw2-baseline/](docs/models/hw2-baseline/) | Assignment 2 goal models, use cases and traceability matrix (the source of goal IDs) |
| [docs/interviews/](docs/interviews/) | Interview transcripts (Assignment 1) |
| [docs/v1-build-notes.md](docs/v1-build-notes.md) | Requirements observations logged while building V1, for the Step 4 evaluation |
| [.specify/memory/constitution.md](.specify/memory/constitution.md) | Spec Kit constitution: traceability, sprint boundary, preserving conflicts, spec before code |
| [specs/001-same-day-changes/](specs/001-same-day-changes/) | Spec Kit artifacts: [spec](specs/001-same-day-changes/spec.md), [plan](specs/001-same-day-changes/plan.md), [research](specs/001-same-day-changes/research.md), [data model](specs/001-same-day-changes/data-model.md), [contract](specs/001-same-day-changes/contracts/decision-module.md), [tasks](specs/001-same-day-changes/tasks.md), [analysis](specs/001-same-day-changes/analysis.md), [quickstart](specs/001-same-day-changes/quickstart.md) |
| [frontend/](frontend/) | Prototype source (React, TypeScript, Vite). Decision logic is in [frontend/src/domain/](frontend/src/domain/) |

## Run the prototype locally

Requires Node.js 20 or later.

```bash
cd frontend
npm install
npm run dev      # open the printed local URL
npm test         # 34 domain and scenario tests
npm run build    # static build in frontend/dist
```

Use the buttons at the top to switch between **Rider (Janelle)**, **Dispatcher (Frank)** and
**Driver**. **Reset demo** restores the seeded service day (simulated time starts at 14:30). The
[quickstart](specs/001-same-day-changes/quickstart.md) lists scenarios to try. For example,
change Janelle's return trip to 16:30 (confirmed immediately), 15:45 (sent to the dispatcher)
or 15:15 (exceeds wheelchair capacity).

## Roles and Responsibilities

| Member | Contributions |
|---|---|
| Matthew Wang | Sole member. Conducted the stakeholder interviews and built the goal models (Assignments 1 and 2). Selected the sprint scope, analysed goal relationships and made the conflict decisions. Directed and reviewed the Spec Kit artifacts and implementation produced with an AI coding agent (Claude Code, as permitted for this assignment), evaluated the prototypes, and wrote the learning log. |
