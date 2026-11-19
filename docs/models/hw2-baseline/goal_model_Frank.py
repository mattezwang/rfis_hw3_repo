"""
Goal model extracted from the Frank interview (dispatcher, 19 years).
Source: transcript-261028-2107.csv

Trace format, one block per goal:
    # G-n | goal type
    #   Frank HH:MM:SS "exact stakeholder words"
Goals with no source quote are marked NOT IN TRANSCRIPT and are highlighted
yellow in the diagram. Interviewer paraphrases were not used as sources:
  - "if the one rider cancels, then the other riders [are] updated" (00:51:58)
    overstates Frank, whose stated need is that drivers get updated manifests.

Vague terms and how they were interpreted:
  - "stable headway": even spacing between pickups along a run (G-39). Headway
    is a fixed-route term, so this reading is mine.
  - "clean manifests": no unresolved conflict when a run reaches the driver (G-51)
  - "the board": the dispatcher's single live view of runs (G-40, G-85)
  - "incompatible riders": riders whose mobility devices cannot share a vehicle at
    the same time (G-57)
  - "won't hold on the road": a run with one of the four conflicts in G-56 to G-59
  - "late or duplicate calls": rider notified after the fact or more than once (G-78)
  - "schedule at risk": any of the four early tells named at 00:45:27 (G-70). Frank
    gave no number for "too many same-day changes", so dispatch sets that limit.
  - "the right people in time": the drivers and riders affected by a change, before
    their next pickup (G-84)
"""
from goalmodeling.schema import *


def env(name):
    return [PerformanceLink(Agent(name, AgentType.ENVIRONMENT_AGENT), None)]


def sw(name):
    return [PerformanceLink(Agent(name, AgentType.SOFTWARE_AGENT), None)]


def highlight(diagram, vertices):
    ids = ",".join(v.get_node_id() for v in vertices)
    return diagram + f"\nclassDef yellow fill:#FFFF00,color:#000\nclass {ids} yellow\n"


# --- Building next-day runs ---

# G-48 | behavioral, functional
#   Frank 00:46:00 "requests have to be in by 5 p.m. the day before"
#   Frank 00:47:04 "reservation staff enter and change trips"
g48 = AchieveGoal("G-48: Trip request received by 5 p.m. the day before",
                  performs=env("ReservationStaff"), leaf=True)

# G-49 | behavioral, functional
#   Frank 00:46:00 "I review the trip queue, match mobility needs and vehicle capacity"
g49 = AchieveGoal("G-49: Trip matched to mobility needs and vehicle capacity <b>If</b> request in queue",
                  performs=env("Dispatcher"), leaf=True)

# G-52 | behavioral, functional
#   Frank 00:46:00 "then assign runs and drivers"
g52 = AchieveGoal("G-52: Run and driver assigned <b>If</b> trip matched",
                  performs=env("Dispatcher"), leaf=True)

# G-53 | behavioral, functional | NOT IN TRANSCRIPT: converse of G-52 found with H9
g53 = AchieveGoal("G-53: Trip removed and capacity released <b>If</b> trip cancelled",
                  performs=sw("DispatchBoard"), leaf=True)

# G-50 | behavioral, functional | NOT IN TRANSCRIPT: abstraction over G-52 and its converse G-53
g50 = MaintainGoal("G-50: Run assignments match active trips",
                   refinements=[Refinement(False, [g52, g53], "H9")])

# G-56 | behavioral, functional
#   Frank 00:46:39 "overloaded vehicle"
g56 = AchieveGoal("G-56: Conflict flagged <b>If</b> vehicle overloaded",
                  performs=sw("DispatchBoard"), leaf=True)

# G-57 | behavioral, functional
#   Frank 00:46:39 "incompatible riders"
g57 = AchieveGoal("G-57: Conflict flagged <b>If</b> riders incompatible",
                  performs=sw("DispatchBoard"), leaf=True)

# G-58 | behavioral, functional
#   Frank 00:46:39 "bad timing between legs"
g58 = AchieveGoal("G-58: Conflict flagged <b>If</b> timing between legs infeasible",
                  performs=sw("DispatchBoard"), leaf=True)

# G-59 | behavioral, functional
#   Frank 00:46:39 "a mobility detail that doesn’t match the assigned van"
g59 = AchieveGoal("G-59: Conflict flagged <b>If</b> mobility detail does not match van",
                  performs=sw("DispatchBoard"), leaf=True)

conflict_cases = DomainProperty("Run conflicts are overload, incompatibility, timing or mobility mismatch", leaf=True)

# G-54 | behavioral, functional
#   Frank 00:46:39 "flag the conflict before it gets to the driver"
g54 = AchieveGoal("G-54: Conflict flagged before run reaches driver",
                  refinements=[Refinement(True, [g56, g57, g58, g59, conflict_cases], "P2")])

# G-60 | behavioral, functional
#   Frank 00:46:39 "move a trip to another run"
g60 = AchieveGoal("G-60: Trip moved to another run",
                  performs=env("Dispatcher"), leaf=True)

# G-61 | behavioral, functional
#   Frank 00:46:39 "swap vehicles"
g61 = AchieveGoal("G-61: Vehicle swapped on run",
                  performs=env("Dispatcher"), leaf=True)

# G-62 | behavioral, functional
#   Frank 00:46:39 "adjust the shared route"
g62 = AchieveGoal("G-62: Shared route adjusted",
                  performs=env("Dispatcher"), leaf=True)

# G-55 | behavioral, functional; OR-refinement over the three fixes Frank named
#   Frank 00:46:39 "Then I can move a trip to another run, swap vehicles, or adjust the shared route"
g55 = AchieveGoal("G-55: Conflict resolved <b>If</b> conflict flagged",
                  refinements=[Refinement(False, [g60], "H4"),
                               Refinement(False, [g61], "H4"),
                               Refinement(False, [g62], "H4")])

# G-51 | behavioral, functional
#   Frank 00:46:00 "clean up anything that won’t hold on the road"
g51 = AchieveGoal("G-51: Run conflict cleared before run reaches driver",
                  refinements=[Refinement(False, [g54, g55], "P4")])

# G-45 | behavioral, functional
#   Frank 00:46:00 "so we can build the runs overnight"
g45 = AchieveGoal("G-45: Next-day runs built without conflicts",
                  refinements=[Refinement(False, [g48, g49, g50, g51], "P1")])

# --- Keeping drivers informed ---

# G-63 | behavioral, functional (information)
#   Frank 00:44:51 "They need the run manifest, pickup and drop-off windows, passenger mobility details, and any no-show or late-cancel updates"
g63 = AchieveGoal("G-63: Driver receives manifest, windows, mobility details and no-show and late-cancel updates",
                  performs=sw("DriverApp"), leaf=True)

# G-64 | behavioral, functional (stimulus-response)
#   Frank 00:49:55 "push updated manifests and notes straight to the driver"
#   Frank 00:50:52 "the driver needs the updated manifest and entrance notes"
g64 = AchieveGoal("G-64: Updated manifest and notes pushed to driver <b>If</b> change accepted",
                  performs=sw("DispatchBoard"), leaf=True)

# G-66 | behavioral, functional | NOT IN TRANSCRIPT: closes the loop so dispatch can monitor delivery
g66 = AchieveGoal("G-66: Driver acknowledges updated manifest",
                  performs=env("Driver"), leaf=True)

# G-67 | behavioral, functional | NOT IN TRANSCRIPT: converse of conditional goal G-64 found with H10
g67 = AvoidGoal("G-67: Driver manifest changed <b>If</b> change not accepted",
                performs=sw("DispatchBoard"), leaf=True)

# G-145 | behavioral, functional | NOT IN TRANSCRIPT: abstraction over G-64 and its converse G-67
g145 = MaintainGoal("G-145: Driver manifest matches accepted changes",
                    refinements=[Refinement(False, [g64, g67], "H10")])

# G-65 | behavioral, functional
#   Frank 00:49:55 "instead of making me chase people by phone"
#   Frank 00:50:52 "without waiting for me to make three phone calls"
g65 = CeaseGoal("G-65: Dispatcher phoning drivers to relay changes",
                refinements=[Refinement(False, [g145, g66], "H4")])

# G-46 | behavioral, functional (information)
#   Frank 00:52:07 "keep the drivers informed"
g46 = MaintainGoal("G-46: Drivers informed of current run",
                   refinements=[Refinement(False, [g63, g65], "H11")])

# G-47 | behavioral, functional | NOT IN TRANSCRIPT: expectation on the driver introduced by P7
g47 = MaintainGoal("G-47: Driver follows current manifest",
                   performs=env("Driver"), leaf=True)

# G-39 | behavioral, functional
#   Frank 00:45:27 "stable headway, clean manifests, and vehicles staying inside the pickup window"
g39 = MaintainGoal("G-39: Vehicles stay inside pickup window with stable headway",
                   refinements=[Refinement(False, [g45, g46, g47], "P7")])

# --- Keeping the board accurate ---

# G-68 | behavioral, functional
#   Frank 00:49:55 "their road notes need to come back into the system, not disappear in a radio call"
g68 = AchieveGoal("G-68: Driver road notes captured in system",
                  performs=env("Driver"), leaf=True)

# G-69 | behavioral, functional (information)
#   Frank 00:44:51 "whether a driver is getting held up on the previous leg"
g69 = AchieveGoal("G-69: Driver delay on previous leg shown on board",
                  performs=sw("DispatchBoard"), leaf=True)

# G-70 | behavioral, functional (stimulus-response)
#   Frank 00:45:27 "Early tells are late pull-outs, stacked exceptions, a driver falling behind on the first legs, or too many same-day changes hitting the board"
g70 = AchieveGoal("G-70: Early warning shown <b>If</b> schedule at risk",
                  performs=sw("DispatchBoard"), leaf=True)

# G-71 | behavioral, functional
#   Frank 00:44:21 "before I hand everything off to the next dispatcher"
g71 = AchieveGoal("G-71: Board state handed to next dispatcher at shift end",
                  performs=env("Dispatcher"), leaf=True)

# G-77 | behavioral, non-functional (integrity)
#   Frank 00:47:38 "keep a clear record of who made it and when"
#   Frank 00:49:55 "we need to know exactly what was changed and when"
g77 = MaintainGoal("G-77: Change history records who changed what and when",
                   performs=sw("DispatchBoard"), leaf=True)

# G-40 | behavioral, non-functional (accuracy)
#   Frank 00:52:07 "Keep the board accurate"
g40 = MaintainGoal("G-40: Board accurate throughout shift and at handoff",
                   refinements=[Refinement(False, [g68, g69, g71, g77], "H4")])

# --- Same-day changes ---

# G-75 | behavioral, functional (information)
#   Frank 00:47:38 "show me every rider and window that gets hit before I accept the change"
g75 = AchieveGoal("G-75: Every affected rider and window shown",
                  performs=sw("DispatchBoard"), leaf=True)

# G-76 | behavioral, functional (information)
#   Frank 00:49:55 "with capacity, mobility needs, and pickup windows all visible together"
g76 = MaintainGoal("G-76: Capacity, mobility needs and pickup windows visible together",
                   performs=sw("DispatchBoard"), leaf=True)

# G-72 | behavioral, functional (information)
#   Frank 00:49:55 "one board that shows the whole route impact before I commit a change"
g72 = AchieveGoal("G-72: Whole route impact shown <b>If</b> same-day change requested",
                  refinements=[Refinement(False, [g75, g76], "P5")])

# G-74 | behavioral, functional
#   Frank 00:47:38 "before I accept the change"
g74 = AchieveGoal("G-74: Change applied <b>If</b> dispatcher accepts after seeing impact",
                  performs=env("Dispatcher"), leaf=True)

# G-73 | behavioral, functional; G-72 is the guard that must hold before G-74
#   Frank 00:50:52 "I’d still need control over same-day changes, vehicle capacity, and shared routes"
g73 = MaintainGoal("G-73: Dispatcher controls same-day changes, capacity and shared routes",
                   refinements=[Refinement(False, [g72, g74], "P4")])

# G-78 | behavioral, functional
#   Frank 00:48:57 "riders get late or duplicate calls"
g78 = AvoidGoal("G-78: Late or duplicate calls to riders <b>If</b> trip changes",
                performs=sw("NotificationService"), leaf=True)

# G-81 | behavioral, functional
#   Frank 00:48:20 "I had to resequence the manifests, move one ambulatory rider, and call the driver"
g81 = AchieveGoal("G-81: Manifests resequenced <b>If</b> trip added after runs built",
                  performs=env("Dispatcher"), leaf=True)

# G-84 | behavioral, non-functional (performance) | NOT IN TRANSCRIPT: rewritten with my reading of "right people" and "in time"
#   Frank 00:51:24 "information not reaching the right people in time"
g84 = AvoidGoal("G-84: Change failing to reach affected drivers and riders before their next pickup",
                performs=sw("DispatchBoard"), leaf=True)

# G-41 | behavioral, functional
#   Frank 00:47:38 "Same-day changes are where the board starts to unravel"
#   Frank 00:48:57 "move one passenger and you may trigger a resequence, a vehicle swap, and new pickup-window risks for everyone downstream"
g41 = AchieveGoal("G-41: Same-day change applied without cascading delay",
                  refinements=[Refinement(False, [g73, g78, g81, g70, g84], "H4")])

# --- No-show patterns ---

# G-82 | behavioral, functional | NOT IN TRANSCRIPT: data needed before patterns can be shown
g82 = AchieveGoal("G-82: No-show and late-cancel events recorded per rider",
                  performs=sw("DispatchBoard"), leaf=True)

# G-83 | behavioral, functional (information)
#   Frank 00:49:55 "so we can spot patterns instead of treating every one like a surprise"
g83 = AchieveGoal("G-83: Repeat patterns reported to dispatcher",
                  performs=sw("DispatchBoard"), leaf=True)

# G-42 | behavioral, functional (information)
#   Frank 00:49:55 "give me a better view of repeated no-shows and late cancels"
g42 = AchieveGoal("G-42: Repeated no-show and late-cancel patterns visible",
                  refinements=[Refinement(False, [g82, g83], "H3")])

# --- Rider self-service ---

# G-79 | behavioral, functional (information)
#   Frank 00:50:52 "The rider should see what they’re changing"
g79 = AchieveGoal("G-79: Rider sees effect of change before submitting",
                  performs=sw("TripPortal"), leaf=True)

# G-80 | behavioral, functional
#   Frank 00:50:52 "it could cut down the routine calls"
g80 = AchieveGoal("G-80: Rider makes routine changes without calling",
                  performs=env("Rider"), leaf=True)

# G-43 | soft, non-functional
#   Frank 00:50:52 "it could cut down the routine calls"
g43 = SoftGoal("G-43: Reduce routine calls to dispatch",
               refinements=[Refinement(False, [g79, g80], "H8")])

# --- Usability of the new system ---

# G-85 | behavioral, non-functional (usability)
#   Frank 00:49:55 "I’d want one board"
g85 = MaintainGoal("G-85: All route data on one board",
                   performs=sw("DispatchBoard"), leaf=True)

# G-44 | soft, non-functional (usability)
#   Frank 00:51:24 "If the system’s wrong or too complicated, it’ll just move the confusion from the phone to the screen."
g44 = SoftGoal("G-44: Improve ease of use so confusion does not move to the screen",
               refinements=[Refinement(False, [g85, g76], "H3")])

# G-38 | soft, non-functional
#   Frank 00:45:27 "A good day is stable headway, clean manifests, and vehicles staying inside the pickup window without capacity conflicts"
#   Frank 00:47:04 "trying to keep the runs from unraveling"
g38 = SoftGoal("G-38: Improve stability of daily runs",
               refinements=[Refinement(False, [g39, g40, g41, g42, g43, g44], "H12")])

# --- Obstacles ---

# O-3
#   Frank 00:50:52 "if riders change a trip without seeing the route impact, I’d spend more time cleaning up the damage"
o3 = Obstacle("O-3: Rider changes trip without seeing route impact")

# O-4
#   Frank 00:48:20 "we had a power-chair trip added after the runs were built"
o4 = Obstacle("O-4: Trip added after runs built creates capacity conflict")

links = [ObstructionLink(g41, o3), ResolutionLink(g79, o3),
         ObstructionLink(g41, o4), ResolutionLink(g81, o4)]

not_in_transcript = [g47, g50, g53, g66, g67, g82, g84, g145]

output = highlight(generate_graph([g38], links), not_in_transcript)
link = generate_pako_link(output, "edit", config={"theme": "neutral"})

if __name__ == "__main__":
    print(output)
    print(link)
