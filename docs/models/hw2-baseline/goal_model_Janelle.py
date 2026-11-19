"""
Goal model extracted from the Janelle interview (rider, five trips a week).
Source: transcript-261028-2107 (1).csv

Trace format, one block per goal:
    # G-n | goal type
    #   Janelle HH:MM:SS "exact stakeholder words"
Goals with no source quote are marked NOT IN TRANSCRIPT and are highlighted
yellow in the diagram. Interviewer paraphrases were not used as sources:
  - "your caretaker not being able to ride" (00:37:06) was never said. Janelle
    said the attendant rides free and that the driver should know this.
  - "call and book rides yourself" (00:38:21) was corrected by Janelle to
    booking and changing rides online (00:38:44).

Vague terms and how they were interpreted:
  - "trustworthy" arrival estimate: within 5 minutes of actual arrival (G-25)
  - "immediate" confirmation: within 1 minute of submission (G-19)
  - "accessible enough": conforms to WCAG 2.1 AA (G-36)
  - "deploy my ramp" (00:33:55): read as the vehicle ramp or lift, since Janelle
    also asks for "the right lift"
"""
from goalmodeling.schema import *


def env(name):
    return [PerformanceLink(Agent(name, AgentType.ENVIRONMENT_AGENT), None)]


def sw(name):
    return [PerformanceLink(Agent(name, AgentType.SOFTWARE_AGENT), None)]


def highlight(diagram, vertices):
    ids = ",".join(v.get_node_id() for v in vertices)
    return diagram + f"\nclassDef yellow fill:#FFFF00,color:#000\nclass {ids} yellow\n"


# --- Getting home for the attendant visit ---

# G-6 | behavioral, functional | NOT IN TRANSCRIPT: milestone needed so the return trip targets the visit time
g6 = AchieveGoal("G-6: Return trip booked to arrive before attendant visit",
                 performs=env("Rider"), leaf=True)

# G-7 | behavioral, functional
#   Janelle 00:34:32 "A good trip is when the van arrives within the window"
g7 = AchieveGoal("G-7: Van arrives within pickup window <b>If</b> trip booked",
                 performs=env("Driver"), leaf=True)

# G-8 | behavioral, functional | NOT IN TRANSCRIPT: final milestone completing the P1 refinement of G-2
g8 = AchieveGoal("G-8: Rider home before attendant visit <b>If</b> picked up within window",
                 performs=env("Driver"), leaf=True)

# G-2 | behavioral, functional
#   Janelle 00:37:23 "I can miss my attendant’s evening visit and lose the support I rely on after work"
#   Janelle 00:37:58 "make it home in time for my attendant’s evening visit"
g2 = AchieveGoal("G-2: Rider home in time for attendant evening visit",
                 refinements=[Refinement(False, [g6, g7, g8], "P1")])

# --- Managing trips online ---

# G-15 | behavioral, functional
#   Janelle 00:30:59 "I usually call the day before to book both my morning trip to work and my return trip home"
g15 = AchieveGoal("G-15: Morning and return trips booked in one request the day before",
                  performs=env("Rider"), leaf=True)

# G-16 | behavioral, functional | NOT IN TRANSCRIPT: saved details are my refinement of "give them my work and home details"
g16 = AchieveGoal("G-16: Home and work details saved for reuse",
                  performs=sw("TripPortal"), leaf=True)

# G-11 | behavioral, functional
#   Janelle 00:36:15 "book and change rides myself without sitting on hold"
g11 = AchieveGoal("G-11: Rider books trip online",
                  refinements=[Refinement(False, [g15, g16], "H4")])

# G-12 | behavioral, functional
#   Janelle 00:32:01 "once my workday ended early, I needed to change my pickup that same day"
g12 = AchieveGoal("G-12: Rider changes pickup online <b>If</b> workday ends early",
                  performs=env("Rider"), leaf=True)

# G-13 | behavioral, functional
#   Janelle 00:32:01 "I’d want to update or cancel the ride online"
g13 = AchieveGoal("G-13: Rider cancels ride online <b>If</b> ride no longer needed",
                  performs=env("Rider"), leaf=True)

# G-17 | behavioral, functional
#   Janelle 00:32:01 "see whether the change is accepted, and get an immediate confirmation"
g17 = AchieveGoal("G-17: Rider shown confirmation <b>If</b> change accepted",
                  performs=sw("TripPortal"), leaf=True)

# G-18 | behavioral, functional | NOT IN TRANSCRIPT: other case of the P3 split on G-14
g18 = AchieveGoal("G-18: Rider shown reason <b>If</b> change not accepted",
                  performs=sw("TripPortal"), leaf=True)

# G-19 | behavioral, non-functional (performance) | NOT IN TRANSCRIPT: my interpretation of "immediate"
g19 = MaintainGoal("G-19: Outcome shown within 1 minute of submission",
                   performs=sw("TripPortal"), leaf=True)

change_outcomes = DomainProperty("Every submitted change is either accepted or not accepted", leaf=True)

# G-14 | behavioral, functional (information)
#   Janelle 00:32:01 "see whether the change is accepted, and get an immediate confirmation instead of guessing what happened"
g14 = AchieveGoal("G-14: Rider sees outcome immediately <b>If</b> change submitted",
                  refinements=[Refinement(True, [g17, g18, change_outcomes], "P3")])

# G-9 | behavioral, functional
#   Janelle 00:38:44 "I want to book and change rides online, not keep calling to do it myself"
g9 = AchieveGoal("G-9: Rider manages own trips online",
                 refinements=[Refinement(False, [g11, g12, g13, g14, g19], "H7")])

# --- Knowing where the van is ---

# G-20 | behavioral, functional (information)
#   Janelle 00:32:48 "I don’t know where the vehicle is or how delayed it is"
g20 = AchieveGoal("G-20: Rider views live van location on demand",
                  performs=sw("TripPortal"), leaf=True)

# G-21 | behavioral, functional (information) | NOT IN TRANSCRIPT: push alternative to G-20 (H6)
g21 = AchieveGoal("G-21: Rider receives alerts as van approaches",
                  performs=sw("NotificationService"), leaf=True)

# G-23 | behavioral, non-functional (accuracy) | NOT IN TRANSCRIPT: accuracy goal introduced by P6
g23 = MaintainGoal("G-23: Tracked van position matches actual position",
                   performs=env("VehicleGPS"), leaf=True)

# G-24 | behavioral, functional
#   Janelle 00:36:15 "see when the van will actually arrive—not just a broad pickup window"
g24 = AchieveGoal("G-24: Arrival estimate computed from tracked van position",
                  performs=sw("ETAService"), leaf=True)

# G-25 | behavioral, non-functional (accuracy) | NOT IN TRANSCRIPT: my interpretation of "trustworthy"
g25 = MaintainGoal("G-25: Arrival estimate within 5 minutes of actual arrival",
                   performs=sw("ETAService"), leaf=True)

# G-22 | behavioral, functional (information)
#   Janelle 00:37:58 "see a trustworthy arrival estimate for my return trip"
g22 = AchieveGoal("G-22: Trustworthy arrival estimate available",
                  refinements=[Refinement(False, [g23, g24, g25], "P6")])

# G-27 | behavioral, functional | NOT IN TRANSCRIPT: mitigation found by analyzing obstacle O-1
g27 = AchieveGoal("G-27: Rider alerted <b>If</b> van predicted outside pickup window",
                  performs=sw("NotificationService"), leaf=True)

# G-26 | behavioral, functional
#   Janelle 00:34:32 "I’m left calling dispatch for answers"
g26 = AvoidGoal("G-26: Rider left without information <b>If</b> van runs late",
                refinements=[Refinement(False, [g27], "H8")])

# G-10 | behavioral, functional (information); OR-refinement, pull versus push
#   Janelle 00:36:47 "make decisions based on the actual vehicle status instead of standing outside and hoping the van shows up"
g10 = AchieveGoal("G-10: Rider knows actual vehicle status while waiting",
                  refinements=[Refinement(False, [g20, g22, g26], "H6"),
                               Refinement(False, [g21, g22, g26], "H6")])

# G-3 | soft, non-functional
#   Janelle 00:36:47 "avoid wasting time on hold"
#   Janelle 00:32:20 "Usually about 20 minutes, sometimes longer."
g3 = SoftGoal("G-3: Reduce rider time on hold",
              refinements=[Refinement(False, [g9, g10], "H4")])

# --- Boarding ---

# G-31 | behavioral, functional | NOT IN TRANSCRIPT: guard introduced by P4; a stored profile is my inference
g31 = AchieveGoal("G-31: Chair size and lift needs on file <b>If</b> trip booked",
                  performs=env("Rider"), leaf=True)

# G-32 | behavioral, functional
#   Janelle 00:33:55 "I need a vehicle with the right lift and enough room; not every van can accommodate it"
g32 = AchieveGoal("G-32: Vehicle with right lift and room assigned <b>If</b> chair needs on file",
                  performs=sw("SchedulingModule"), leaf=True)

# G-28 | behavioral, functional
#   Janelle 00:38:44 "match me with a vehicle that can actually accommodate my chair"
g28 = AchieveGoal("G-28: Compatible vehicle assigned <b>If</b> trip booked",
                  refinements=[Refinement(False, [g31, g32], "P4")])

# G-33 | behavioral, functional | NOT IN TRANSCRIPT: mitigation found by analyzing obstacle O-2
g33 = AchieveGoal("G-33: Replacement vehicle sent <b>If</b> assigned vehicle cannot accommodate chair",
                  performs=env("Dispatcher"), leaf=True)

# G-34 | behavioral, functional (information)
#   Janelle 00:33:55 "They need to know the correct pickup location"
g34 = AchieveGoal("G-34: Driver given correct pickup location",
                  performs=sw("DriverApp"), leaf=True)

# G-35 | behavioral, functional (information)
#   Janelle 00:33:55 "the driver should know that person rides with me at no charge under the program rules"
g35 = AchieveGoal("G-35: Driver told attendant rides at no charge <b>If</b> attendant accompanies rider",
                  performs=sw("DriverApp"), leaf=True)

# Domain property
#   Janelle 00:33:55 "rides with me at no charge under the program rules"
attendant_free = DomainProperty("Attendant rides at no charge under program rules", leaf=True)

# G-29 | behavioral, functional
#   Janelle 00:34:32 "the driver is prepared"
g29 = AchieveGoal("G-29: Driver prepared before pickup",
                  refinements=[Refinement(False, [g34, g35, attendant_free], "H4")])

# G-30 | behavioral, non-functional (safety)
#   Janelle 00:33:55 "give me enough space to deploy my ramp and board safely, without rushing me"
g30 = MaintainGoal("G-30: Driver gives rider space and time to deploy ramp and board",
                   performs=env("Driver"), leaf=True)

# G-4 | behavioral, non-functional (safety)
#   Janelle 00:34:32 "I board without being rushed"
g4 = AchieveGoal("G-4: Rider boards assigned vehicle safely without rushing",
                 refinements=[Refinement(False, [g28, g29, g30, g33], "H5")])

# --- Independent use ---

# G-36 | behavioral, non-functional (usability) | NOT IN TRANSCRIPT: my interpretation of "accessible enough"
g36 = MaintainGoal("G-36: Rider portal conforms to WCAG 2.1 AA",
                   performs=sw("TripPortal"), leaf=True)

# G-37 | behavioral, non-functional (usability)
#   Janelle 00:36:15 "accessible enough that I can use it independently"
g37 = AchieveGoal("G-37: Rider completes trip tasks without staff help",
                  performs=env("Rider"), leaf=True)

# G-5 | soft, non-functional (usability)
#   Janelle 00:36:15 "It needs to be accessible enough that I can use it independently"
g5 = SoftGoal("G-5: Maximize rider ability to use system independently",
              refinements=[Refinement(False, [g36, g37], "H3")])

# G-1 | soft, non-functional
#   Janelle 00:36:15 "reliable enough that I’m not worrying about whether I’ll get home after work"
#   Janelle 00:36:47 "plan my workday and my trip home with less uncertainty"
g1 = SoftGoal("G-1: Improve rider independence and certainty on daily trips",
              refinements=[Refinement(False, [g2, g3, g4, g5], "H12")])

# --- Obstacles ---

# O-1
#   Janelle 00:35:04 "late arrivals beyond the pickup window"
o1 = Obstacle("O-1: Van late beyond pickup window")

# O-2
#   Janelle 00:34:32 "the vehicle can’t accommodate my chair"
o2 = Obstacle("O-2: Assigned vehicle cannot accommodate chair")

links = [ObstructionLink(g7, o1), ResolutionLink(g26, o1),
         ObstructionLink(g28, o2), ResolutionLink(g33, o2)]

not_in_transcript = [g6, g8, g16, g18, g19, g21, g23, g25, g27, g31, g33, g36]

output = highlight(generate_graph([g1], links), not_in_transcript)
link = generate_pako_link(output, "edit", config={"theme": "neutral"})

if __name__ == "__main__":
    print(output)
    print(link)
