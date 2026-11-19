"""
Sprint goal model for Assignment 3 (V1): same-day trip changes and cancellations.

Derived from hw2-baseline/goal_model_combined.py. Running this file writes
sprint-mermaid.txt next to it. The analysis behind every change is in
../goal-model.md, Step 2.

GOAL IDS
  Goal IDs, conflict IDs (C-n) and obstacle IDs (O-n) are kept from the combined
  model so every goal stays traceable to the quotes recorded in the individual
  models. New in Assignment 3:
    G-146  Change declined with reason                      inferred (H10 on G-74)
    G-148  Minimize driver disruption from mid-run changes  STATED, missed in Assignment 2
             Frank 00:48:57 "Drivers get frustrated when the lift schedule and
             passenger notes change mid-run"
    G-149  Changed stops marked on manifest                 inferred, resolves C-8
    C-7    G-9 x G-41   self-service raises same-day change volume   UNRESOLVED
    C-8    G-64 x G-148 pushing every accepted change mid-run        compromise G-149

GOALS REWRITTEN FOR THE SPRINT (combined-model text -> sprint text)
  G-12   "...If workday ends early" -> "...If plans change on day of trip"
         Janelle's early finish was her example, not a limit. She asked to
         "change rides myself" in general (00:36:15).
  G-67   "...If change not accepted" -> "...If change pending or declined"
         A pending change has not been accepted, so the manifest must not move.
  G-126  "...If no other rider window or capacity affected" ->
  G-127  the concrete test chosen for "affected" (decision on C-1, assumption A-3).

COLOUR KEY (classDef at the end of the diagram)
  green   in sprint scope, stated in a transcript
  yellow  in sprint scope, not stated in any transcript (Assignment 2 convention)
  blue    parent goal the sprint contributes to but does not complete
  grey    outside the sprint boundary (deferred, kept for context)
  red border  new or rewritten in Assignment 3

Deferred subtrees are collapsed to a single grey goal. Their full refinement is
unchanged in the combined model.
"""
from pathlib import Path

from goalmodeling.schema import *


def env(name):
    return [PerformanceLink(Agent(name, AgentType.ENVIRONMENT_AGENT), None)]


def sw(name):
    return [PerformanceLink(Agent(name, AgentType.SOFTWARE_AGENT), None)]


# ---------------------------------------------------------------- rider side

g11 = AchieveGoal("G-11: Rider books trip online")                       # deferred
g12 = AchieveGoal("G-12: Rider changes pickup time online <b>If</b> plans change on day of trip",
                  performs=env("Rider"), leaf=True)
g13 = AchieveGoal("G-13: Rider cancels ride online <b>If</b> ride no longer needed",
                  performs=env("Rider"), leaf=True)

g17 = AchieveGoal("G-17: Rider shown confirmation <b>If</b> change accepted",
                  performs=sw("TripPortal"), leaf=True)
g18 = AchieveGoal("G-18: Rider shown reason <b>If</b> change not accepted",
                  performs=sw("TripPortal"), leaf=True)
g128 = AchieveGoal("G-128: Rider shown pending status <b>If</b> change awaits dispatcher",
                   performs=sw("TripPortal"), leaf=True)
change_outcomes = DomainProperty("Every submitted change is accepted, not accepted or pending", leaf=True)
g14 = AchieveGoal("G-14: Rider sees outcome or pending status immediately <b>If</b> change submitted",
                  refinements=[Refinement(True, [g17, g18, g128, change_outcomes], "P3")])
g19 = MaintainGoal("G-19: Outcome or pending status shown within 1 minute of submission",
                   performs=sw("TripPortal"), leaf=True)

g130 = MaintainGoal("G-130: Rider shown only own new window and approval need",
                    performs=sw("TripPortal"), leaf=True)
g79 = AchieveGoal("G-79: Rider sees effect of change before submitting",
                  refinements=[Refinement(False, [g130], "H4")])

g9 = AchieveGoal("G-9: Rider manages own trips online and makes routine changes without calling",
                 refinements=[Refinement(False, [g11, g12, g13, g14, g19, g79], "H7")])

g10 = AchieveGoal("G-10: Rider knows actual vehicle status while waiting")   # deferred
g3 = SoftGoal("G-3: Reduce avoidable phone calls, call-center transactions and rider hold time",
              refinements=[Refinement(False, [g9, g10], "H4")])

g36 = MaintainGoal("G-36: Rider portal conforms to WCAG 2.1 AA",
                   performs=sw("TripPortal"), leaf=True)
g37 = AchieveGoal("G-37: Rider completes trip tasks without staff help",
                  performs=env("Rider"), leaf=True)

# ---------------------------------------------------------- dispatcher side

g75 = AchieveGoal("G-75: Every affected rider and window shown",
                  performs=sw("DispatchBoard"), leaf=True)
g76 = MaintainGoal("G-76: Capacity, mobility needs and pickup windows visible together on one board",
                   performs=sw("DispatchBoard"), leaf=True)
g132 = AchieveGoal("G-132: Overtime and deadhead effect of a fix shown with route impact")  # deferred
g72 = AchieveGoal("G-72: Whole route impact shown <b>If</b> same-day change affects another rider window or capacity",
                  refinements=[Refinement(False, [g75, g76, g132], "P5")])

g74 = AchieveGoal("G-74: Change applied <b>If</b> dispatcher accepts after seeing impact",
                  performs=env("Dispatcher"), leaf=True)
# G-146 | NEW, inferred | converse of conditional goal G-74 (H10). G-18 cannot be
# satisfied for a dispatcher decision unless the dispatcher supplies the reason.
g146 = AchieveGoal("G-146: Change declined with reason <b>If</b> dispatcher rejects after seeing impact",
                   performs=env("Dispatcher"), leaf=True)
g73 = MaintainGoal("G-73: Dispatcher controls same-day changes that affect other riders, capacity or shared routes",
                   refinements=[Refinement(False, [g72, g74, g146], "P4")])

# ------------------------------------------------- deciding a change (C-1)

g126 = AchieveGoal("G-126: Change accepted automatically <b>If</b> no other pickup pushed outside its window and no vehicle capacity exceeded",
                   performs=sw("DispatchBoard"), leaf=True)
g127 = AchieveGoal("G-127: Change routed to dispatcher <b>If</b> another pickup pushed outside its window or vehicle capacity exceeded",
                   performs=sw("DispatchBoard"), leaf=True)
impact_cases = DomainProperty("A change either pushes another pickup outside its window or exceeds capacity, or it does neither", leaf=True)
cancel_safe = DomainProperty("Removing a stop never pushes a later pickup outside its window (A-4)", leaf=True)
g125 = AchieveGoal("G-125: Same-day change decided by route impact <b>If</b> rider submits change",
                   refinements=[Refinement(True, [g126, g127, impact_cases, cancel_safe], "P3")])

# ------------------------------------------------------ effect on the run

g64 = AchieveGoal("G-64: Updated manifest and notes pushed to driver <b>If</b> change accepted",
                  performs=sw("DispatchBoard"), leaf=True)
g67 = AvoidGoal("G-67: Driver manifest changed <b>If</b> change pending or declined",
                performs=sw("DispatchBoard"), leaf=True)
g145 = MaintainGoal("G-145: Driver manifest matches accepted changes",
                    refinements=[Refinement(False, [g64, g67], "H10")])
g66 = AchieveGoal("G-66: Driver acknowledges updated manifest")             # deferred
g65 = CeaseGoal("G-65: Dispatcher phoning drivers to relay changes",
                refinements=[Refinement(False, [g145, g66], "H4")])
g29 = MaintainGoal("G-29: Driver prepared and informed of current run",
                   refinements=[Refinement(False, [g65], "H11")])

# G-149 | NEW, inferred | resolves C-8 as a compromise
g149 = AchieveGoal("G-149: Changed stops marked on manifest with time of change",
                   performs=sw("DriverApp"), leaf=True)
# G-148 | NEW, STATED | Frank 00:48:57; missed in Assignment 2
g148 = SoftGoal("G-148: Minimize driver disruption from mid-run manifest changes",
                refinements=[Refinement(False, [g149], "H8")])

g52 = AchieveGoal("G-52: Run and driver assigned <b>If</b> trip matched")   # deferred (mock data)
g53 = AchieveGoal("G-53: Trip removed and capacity released <b>If</b> trip cancelled",
                  performs=sw("DispatchBoard"), leaf=True)
g50 = MaintainGoal("G-50: Run assignments match active trips",
                   refinements=[Refinement(False, [g52, g53], "H9")])
g45 = AchieveGoal("G-45: Next-day runs cut accurately and built without conflicts",
                  refinements=[Refinement(False, [g50], "P1")])
g7 = AchieveGoal("G-7: Van arrives within pickup window with stable headway and on-time performance <b>If</b> trip booked",
                 refinements=[Refinement(False, [g45, g29], "P7")])

# ----------------------------------------------------------- run stability

g77 = MaintainGoal("G-77: Change history records who changed what and when",
                   performs=sw("DispatchBoard"), leaf=True)
g68 = AchieveGoal("G-68: Driver road notes captured in system")            # deferred
g40 = MaintainGoal("G-40: Board accurate throughout shift and at handoff",
                   refinements=[Refinement(False, [g77, g68], "H4")])

g27 = AchieveGoal("G-27: Rider alerted once, before the pickup window opens, <b>If</b> van predicted outside window or trip changes")  # deferred
g70 = AchieveGoal("G-70: Early warning shown <b>If</b> schedule at risk")   # deferred
g41 = AchieveGoal("G-41: Same-day change applied without cascading delay",
                  refinements=[Refinement(False, [g73, g125, g148, g27, g70], "H4")])

g42 = AchieveGoal("G-42: Repeated no-show and late-cancel patterns visible")  # deferred
g38 = SoftGoal("G-38: Improve stability of daily runs",
               refinements=[Refinement(False, [g7, g40, g41, g42], "H12")])

# ------------------------------------------------------------ rider goals

g2 = AchieveGoal("G-2: Rider home in time for attendant evening visit")     # deferred
g4 = AchieveGoal("G-4: Rider boards assigned vehicle safely without rushing")  # deferred
g5 = SoftGoal("G-5: Maximize ability of riders and staff to use system independently and without confusion",
              refinements=[Refinement(False, [g36, g37, g76], "H3")])
g1 = SoftGoal("G-1: Improve rider independence and certainty on daily trips",
              refinements=[Refinement(False, [g2, g3, g4, g5], "H12")])

g129 = AvoidGoal("G-129: Other riders' trip or mobility details disclosed to riders",
                 refinements=[Refinement(False, [g130], "H8")])

# ----------------------------------------------- budget manager (context)

g98 = AchieveGoal("G-98: Reservation, dispatch, trip, cancellation and no-show records linked and recorded per rider")  # deferred
g103 = AchieveGoal("G-103: Trip-level cost allocation data available",
                   refinements=[Refinement(False, [g98], "P5")])
g90 = CeaseGoal("G-90: Manual reconciliation in variance analysis",
                refinements=[Refinement(False, [g103], "H4")])
g109 = SoftGoal("G-109: Minimize cost per passenger trip",
                refinements=[Refinement(False, [g3], "H4")])
g93 = SoftGoal("G-93: Maximize favorable variance on cost per trip, overtime and invoices",
               refinements=[Refinement(False, [g109], "H4")])
g86 = SoftGoal("G-86: Maximize responsible use of public funds while keeping service compliant",
               refinements=[Refinement(False, [g93, g90], "H12")])

g124 = SoftGoal("G-124: Maximize reliable, compliant and cost-responsible paratransit service",
                refinements=[Refinement(False, [g1, g38, g86, g129], "H12")])

# ---------------------------------------------------------------- obstacles

o3 = Obstacle("O-3: Rider changes trip without seeing route impact")

links = [ObstructionLink(g41, o3), ResolutionLink(g79, o3),
         ConflictLink(g14, g73),     # C-1  compromise G-125..G-128, unvalidated
         ConflictLink(g79, g129),    # C-2  resolved by G-130
         ConflictLink(g9, g41),      # C-7  NEW, unresolved
         ConflictLink(g64, g148)]    # C-8  NEW, compromise G-149

# ------------------------------------------------------------------ styling

scope_stated = [g12, g13, g17, g37, g74, g75, g76, g77, g79, g64, g148]
scope_inferred = [g14, g18, g19, g36, g53, g67, g72, g73, g125, g126, g127,
                  g128, g129, g130, g145, g146, g149]
partial = [g1, g3, g5, g9, g29, g38, g40, g41, g50, g65, g7, g45, g124]
deferred = [g2, g4, g10, g11, g27, g42, g52, g66, g68, g70, g98, g103, g90,
            g109, g93, g86, g132]
changed = [g12, g67, g126, g127, g146, g148, g149]


def style(diagram):
    def ids(vs):
        return ",".join(v.get_node_id() for v in vs)
    return diagram + "\n".join([
        "classDef stated fill:#C8E6C9,color:#000",
        "classDef yellow fill:#FFFF00,color:#000",
        "classDef partial fill:#DCEBFA,color:#000",
        "classDef deferred fill:#EEEEEE,color:#777,stroke:#AAA,stroke-dasharray:4 3",
        "classDef changed stroke:#D32F2F,stroke-width:4",
        f"class {ids(scope_stated)} stated",
        f"class {ids(scope_inferred)} yellow",
        f"class {ids(partial)} partial",
        f"class {ids(deferred)} deferred",
        f"class {ids(changed)} changed",
    ]) + "\n"


def mermaid_live_link(text, mode="edit"):
    """Same encoding as goalmodeling's generate_pako_link, except the Mermaid config
    is sent as a JSON string. mermaid.live now rejects the config as a nested object
    ('"[object Object]" is not valid JSON'), which leaves the diagram blank."""
    import base64
    import json
    import zlib
    state = {"code": text, "mermaid": json.dumps({"theme": "neutral"})}
    c = zlib.compressobj(9, zlib.DEFLATED, 15, 8, zlib.Z_DEFAULT_STRATEGY)
    data = c.compress(json.dumps(state).encode("utf-8")) + c.flush()
    return f"https://mermaid.live/{mode}#pako:" + base64.b64encode(data, b"-_").decode("utf-8")


output = style(generate_graph([g124], links))
link = mermaid_live_link(output)

BEGIN = "<!-- BEGIN sprint goal model (generated by docs/models/goal_model_sprint.py) -->"
END = "<!-- END sprint goal model -->"


def embed_in_markdown(md_path):
    """Writes the diagram into goal-model.md between the markers, so GitHub renders it."""
    text = md_path.read_text(encoding="utf-8")
    start, end = text.index(BEGIN), text.index(END)
    block = f"{BEGIN}\n```mermaid\n{output.strip()}\n```\n"
    md_path.write_text(text[:start] + block + text[end:], encoding="utf-8")


if __name__ == "__main__":
    print(output)
    print(link)
    here = Path(__file__).parent
    (here / "sprint-mermaid.txt").write_text(link + "\n", encoding="utf-8")
    embed_in_markdown(here.parent / "goal-model.md")
