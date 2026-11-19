"""
Combined goal model merging goal_model_Janelle.py, goal_model_Frank.py and
goal_model_Diane.py. Running this file also writes mermaid.txt.

Goal IDs are kept from the individual models so each goal stays traceable to the
source quotes recorded there. G-124 to G-136 exist only in this model. G-137 to
G-144 come from the Diane model and G-145 from the Frank model. Goals highlighted
yellow are not stated in any transcript.

REDUNDANCIES (retained goal <- merged goals, retained goal rewritten to cover both)
  G-3  <- G-43, G-117  Rider hold time, routine calls and call-center transactions
                       are one concern seen from three roles
  G-5  <- G-44         Independent use by riders; no confusion for staff
  G-7  <- G-39, G-88   Arrival in window, stable headway, stable on-time performance
  G-27 <- G-78         Delay alerts must also not be late or duplicated
  G-29 <- G-46         A prepared driver is an informed driver
  G-32 <- G-49         Vehicle matching described by rider and by dispatcher
  G-45 <- G-118        Frank's run building is Diane's run-cutting
  G-61 <- G-33         Replacing an unsuitable vehicle is a vehicle swap
  G-63 <- G-34         The manifest carries the pickup location
  G-76 <- G-85         "One board" and "all visible together"
  G-9  <- G-80         Rider self-service
  G-98 <- G-82         No-show events are among the linked records

MERGE CHANGES (type or agent differs from the individual model)
  G-7   G-39 and G-88 were Maintain goals. Kept as Achieve so G-7 can be a P1
        milestone of G-2.
  G-27  G-78 was an Avoid goal, restated here as the positive Achieve goal.
  G-29  Achieve in the Janelle model. Maintain here because G-46 is ongoing.
  G-32  G-49 belonged to the Dispatcher, G-32 to SchedulingModule. See I-5.
  G-45  G-118 was a soft goal. Its measurable part is kept as an Achieve goal.
  G-98  G-82 belonged to DispatchBoard. The records now sit with ReportingModule.

VAGUE TERMS INTRODUCED BY THE MERGE
  "cut accurately" (G-45): scheduled revenue hours match actual hours (G-99)
  "stable headway and on-time performance" (G-7): even spacing between pickups,
  with pickups inside the pickup window

INCONSISTENCIES (same subject described differently; no goal is in conflict)
  I-1 Terms: Frank "build the runs", Diane "run-cutting". Janelle "attendant",
      interviewer "caretaker", Frank "caregivers". Resolved by G-45 and the name
      "attendant" throughout.
  I-2 Who phones whom: Janelle says she calls dispatch (00:33:13). Frank says riders
      "get late or duplicate calls" (00:48:57) and that reservation staff relay
      changes (00:47:38). Both can hold, so the model covers both directions
      (G-3, G-27).
  I-3 Who builds runs: Frank says runs are built overnight (00:46:00) and also that
      he assigns runs himself. Read as an overnight batch that he then reviews.
  I-4 Measure of on-time service: Diane wants stable on-time performance overall
      (01:00:28), but Janelle says most failures fall on return trips (00:35:04).
      An average can look stable while return trips fail, so G-136 reports
      return trips separately.
  I-5 Who matches vehicles: Frank says he does (00:46:00). Janelle wants the system
      to do it (00:38:44). Read as SchedulingModule proposing the match (G-32) and
      the dispatcher confirming it when assigning runs (G-52).

CONFLICTS (ConflictLink below, with the goal that resolves each)
  C-1 G-14 x G-73  Rider wants an immediate outcome on same-day changes; dispatcher
                   needs control of them. Frank: "one person’s convenience can put
                   six other pickups outside their window" (00:50:52). Janelle's
                   "see whether the change is accepted" (00:32:01) already allows
                   a change to be declined. Resolved by G-125 to G-128, with
                   G-72 and G-73 limited to changes that affect other riders.
  C-2 G-79 x G-129 Showing riders the route impact could expose other riders' trips
                   and mobility details. Resolved by G-130.
  C-3 G-32 x G-115 A van that fits a large chair may be further away, adding
                   deadhead mileage. Resolved by G-131.
  C-4 G-55 x G-116 Dispatcher fixes such as vehicle swaps protect windows but add
                   overtime and repositioning. Resolved by G-132.
  C-5 G-30 x G-7   Unrushed boarding uses up time on a run built to tight windows.
                   Resolved by G-133.
  C-6 G-48 x G-96  A 5 p.m. cutoff could deny a trip that Diane says cannot be
                   denied. The unstated condition is what happens to late requests.
                   Resolved by G-134.
"""
from goalmodeling.schema import *


def env(name):
    return [PerformanceLink(Agent(name, AgentType.ENVIRONMENT_AGENT), None)]


def sw(name):
    return [PerformanceLink(Agent(name, AgentType.SOFTWARE_AGENT), None)]


def highlight(diagram, vertices):
    ids = ",".join(v.get_node_id() for v in vertices)
    return diagram + f"\nclassDef yellow fill:#FFFF00,color:#000\nclass {ids} yellow\n"


# --- Booking ---

g15 = AchieveGoal("G-15: Morning and return trips booked in one request the day before",
                  performs=env("Rider"), leaf=True)
g16 = AchieveGoal("G-16: Home and work details saved for reuse",
                  performs=sw("TripPortal"), leaf=True)
g11 = AchieveGoal("G-11: Rider books trip online",
                  refinements=[Refinement(False, [g15, g16], "H4")])

# G-135 | behavioral, functional; phone alternative to G-11, kept for riders who cannot use the portal
#   Janelle 00:31:26 "Right now I use the phone because that’s the only way to book."
#   Frank 00:47:04 "reservation staff enter and change trips"
g135 = AchieveGoal("G-135: Reservation staff enter trip by phone <b>If</b> rider does not book online",
                   performs=env("ReservationStaff"), leaf=True)

# G-48 now has an OR-refinement between the online and phone channels
g48 = AchieveGoal("G-48: Trip request received by 5 p.m. the day before",
                  refinements=[Refinement(False, [g11], "H6"),
                               Refinement(False, [g135], "H6")])

# G-134 | behavioral, functional | NOT IN TRANSCRIPT: resolves C-6
g134 = AchieveGoal("G-134: Late request held for dispatcher review <b>If</b> received after 5 p.m.",
                   performs=sw("TripPortal"), leaf=True)

# --- Vehicle matching ---

g31 = AchieveGoal("G-31: Chair size and lift needs on file <b>If</b> trip booked",
                  performs=env("Rider"), leaf=True)

# G-32 <- G-49
g32 = AchieveGoal("G-32: Vehicle with right lift, room and capacity matched to trip <b>If</b> chair needs on file",
                  performs=sw("SchedulingModule"), leaf=True)

# G-131 | behavioral, functional | NOT IN TRANSCRIPT: resolves C-3
g131 = MaintainGoal("G-131: Vehicle fit treated as a hard constraint ahead of deadhead savings",
                    performs=sw("SchedulingModule"), leaf=True)

g28 = AchieveGoal("G-28: Compatible vehicle assigned <b>If</b> trip booked",
                  refinements=[Refinement(False, [g31, g32], "P4")])

# --- Building next-day runs ---

g52 = AchieveGoal("G-52: Run and driver assigned <b>If</b> trip matched",
                  performs=env("Dispatcher"), leaf=True)
g53 = AchieveGoal("G-53: Trip removed and capacity released <b>If</b> trip cancelled",
                  performs=sw("DispatchBoard"), leaf=True)
g50 = MaintainGoal("G-50: Run assignments match active trips",
                   refinements=[Refinement(False, [g52, g53], "H9")])

g56 = AchieveGoal("G-56: Conflict flagged <b>If</b> vehicle overloaded",
                  performs=sw("DispatchBoard"), leaf=True)
g57 = AchieveGoal("G-57: Conflict flagged <b>If</b> riders incompatible",
                  performs=sw("DispatchBoard"), leaf=True)
g58 = AchieveGoal("G-58: Conflict flagged <b>If</b> timing between legs infeasible",
                  performs=sw("DispatchBoard"), leaf=True)
g59 = AchieveGoal("G-59: Conflict flagged <b>If</b> mobility detail does not match van",
                  performs=sw("DispatchBoard"), leaf=True)
conflict_cases = DomainProperty("Run conflicts are overload, incompatibility, timing or mobility mismatch", leaf=True)
g54 = AchieveGoal("G-54: Conflict flagged before run reaches driver",
                  refinements=[Refinement(True, [g56, g57, g58, g59, conflict_cases], "P2")])

g60 = AchieveGoal("G-60: Trip moved to another run",
                  performs=env("Dispatcher"), leaf=True)

# G-61 <- G-33
g61 = AchieveGoal("G-61: Vehicle swapped <b>If</b> conflict flagged or assigned vehicle cannot accommodate chair",
                  performs=env("Dispatcher"), leaf=True)

g62 = AchieveGoal("G-62: Shared route adjusted",
                  performs=env("Dispatcher"), leaf=True)
g55 = AchieveGoal("G-55: Conflict resolved <b>If</b> conflict flagged",
                  refinements=[Refinement(False, [g60], "H4"),
                               Refinement(False, [g61], "H4"),
                               Refinement(False, [g62], "H4")])
g51 = AchieveGoal("G-51: Run conflict cleared before run reaches driver",
                  refinements=[Refinement(False, [g54, g55], "P4")])

# G-133 | behavioral, functional | NOT IN TRANSCRIPT: resolves C-5
g133 = AchieveGoal("G-133: Boarding time scheduled from rider mobility needs",
                   performs=sw("SchedulingModule"), leaf=True)

# G-45 <- G-118
g45 = AchieveGoal("G-45: Next-day runs cut accurately and built without conflicts",
                  refinements=[Refinement(False, [g48, g32, g50, g51], "P1")])

# --- Keeping drivers informed ---

# G-63 <- G-34
g63 = AchieveGoal("G-63: Driver receives manifest with pickup location, windows, mobility details and no-show and late-cancel updates",
                  performs=sw("DriverApp"), leaf=True)
g35 = AchieveGoal("G-35: Driver told attendant rides at no charge <b>If</b> attendant accompanies rider",
                  performs=sw("DriverApp"), leaf=True)
attendant_free = DomainProperty("Attendant rides at no charge under program rules", leaf=True)

g64 = AchieveGoal("G-64: Updated manifest and notes pushed to driver <b>If</b> change accepted",
                  performs=sw("DispatchBoard"), leaf=True)
g66 = AchieveGoal("G-66: Driver acknowledges updated manifest",
                  performs=env("Driver"), leaf=True)
g67 = AvoidGoal("G-67: Driver manifest changed <b>If</b> change not accepted",
                performs=sw("DispatchBoard"), leaf=True)
g145 = MaintainGoal("G-145: Driver manifest matches accepted changes",
                    refinements=[Refinement(False, [g64, g67], "H10")])
g65 = CeaseGoal("G-65: Dispatcher phoning drivers to relay changes",
                refinements=[Refinement(False, [g145, g66], "H4")])

# G-29 <- G-46
g29 = MaintainGoal("G-29: Driver prepared and informed of current run",
                   refinements=[Refinement(False, [g63, g35, attendant_free, g65], "H11")])

g47 = MaintainGoal("G-47: Driver follows current manifest",
                   performs=env("Driver"), leaf=True)

# G-7 <- G-39, G-88
g7 = AchieveGoal("G-7: Van arrives within pickup window with stable headway and on-time performance <b>If</b> trip booked",
                 refinements=[Refinement(False, [g45, g29, g47], "P7")])

# --- Getting home for the attendant visit ---

g6 = AchieveGoal("G-6: Return trip booked to arrive before attendant visit",
                 performs=env("Rider"), leaf=True)
g8 = AchieveGoal("G-8: Rider home before attendant visit <b>If</b> picked up within window",
                 performs=env("Driver"), leaf=True)
g2 = AchieveGoal("G-2: Rider home in time for attendant evening visit",
                 refinements=[Refinement(False, [g6, g7, g8], "P1")])

# --- Rider self-service ---

g12 = AchieveGoal("G-12: Rider changes pickup online <b>If</b> workday ends early",
                  performs=env("Rider"), leaf=True)
g13 = AchieveGoal("G-13: Rider cancels ride online <b>If</b> ride no longer needed",
                  performs=env("Rider"), leaf=True)
g17 = AchieveGoal("G-17: Rider shown confirmation <b>If</b> change accepted",
                  performs=sw("TripPortal"), leaf=True)
g18 = AchieveGoal("G-18: Rider shown reason <b>If</b> change not accepted",
                  performs=sw("TripPortal"), leaf=True)

# G-128 | behavioral, functional | NOT IN TRANSCRIPT: resolves C-1, third case added to G-14
g128 = AchieveGoal("G-128: Rider shown pending status <b>If</b> change awaits dispatcher",
                   performs=sw("TripPortal"), leaf=True)

# G-19 rewritten for C-1: a dispatcher decision cannot always finish in a minute, but a receipt can
g19 = MaintainGoal("G-19: Outcome or pending status shown within 1 minute of submission",
                   performs=sw("TripPortal"), leaf=True)
change_outcomes = DomainProperty("Every submitted change is accepted, not accepted or pending", leaf=True)

# G-14 rewritten for C-1
g14 = AchieveGoal("G-14: Rider sees outcome or pending status immediately <b>If</b> change submitted",
                  refinements=[Refinement(True, [g17, g18, g128, change_outcomes], "P3")])

# G-130 | behavioral, non-functional (confidentiality) | NOT IN TRANSCRIPT: resolves C-2
g130 = MaintainGoal("G-130: Rider shown only own new window and approval need",
                    performs=sw("TripPortal"), leaf=True)

g79 = AchieveGoal("G-79: Rider sees effect of change before submitting",
                  refinements=[Refinement(False, [g130], "H4")])

# G-9 <- G-80
g9 = AchieveGoal("G-9: Rider manages own trips online and makes routine changes without calling",
                 refinements=[Refinement(False, [g11, g12, g13, g14, g19, g79], "H7")])

# --- Knowing where the van is ---

g20 = AchieveGoal("G-20: Rider views live van location on demand",
                  performs=sw("TripPortal"), leaf=True)
g21 = AchieveGoal("G-21: Rider receives alerts as van approaches",
                  performs=sw("NotificationService"), leaf=True)
g23 = MaintainGoal("G-23: Tracked van position matches actual position",
                   performs=env("VehicleGPS"), leaf=True)
g24 = AchieveGoal("G-24: Arrival estimate computed from tracked van position",
                  performs=sw("ETAService"), leaf=True)
g25 = MaintainGoal("G-25: Arrival estimate within 5 minutes of actual arrival",
                   performs=sw("ETAService"), leaf=True)
g22 = AchieveGoal("G-22: Trustworthy arrival estimate available",
                  refinements=[Refinement(False, [g23, g24, g25], "P6")])

# G-27 <- G-78
g27 = AchieveGoal("G-27: Rider alerted once, before the pickup window opens, <b>If</b> van predicted outside window or trip changes",
                  performs=sw("NotificationService"), leaf=True)
g26 = AvoidGoal("G-26: Rider left without information <b>If</b> van runs late",
                refinements=[Refinement(False, [g27], "H8")])
g10 = AchieveGoal("G-10: Rider knows actual vehicle status while waiting",
                  refinements=[Refinement(False, [g20, g22, g26], "H6"),
                               Refinement(False, [g21, g22, g26], "H6")])

g142 = MaintainGoal("G-142: Call-center volume monitored",
                    performs=env("BudgetManager"), leaf=True)
g143 = AchieveGoal("G-143: Avoidable call types identified from call records",
                   performs=sw("ReportingModule"), leaf=True)

# G-3 <- G-43, G-117
g3 = SoftGoal("G-3: Reduce avoidable phone calls, call-center transactions and rider hold time",
              refinements=[Refinement(False, [g9, g10, g142, g143], "H4")])

# --- Boarding ---

g30 = MaintainGoal("G-30: Driver gives rider space and time to deploy ramp and board",
                   performs=env("Driver"), leaf=True)
g4 = AchieveGoal("G-4: Rider boards assigned vehicle safely without rushing",
                 refinements=[Refinement(False, [g28, g29, g30, g61, g133], "H5")])

# --- Ease of use ---

g36 = MaintainGoal("G-36: Rider portal conforms to WCAG 2.1 AA",
                   performs=sw("TripPortal"), leaf=True)
g37 = AchieveGoal("G-37: Rider completes trip tasks without staff help",
                  performs=env("Rider"), leaf=True)
g84 = AvoidGoal("G-84: Change failing to reach affected drivers and riders before their next pickup",
                performs=sw("DispatchBoard"), leaf=True)

# G-76 <- G-85
g76 = MaintainGoal("G-76: Capacity, mobility needs and pickup windows visible together on one board",
                   performs=sw("DispatchBoard"), leaf=True)

# G-5 <- G-44
g5 = SoftGoal("G-5: Maximize ability of riders and staff to use system independently and without confusion",
              refinements=[Refinement(False, [g36, g37, g76], "H3")])

# --- Rider privacy ---

# G-129 | behavioral, non-functional (confidentiality) | NOT IN TRANSCRIPT: found with H8 from G-79; conflicts with it in C-2
g129 = AvoidGoal("G-129: Other riders' trip or mobility details disclosed to riders",
                 refinements=[Refinement(False, [g130], "H8")])

g1 = SoftGoal("G-1: Improve rider independence and certainty on daily trips",
              refinements=[Refinement(False, [g2, g3, g4, g5], "H12")])

# --- Keeping the board accurate ---

g68 = AchieveGoal("G-68: Driver road notes captured in system",
                  performs=env("Driver"), leaf=True)
g69 = AchieveGoal("G-69: Driver delay on previous leg shown on board",
                  performs=sw("DispatchBoard"), leaf=True)
g70 = AchieveGoal("G-70: Early warning shown <b>If</b> schedule at risk",
                  performs=sw("DispatchBoard"), leaf=True)
g71 = AchieveGoal("G-71: Board state handed to next dispatcher at shift end",
                  performs=env("Dispatcher"), leaf=True)
g77 = MaintainGoal("G-77: Change history records who changed what and when",
                   performs=sw("DispatchBoard"), leaf=True)
g40 = MaintainGoal("G-40: Board accurate throughout shift and at handoff",
                   refinements=[Refinement(False, [g68, g69, g71, g77], "H4")])

# --- Same-day changes ---

g75 = AchieveGoal("G-75: Every affected rider and window shown",
                  performs=sw("DispatchBoard"), leaf=True)

# G-132 | behavioral, functional | NOT IN TRANSCRIPT: resolves C-4
g132 = AchieveGoal("G-132: Overtime and deadhead effect of a fix shown with route impact",
                   performs=sw("DispatchBoard"), leaf=True)

# G-72 rewritten for C-1: changes that affect nobody else are accepted by G-126
g72 = AchieveGoal("G-72: Whole route impact shown <b>If</b> same-day change affects another rider window or capacity",
                  refinements=[Refinement(False, [g75, g76, g132], "P5")])

# G-126 | behavioral, functional | NOT IN TRANSCRIPT: resolves C-1
g126 = AchieveGoal("G-126: Change accepted automatically <b>If</b> no other rider window or capacity affected",
                   performs=sw("DispatchBoard"), leaf=True)

# G-127 | behavioral, functional | NOT IN TRANSCRIPT: resolves C-1
g127 = AchieveGoal("G-127: Change routed to dispatcher <b>If</b> another rider window or capacity affected",
                   performs=sw("DispatchBoard"), leaf=True)

impact_cases = DomainProperty("A change either affects another rider window or capacity, or it does not", leaf=True)

# G-125 | behavioral, functional | NOT IN TRANSCRIPT: resolves C-1
g125 = AchieveGoal("G-125: Same-day change decided by route impact <b>If</b> rider submits change",
                   refinements=[Refinement(True, [g126, g127, impact_cases], "P3")])

g74 = AchieveGoal("G-74: Change applied <b>If</b> dispatcher accepts after seeing impact",
                  performs=env("Dispatcher"), leaf=True)
# G-73 rewritten for C-1
g73 = MaintainGoal("G-73: Dispatcher controls same-day changes that affect other riders, capacity or shared routes",
                   refinements=[Refinement(False, [g72, g74], "P4")])
g81 = AchieveGoal("G-81: Manifests resequenced <b>If</b> trip added after runs built",
                  performs=env("Dispatcher"), leaf=True)
g41 = AchieveGoal("G-41: Same-day change applied without cascading delay",
                  refinements=[Refinement(False, [g73, g125, g27, g81, g70, g84], "H4")])

# --- Linked trip data ---

# G-98 <- G-82
g98 = AchieveGoal("G-98: Reservation, dispatch, trip, cancellation and no-show records linked and recorded per rider",
                  performs=sw("ReportingModule"), leaf=True)
g99 = AchieveGoal("G-99: Scheduled versus actual revenue hours reported",
                  performs=sw("ReportingModule"), leaf=True)
g100 = AchieveGoal("G-100: Deadhead mileage and vehicle utilization reported",
                   performs=sw("ReportingModule"), leaf=True)
g101 = AchieveGoal("G-101: Overtime attributed to trips and runs",
                   performs=sw("ReportingModule"), leaf=True)
g102 = MaintainGoal("G-102: Trip cost data matches completed service",
                    performs=sw("ReportingModule"), leaf=True)

# G-136 | behavioral, functional | NOT IN TRANSCRIPT: resolves inconsistency I-4
g136 = AchieveGoal("G-136: On-time performance reported separately for return trips",
                   performs=sw("ReportingModule"), leaf=True)

g103 = AchieveGoal("G-103: Trip-level cost allocation data available",
                   refinements=[Refinement(False, [g98, g99, g100, g101], "P5")])
g90 = CeaseGoal("G-90: Manual reconciliation in variance analysis",
                refinements=[Refinement(False, [g103], "H4")])

# --- No-show patterns ---

g83 = AchieveGoal("G-83: Repeat patterns reported to dispatcher",
                  performs=sw("DispatchBoard"), leaf=True)
g42 = AchieveGoal("G-42: Repeated no-show and late-cancel patterns visible",
                  refinements=[Refinement(False, [g98, g83], "H3")])

g38 = SoftGoal("G-38: Improve stability of daily runs",
               refinements=[Refinement(False, [g7, g40, g41, g42], "H12")])

# --- Cost per trip ---

g137 = AchieveGoal("G-137: Deadhead mileage and idle vehicle time shown for each proposed run",
                   performs=sw("SchedulingModule"), leaf=True)
g138 = AchieveGoal("G-138: Overtime above plan flagged to scheduling staff",
                   performs=sw("ReportingModule"), leaf=True)
g139 = AchieveGoal("G-139: Contractor productivity reported per service hour",
                   performs=sw("ReportingModule"), leaf=True)
g144 = MaintainGoal("G-144: No-show capacity tracked",
                    performs=sw("ReportingModule"), leaf=True)

g115 = SoftGoal("G-115: Reduce deadhead mileage",
                refinements=[Refinement(False, [g100, g137], "H4")])
g116 = SoftGoal("G-116: Reduce overtime",
                refinements=[Refinement(False, [g101, g138], "H4")])
g119 = SoftGoal("G-119: Maximize vehicle utilization",
                refinements=[Refinement(False, [g100, g137], "H4")])

# G-120 refined with G-42: seeing the patterns is how capacity loss gets reduced
g120 = SoftGoal("G-120: Reduce capacity lost to no-shows",
                refinements=[Refinement(False, [g42, g144], "H4")])

g123 = SoftGoal("G-123: Improve contractor productivity",
                refinements=[Refinement(False, [g99, g139], "H4")])
external_costs = DomainProperty("Fuel, insurance, labor rates and depreciation are largely external", leaf=True)
g109 = SoftGoal("G-109: Minimize cost per passenger trip",
                refinements=[Refinement(False, [g115, g116, g3, g45, g119, g120, g123, external_costs], "H4")])

# --- Contractor invoices ---

g121 = AchieveGoal("G-121: Invoice exception flagged <b>If</b> billed hours differ from dispatch records",
                   performs=sw("ReportingModule"), leaf=True)
g122 = AchieveGoal("G-122: Correction required <b>If</b> invoice exception flagged",
                   performs=env("BudgetManager"), leaf=True)
g110 = AchieveGoal("G-110: Contractor invoices match completed service",
                   refinements=[Refinement(False, [g121, g122], "P1")])
g93 = SoftGoal("G-93: Maximize favorable variance on cost per trip, overtime and invoices",
               refinements=[Refinement(False, [g109, g110], "H4")])

# --- Staying inside the budget ---

g94 = AchieveGoal("G-94: Actual trip volumes compared with adopted budget",
                  performs=env("BudgetManager"), leaf=True)
g111 = AchieveGoal("G-111: Forecast revised <b>If</b> costs run above plan",
                   performs=env("BudgetManager"), leaf=True)
g112 = AchieveGoal("G-112: Nonessential administrative spending deferred <b>If</b> costs run above plan",
                   performs=env("BudgetManager"), leaf=True)
g113 = AchieveGoal("G-113: Schedule reviewed earlier <b>If</b> costs run above plan",
                   performs=env("SchedulingStaff"), leaf=True)
g95 = AchieveGoal("G-95: Overrun handled without cutting eligible trips <b>If</b> costs run above plan",
                  refinements=[Refinement(False, [g111, g112, g113], "H8")])
g87 = MaintainGoal("G-87: Spending within adopted operating budget",
                   refinements=[Refinement(False, [g94, g95], "H4")])

# --- Compliance ---

# G-96 refined with G-134: holding a late request is how the cutoff avoids denying a trip
g96 = AvoidGoal("G-96: Denying eligible trips or reducing ADA-required service",
                refinements=[Refinement(False, [g134], "H8")])
g97 = AchieveGoal("G-97: Federal reports produced from linked trip records",
                  performs=sw("ReportingModule"), leaf=True)
g89 = AvoidGoal("G-89: Material findings in federal compliance reporting",
                refinements=[Refinement(False, [g96, g97, g102], "H3")])

# --- Service decisions ---

g104 = AchieveGoal("G-104: Service change weighed against rider, utilization, overtime and federal effects",
                   performs=env("BudgetManager"), leaf=True)
# G-105 refined with G-131: vehicle fit is the concrete case of this rule
g105 = AvoidGoal("G-105: Cost-effective choice <b>If</b> it puts riders outside service standards",
                 refinements=[Refinement(False, [g131], "H8")])
g91 = AchieveGoal("G-91: Responsible service decisions supported",
                  refinements=[Refinement(False, [g104, g105], "H6")])

# --- Value of the new system ---

g140 = AchieveGoal("G-140: System costs budgeted before launch",
                   performs=env("BudgetManager"), leaf=True)
g141 = AchieveGoal("G-141: Actual system costs compared with budget after launch",
                   performs=sw("ReportingModule"), leaf=True)
g106 = SoftGoal("G-106: Minimize implementation, training and maintenance cost",
                refinements=[Refinement(False, [g140, g141], "H4")])
g114 = AchieveGoal("G-114: Staff trained on new system before launch",
                   performs=env("BudgetManager"), leaf=True)
g107 = SoftGoal("G-107: Maximize system adoption",
                refinements=[Refinement(False, [g114], "P7")])
# G-108 refined with G-136: return-trip punctuality is the measure an average would hide.
# G-99 and G-100 measure the operating side.
g108 = AchieveGoal("G-108: Operational improvements measured after launch",
                   refinements=[Refinement(False, [g136, g99, g100], "H4")])
g92 = SoftGoal("G-92: Maximize value of new system",
               refinements=[Refinement(False, [g106, g107, g108], "H6")])

g86 = SoftGoal("G-86: Maximize responsible use of public funds while keeping service compliant",
               refinements=[Refinement(False, [g87, g93, g7, g89, g90, g91, g92], "H12")])

# G-124 | soft, non-functional | NOT IN TRANSCRIPT: common root above the three stakeholder models
g124 = SoftGoal("G-124: Maximize reliable, compliant and cost-responsible paratransit service",
                refinements=[Refinement(False, [g1, g38, g86, g129], "H12")])

# --- Obstacles ---

o1 = Obstacle("O-1: Van late beyond pickup window")
o2 = Obstacle("O-2: Assigned vehicle cannot accommodate chair")
o3 = Obstacle("O-3: Rider changes trip without seeing route impact")
o4 = Obstacle("O-4: Trip added after runs built creates capacity conflict")
o5 = Obstacle("O-5: Severe weather raises service hours and overtime")

links = [ObstructionLink(g7, o1), ResolutionLink(g26, o1),
         ObstructionLink(g28, o2), ResolutionLink(g61, o2),
         ObstructionLink(g41, o3), ResolutionLink(g79, o3),
         ObstructionLink(g41, o4), ResolutionLink(g81, o4),
         ObstructionLink(g87, o5), ResolutionLink(g95, o5),
         ConflictLink(g14, g73),
         ConflictLink(g79, g129),
         ConflictLink(g32, g115),
         ConflictLink(g55, g116),
         ConflictLink(g30, g7),
         ConflictLink(g48, g96)]

# G-14, G-27, G-61, G-72, G-73, G-84 and G-98 are stated goals whose rewritten text now includes unstated conditions
not_in_transcript = [g6, g8, g14, g16, g18, g19, g21, g23, g25, g27, g31, g36,
                     g47, g50, g53, g61, g66, g67, g72, g73, g84, g145,
                     g97, g98, g102, g114, g137, g138, g139, g140, g141, g143,
                     g124, g125, g126, g127, g128, g129, g130, g131, g132, g133, g134, g136]

output = highlight(generate_graph([g124], links), not_in_transcript)
link = generate_pako_link(output, "edit", config={"theme": "neutral"})

if __name__ == "__main__":
    print(output)
    print(link)
    with open("mermaid.txt", "w", encoding="utf-8") as f:
        f.write(link + "\n")
