"""
Goal model extracted from the Diane interview (paratransit budget manager).
Source: transcript-261028-2107 (2).csv

Trace format, one block per goal:
    # G-n | goal type
    #   Diane HH:MM:SS "exact stakeholder words"
Goals with no source quote are marked NOT IN TRANSCRIPT and are highlighted
yellow in the diagram. Interviewer paraphrases were not used as sources:
  - "linkage between ... deadhead trips and regulations" (01:05:48) is not what
    Diane asked for. The linkage she described is between trip records (G-98).

Vague terms and how they were interpreted:
  - "favorable variance": defined by Diane at 01:00:43 as actual costs below
    budget, or performance better than planned (G-93)
  - "unacceptable impact for riders": a choice that puts an eligible rider
    outside the pickup window or service standards (G-105). Diane declined to
    define this (01:05:04), so the reading is mine.
  - "responsible service decisions": refined to G-104 and G-105
  - "actual adoption": staff and riders using the system in place of the phone (G-107)
  - "on-time performance": pickups inside the pickup window (G-88)

G-137 to G-144 continue after the numbering used by the other models. They give the
soft goals below behavioral goals that an agent can carry out.
"""
from goalmodeling.schema import *


def env(name):
    return [PerformanceLink(Agent(name, AgentType.ENVIRONMENT_AGENT), None)]


def sw(name):
    return [PerformanceLink(Agent(name, AgentType.SOFTWARE_AGENT), None)]


def highlight(diagram, vertices):
    ids = ",".join(v.get_node_id() for v in vertices)
    return diagram + f"\nclassDef yellow fill:#FFFF00,color:#000\nclass {ids} yellow\n"


# --- Trip-level data ---

# G-98 | behavioral, functional (information)
#   Diane 01:04:24 "cleaner linkage between reservations, dispatch events, completed trips, cancellations, and no-shows"
g98 = AchieveGoal("G-98: Reservation, dispatch, trip, cancellation and no-show records linked",
                  performs=sw("ReportingModule"), leaf=True)

# G-99 | behavioral, functional (information)
#   Diane 01:04:24 "scheduled versus actual revenue hours"
g99 = AchieveGoal("G-99: Scheduled versus actual revenue hours reported",
                  performs=sw("ReportingModule"), leaf=True)

# G-100 | behavioral, functional (information)
#   Diane 01:04:24 "deadhead mileage, vehicle utilization"
g100 = AchieveGoal("G-100: Deadhead mileage and vehicle utilization reported",
                   performs=sw("ReportingModule"), leaf=True)

# G-101 | behavioral, functional (information)
#   Diane 01:04:24 "overtime attribution"
g101 = AchieveGoal("G-101: Overtime attributed to trips and runs",
                   performs=sw("ReportingModule"), leaf=True)

# G-113 | behavioral, functional
#   Diane 01:03:42 "worked with operations on tighter run-cutting and earlier schedule review"
g113 = AchieveGoal("G-113: Schedule reviewed earlier <b>If</b> costs run above plan",
                   performs=env("SchedulingStaff"), leaf=True)

# G-137 | behavioral, functional | NOT IN TRANSCRIPT: controllable step under G-115 and G-119
g137 = AchieveGoal("G-137: Deadhead mileage and idle vehicle time shown for each proposed run",
                   performs=sw("SchedulingModule"), leaf=True)

# G-138 | behavioral, functional | NOT IN TRANSCRIPT: my reading of "overtime controls"
g138 = AchieveGoal("G-138: Overtime above plan flagged to scheduling staff",
                   performs=sw("ReportingModule"), leaf=True)

# G-139 | behavioral, functional | NOT IN TRANSCRIPT: measure needed before G-123 can be judged
g139 = AchieveGoal("G-139: Contractor productivity reported per service hour",
                   performs=sw("ReportingModule"), leaf=True)

# G-140 | behavioral, functional | NOT IN TRANSCRIPT: controllable step under G-106
g140 = AchieveGoal("G-140: System costs budgeted before launch",
                   performs=env("BudgetManager"), leaf=True)

# G-141 | behavioral, functional | NOT IN TRANSCRIPT: controllable step under G-106
g141 = AchieveGoal("G-141: Actual system costs compared with budget after launch",
                   performs=sw("ReportingModule"), leaf=True)

# G-142 | behavioral, functional
#   Diane 01:03:42 "monitored call-center volume"
g142 = MaintainGoal("G-142: Call-center volume monitored",
                    performs=env("BudgetManager"), leaf=True)

# G-143 | behavioral, functional | NOT IN TRANSCRIPT: how "avoidable" calls would be told apart
g143 = AchieveGoal("G-143: Avoidable call types identified from call records",
                   performs=sw("ReportingModule"), leaf=True)

# G-144 | behavioral, functional (information)
#   Diane 01:01:19 "We also track deadhead mileage, overtime, no-show capacity"
g144 = MaintainGoal("G-144: No-show capacity tracked",
                    performs=sw("ReportingModule"), leaf=True)

# --- Cost per trip ---

# G-115 | soft, non-functional
#   Diane 01:02:10 "we can influence run-cutting, vehicle utilization, deadhead mileage, overtime controls"
g115 = SoftGoal("G-115: Reduce deadhead mileage",
                refinements=[Refinement(False, [g100, g137], "H4")])

# G-116 | soft, non-functional
#   Diane 01:01:19 "We also track deadhead mileage, overtime, no-show capacity, and call-center transactions"
g116 = SoftGoal("G-116: Reduce overtime",
                refinements=[Refinement(False, [g101, g138], "H4")])

# G-117 | soft, non-functional
#   Diane 00:59:57 "fewer avoidable phone transactions"
#   Diane 01:03:42 "every avoidable mile and phone transaction has a budget consequence"
g117 = SoftGoal("G-117: Reduce avoidable call-center transactions",
                refinements=[Refinement(False, [g142, g143], "H4")])

# G-118 | soft, non-functional (accuracy)
#   Diane 00:59:57 "more accurate scheduling"
#   Diane 01:03:42 "tighter run-cutting and earlier schedule review"
g118 = SoftGoal("G-118: Improve run-cutting and schedule accuracy",
                refinements=[Refinement(False, [g99, g113], "H4")])

# G-119 | soft, non-functional
#   Diane 01:00:28 "efficient vehicle utilization"
g119 = SoftGoal("G-119: Maximize vehicle utilization",
                refinements=[Refinement(False, [g100, g137], "H4")])

# G-120 | soft, non-functional
#   Diane 01:01:19 "no-show capacity"
g120 = SoftGoal("G-120: Reduce capacity lost to no-shows",
                refinements=[Refinement(False, [g98, g144], "H4")])

# G-123 | soft, non-functional
#   Diane 01:02:10 "contractor productivity"
g123 = SoftGoal("G-123: Improve contractor productivity",
                refinements=[Refinement(False, [g99, g139], "H4")])

# Domain property
#   Diane 01:02:10 "Fuel prices, insurance, collective-bargaining rates, and vehicle depreciation are also largely external"
external_costs = DomainProperty("Fuel, insurance, labor rates and depreciation are largely external", leaf=True)

# G-109 | soft, non-functional
#   Diane 01:01:19 "they raise the cost per passenger trip without necessarily increasing productive service"
g109 = SoftGoal("G-109: Minimize cost per passenger trip",
                refinements=[Refinement(False, [g115, g116, g117, g118, g119, g120, g123, external_costs], "H4")])

# --- Contractor invoices ---

# G-121 | behavioral, functional (stimulus-response)
#   Diane 01:04:24 "contractor invoice exceptions"
g121 = AchieveGoal("G-121: Invoice exception flagged <b>If</b> billed hours differ from dispatch records",
                   performs=sw("ReportingModule"), leaf=True)

# G-122 | behavioral, functional
#   Diane 01:03:42 "required corrections where hours didn’t match completed service"
g122 = AchieveGoal("G-122: Correction required <b>If</b> invoice exception flagged",
                   performs=env("BudgetManager"), leaf=True)

# G-110 | behavioral, functional
#   Diane 01:03:42 "I reviewed the invoices against dispatch records"
g110 = AchieveGoal("G-110: Contractor invoices match completed service",
                   refinements=[Refinement(False, [g121, g122], "P1")])

# G-93 | soft, non-functional
#   Diane 01:00:28 "maintaining a favorable variance on cost per passenger trip, overtime, and contractor invoices"
g93 = SoftGoal("G-93: Maximize favorable variance on cost per trip, overtime and invoices",
               refinements=[Refinement(False, [g109, g110], "H4")])

# --- Staying inside the budget ---

# G-94 | behavioral, functional
#   Diane 00:59:57 "compare actual trip volumes against the adopted budget"
g94 = AchieveGoal("G-94: Actual trip volumes compared with adopted budget",
                  performs=env("BudgetManager"), leaf=True)

# G-111 | behavioral, functional
#   Diane 01:03:42 "revised the forecast rather than cutting eligible trips"
g111 = AchieveGoal("G-111: Forecast revised <b>If</b> costs run above plan",
                   performs=env("BudgetManager"), leaf=True)

# G-112 | behavioral, functional
#   Diane 01:03:42 "deferred nonessential administrative spending"
g112 = AchieveGoal("G-112: Nonessential administrative spending deferred <b>If</b> costs run above plan",
                   performs=env("BudgetManager"), leaf=True)

# G-95 | behavioral, functional
#   Diane 01:03:42 "revised the forecast rather than cutting eligible trips"
g95 = AchieveGoal("G-95: Overrun handled without cutting eligible trips <b>If</b> costs run above plan",
                  refinements=[Refinement(False, [g111, g112, g113], "H8")])

# G-87 | behavioral, non-functional (cost)
#   Diane 01:00:28 "we remain within the adopted operating budget"
g87 = MaintainGoal("G-87: Spending within adopted operating budget",
                   refinements=[Refinement(False, [g94, g95], "H4")])

# G-88 | behavioral, functional
#   Diane 01:00:28 "We also need stable on-time performance"
g88 = MaintainGoal("G-88: Stable on-time performance",
                   performs=env("Dispatcher"), leaf=True)

# --- Compliance ---

# G-96 | behavioral, non-functional (compliance)
#   Diane 01:02:10 "We cannot arbitrarily reduce ADA-required service, deny an eligible trip"
g96 = AvoidGoal("G-96: Denying eligible trips or reducing ADA-required service",
                performs=env("ReservationStaff"), leaf=True)

# G-97 | behavioral, functional | NOT IN TRANSCRIPT: my inference on how reporting obligations get met
g97 = AchieveGoal("G-97: Federal reports produced from linked trip records",
                  performs=sw("ReportingModule"), leaf=True)

# G-102 | behavioral, non-functional (accuracy) | NOT IN TRANSCRIPT: accuracy category instantiated with H3
g102 = MaintainGoal("G-102: Trip cost data matches completed service",
                    performs=sw("ReportingModule"), leaf=True)

# G-89 | behavioral, non-functional (compliance)
#   Diane 01:00:28 "no material findings in our federal compliance reporting"
g89 = AvoidGoal("G-89: Material findings in federal compliance reporting",
                refinements=[Refinement(False, [g96, g97, g102], "H3")])

# G-103 | behavioral, functional (information)
#   Diane 01:04:24 "more reliable cost-allocation data at the trip level"
g103 = AchieveGoal("G-103: Trip-level cost allocation data available",
                   refinements=[Refinement(False, [g98, g99, g100, g101], "P5")])

# G-90 | behavioral, functional
#   Diane 01:04:24 "so the variance analysis isn’t dependent on manual reconciliation"
g90 = CeaseGoal("G-90: Manual reconciliation in variance analysis",
                refinements=[Refinement(False, [g103], "H4")])

# --- Service decisions ---

# G-104 | behavioral, functional
#   Diane 00:59:57 "I also weigh service changes against their effect on riders, vehicle utilization, overtime, and our federal obligations"
g104 = AchieveGoal("G-104: Service change weighed against rider, utilization, overtime and federal effects",
                   performs=env("BudgetManager"), leaf=True)

# G-105 | behavioral, non-functional
#   Diane 01:05:04 "a cost-effective choice doesn’t create an unacceptable impact for riders or put us outside our obligations"
g105 = AvoidGoal("G-105: Cost-effective choice <b>If</b> it puts riders outside service standards",
                 performs=env("BudgetManager"), leaf=True)

# G-91 | behavioral, functional
#   Diane 01:06:21 "support responsible service decisions without creating additional compliance exposure or cost somewhere else"
g91 = AchieveGoal("G-91: Responsible service decisions supported",
                  refinements=[Refinement(False, [g104, g105], "H6")])

# --- Value of the new system ---

# G-106 | soft, non-functional (cost)
#   Diane 01:05:39 "implementation, training, maintenance, and any service impacts would also need to be considered"
g106 = SoftGoal("G-106: Minimize implementation, training and maintenance cost",
                refinements=[Refinement(False, [g140, g141], "H4")])

# G-114 | behavioral, functional | NOT IN TRANSCRIPT: controllable stand-in for adoption introduced by P7
g114 = AchieveGoal("G-114: Staff trained on new system before launch",
                   performs=env("BudgetManager"), leaf=True)

# G-107 | soft, non-functional
#   Diane 01:05:39 "The financial result would depend on actual adoption"
g107 = SoftGoal("G-107: Maximize system adoption",
                refinements=[Refinement(False, [g114], "P7")])

# G-108 | behavioral, functional
#   Diane 01:05:39 "whether the system produces measurable operational improvements"
g108 = AchieveGoal("G-108: Operational improvements measured after launch",
                   performs=sw("ReportingModule"), leaf=True)

# G-92 | soft, non-functional
#   Diane 01:05:39 "There could be savings from fewer avoidable calls and better information"
g92 = SoftGoal("G-92: Maximize value of new system",
               refinements=[Refinement(False, [g106, g107, g108], "H6")])

# G-86 | soft, non-functional
#   Diane 00:59:20 "make sure service remains compliant while we use public funds responsibly"
g86 = SoftGoal("G-86: Maximize responsible use of public funds while keeping service compliant",
               refinements=[Refinement(False, [g87, g93, g88, g89, g90, g91, g92], "H12")])

# --- Obstacles ---

# O-5
#   Diane 01:03:42 "severe weather reduced vehicle productivity and created more repositioning miles"
o5 = Obstacle("O-5: Severe weather raises service hours and overtime")

links = [ObstructionLink(g87, o5), ResolutionLink(g95, o5)]

not_in_transcript = [g97, g102, g114, g137, g138, g139, g140, g141, g143]

output = highlight(generate_graph([g86], links), not_in_transcript)
link = generate_pako_link(output, "edit", config={"theme": "neutral"})

if __name__ == "__main__":
    print(output)
    print(link)
