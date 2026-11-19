Learning log

1. Sprint Planning and Requirements Selection
Briefly describe the requirements and the goals you selected for the sprint, and why you prioritized
them. Identify the overlapping, dependent, or conflicting requirements you considered. Briefly explain
how your goal model helped you understand these relationships, what decisions you made, and why.

I selected my goals and assignments mostly from my own models from Asignment 2. I checked the merged model before I used it for this assignment. I then grouped the combined model into multiple feature areas and then evaluated each on core, user-facing, and uncertainty criteria. From this, I chose to do same day trip cancellations and alterations. For example, Janelle's feailure story was from a same day change that she could not do because she was stuck on hold for a while, Frank's also did not like the same day changes, calling it "where the board starts to unravel," and Diane called it an avoidable cost. 

I deprioritized van tracking, making it second on my list, because it's uncertainty is technical, not based on stakeholder requirements. For example, the estimates from the van are based on GPS data, not on the requirements and a prototype with mock data would not do anything about that. Also, I deprioritized online booking because there already is a workaround (booking the day before on phone), cost reporting (since there is no UI), and more. 

Relationships the goal model exposed was that G-18 (where we must tell the rider why a change was declined) had no source for the reason, so I added another thing: G-146, where the dispatcher must give a reason. I also discovered a quote from Frank I had missed in Assignment 2, and added it as G-148 (that drivers don't like mid-run changes).




2. Prototype Evaluation
Discuss your significant observations from Prototype V1. Explain whether the issues arose from the
specification or implementation and what they revealed about the stakeholder goals.


I evaluated the prototype (V1) with multiple scenarios and edge cases, and going thorugh each screen. Issues arose like Janelle not seeing when she would get home, and it was an insufficient spec. Also, for Frank he could only accept or decline, which was a dead end so this was a missing requirement. The driver also could not see changed that were knocked on, so this was an ambiguous goal that I found. 

Some other code defects were found, but these were small and not relevant to the stakeholder goals.



3. Revisions and Learning
Describe the significant changes between Versions 1 and 2, including changes to the goal model,
specification, and prototype. For each significant change, explain:
● What you initially intended.
● What you discovered through evaluation.
● What you changed and why.
● How the revised implementation better addresses the requirement or stakeholder goal.


Some changes that were included was that we added a "arrival time home" feature (FR-025). What was intended was to show the pickup window and estimate, but what we discovered was that it didnt show if they would be home in time. So we changed G-2 into scope and now showed her own arrival time in the preview, the confirmation and each trip. I think this is better because now the rider can see the time to get home, and more information is better and fulfills the requirement better.

We also found that the times that confirm right away. We wanted it to say onlu "needs approval" but discovered that it was simply a window that was never explained. Thus, we changed it so now the rider can get approved for 3 of their own times immediately, and if a window is unreachable it is explained. This is better because the application is more transparent.



Conclude with a brief reflection addressing:
● Which decisions required your judgment rather than relying solely on AI?
● How did prototyping change your understanding of stakeholder needs?
● How did spec-driven development help maintain consistency between the requirements and
implementation?
● What evidence from your work would you present to management to demonstrate the value
you contributed beyond AI-generated specifications and code?


Deciisons that required my human judgement were scope, and how in depth the AI agent should go. I also decided which items to leave open rather than craete, as I thouhgt certain things would be out of scope. I also was constantly checking the work it prodcued against the assignment. I also deployed, and published the branch, and the AI needed my approval before every push. The agent handled the volume of information and tasks well.
The prototypeing changed my understanding as I had previously understood Janelle's need as a self-service, but the prototype showed me that her need was more about uncertainty than anything. I also realized there were some dead-ends in the happy path, which I needed to change. 

Spec-driven development kept things consistent, as every requirement needed a goal and transcript line, so there was constant verification. The analysis step also caught many gaps and issues before the code existed, which made things cheaper. 

I would now show management that the prototype passed many requirements, but there still were some gaps that needed to be addressed in V2. I also would show them changes from V1 to V2, such as like the arrival time change. I also would show them the human spec and work, and things like the tracability matrix the agent needed. Also, I would show management a list of questions left deliberately for the stakeholders, rather than AI guessed.