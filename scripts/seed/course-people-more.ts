// Five more lessons for People Skills for Tech Teams.
// Kept in a separate file so the original course file stays readable. They are spread into the
// lessons array there, and the seeder adds them to the existing course by title.
//
// Each lesson's slide deck has four slides, matching the first five lessons in the course, and
// each narration runs to about five sentences so it reads at the same pace.
import type { CourseDraft } from '@/core/content/draft';

type LessonDraft = CourseDraft['lessons'][number];

export const morePeopleLessons: LessonDraft[] = [
  {
    title: 'Writing updates people actually read',
    estimatedMinutes: 10,
    content: `Most status updates are written for the writer. They open with what the team did, list everything that happened, and leave the decision at the bottom. The reader skims the first line, finds nothing they need, and asks for a meeting instead.

Good writing fixes this before the meeting happens. Three questions decide the shape of an update:

1. What changed since the last update?
2. What does it mean for the person reading it?
3. What do I need from them, and by when?

### The four-line update

Most updates fit in four lines.

**Headline.** One sentence on the state of things. "Checkout is fixed."

**Impact.** Who feels it, and how much. "Orders from 9 to 10 were delayed. None were lost."

**Ask.** The decision you need, with a deadline. "Do we refund those orders? I need an answer by 4pm."

**Next checkpoint.** When you will write again. "Next update at 4pm, or sooner if it repeats."

### Write for the skimmer

Your reader is often on a phone, between two other things. They read the first line and the bold words. This is not laziness, it is the situation.

| Instead of | Write |
|---|---|
| "Just keeping you posted on the payments work." | "Payments are not at risk. The date holds." |
| "We had a long discussion about the API design." | "We chose REST. The event bus would cost two more weeks." |
| "There are some concerns about scope." | "The scope needs a cut. I recommend dropping the export, not the import." |
| "Working through a few blockers." | "Blocked on staging access. I need a login from the platform team by tomorrow." |

### Bad news writes itself

The updates people avoid are the ones that matter. If a date slips, that is the headline. A slip announced the day it happens costs one hard conversation. The same slip discovered by someone else costs trust.

> An update that hides a problem is a decision made on someone else's behalf.

### A worked example

**Before**

> "Hi all, quick update on the migration. The team has been looking at the schema and we had a few blockers with staging. We are working through them and will keep you posted."

**After**

> **The migration is two days late.**
> It lands Thursday instead of Tuesday. Nothing in production is affected.
> **Ask:** can we drop the legacy export from this release? Without the cut, Thursday becomes next week.
> Next update: Tuesday 4pm.

The second version can be answered with one word. The first cannot be answered at all.

### A small habit

Write the headline before you open the chat window. If the first line is not a state of the world, the update is not ready to send.`,
    activities: [
      {
        type: 'slides',
        title: 'Four lines that do the work',
        xpReward: 15,
        config: {
          slides: [
            {
              heading: 'The first line is the whole update',
              bullets: [
                'State the situation, not the activity',
                'A reader can stop after one line',
                'If it fits any week, it is too vague',
                'Bad news belongs in the first line',
              ],
              narration:
                'Most readers stop after one line, so the first line has to carry the state of things. Checkout is fixed is a state; we have been working on checkout is an activity. One of them lets a manager decide whether to care today. The other makes them ask a question you have already answered. A useful test is whether the sentence could appear in any week of the project.',
              detail:
                'If the first line would fit in any week of the project, it is not specific enough.',
              visual: 'three-moves',
              check: {
                question: 'Which first line would a busy manager act on?',
                options: [
                  'We are making good progress on the migration.',
                  'The migration is two days late, and nothing in production is affected.',
                  'The team has been looking at the schema this week.',
                ],
                answerIndex: 1,
                explanation: 'It states the situation and answers the obvious follow-up question in the same line.',
              },
            },
            {
              heading: 'Impact before detail',
              bullets: [
                'Who feels it, and how much',
                'Say what is not affected',
                'Numbers beat adjectives',
                'Save the cause for the second line',
              ],
              narration:
                'After the headline, say who is affected and how much. Naming what is not affected matters just as much as naming what is. Orders delayed, none lost, tells the reader more than a paragraph about the queue. The cause is interesting to the team and mostly optional for everyone else. The sentence people repeat to their own team is usually the impact sentence, so make it repeatable.',
              detail:
                'The sentence people repeat to their own team is usually the impact sentence.',
              visual: 'dialogue-client',
            },
            {
              heading: 'Write for the skimmer',
              bullets: [
                'Assume a phone and two minutes',
                'Put the important words first',
                'Replace jargon with their words',
                'Cut anything that does not change a decision',
              ],
              narration:
                'Your reader is on a phone between two meetings. They read the first line and the bold words, then decide whether to read on. That is the situation, not laziness. So write the words they would use, not the words the team uses. A status update with a glossary is not an update, it is a translation problem.',
              detail:
                'A status update with a glossary is not an update, it is a translation problem.',
              visual: 'tone-meter',
            },
            {
              heading: 'End with the ask',
              bullets: [
                'One decision, not three',
                'A deadline, even a rough one',
                'Or say plainly that no action is needed',
                'Name the next checkpoint',
              ],
              narration:
                'An update without an ask leaves the reader guessing whether they need to do anything. Name one decision, give a deadline, and say when you will write again. If there is no ask, say so plainly: no action needed. Write the ask as a question that can be answered yes or no. Three lines are enough once the decision is clear.',
              detail: 'Write the ask as a question that can be answered yes or no, or by choosing between two options.',
              visual: 'trade-off',
              check: {
                question: 'Which line belongs at the end of an update?',
                options: [
                  'Let me know if you have any questions.',
                  'Do we refund the affected orders? I need an answer by 4pm.',
                  'I will keep you posted.',
                ],
                answerIndex: 1,
                explanation:
                  'A decision with a deadline gives the reader something to do. The other two hand the work back to them.',
              },
            },
          ],
        },
      },
      {
        type: 'quiz',
        title: 'Fix the update',
        xpReward: 15,
        config: {
          questions: [
            {
              prompt:
                'You are two days behind on a migration that nobody outside the team can see. What is the headline?',
              options: [
                'A short summary of what the team tried this week.',
                'The migration is two days late, and nothing in production is affected.',
                'A request for more time, with the reasons attached.',
                'Nothing yet, until you know the new date for certain.',
              ],
              answerIndex: 1,
              explanation:
                'The state comes first, including the reassurance. Waiting for certainty turns a small delay into a surprise.',
            },
            {
              prompt: 'Your update has no decision for the reader. What should you write at the end?',
              options: [
                'Leave the end open so they can reply with anything.',
                'Write: no action needed, next update Thursday.',
                'Ask them to review the whole document.',
                'End with a question about their weekend.',
              ],
              answerIndex: 1,
              explanation:
                'Saying there is no ask is information. It lets the reader close the message instead of wondering.',
            },
            {
              prompt: 'Which sentence is specific enough to act on?',
              options: [
                'There are some concerns about scope.',
                'The scope needs a cut. I recommend dropping export, not import.',
                'Scope is being discussed with stakeholders.',
                'We may need to revisit what is in this release.',
              ],
              answerIndex: 1,
              explanation:
                'It names the problem, takes a position, and gives the reader a decision to confirm or overrule.',
            },
          ],
        },
      },
      {
        type: 'sort',
        title: 'State or activity?',
        xpReward: 20,
        config: {
          instructions: 'The first line of an update should state the situation. Sort each opening line.',
          buckets: ['States the situation', 'Describes activity'],
          items: [
            { text: 'Checkout is fixed, and orders are going through.', bucket: 'States the situation' },
            { text: 'We have been working on the checkout issue.', bucket: 'Describes activity' },
            { text: 'The migration is two days late.', bucket: 'States the situation' },
            { text: 'The team is looking into the database.', bucket: 'Describes activity' },
            { text: 'Payments are not at risk.', bucket: 'States the situation' },
            { text: 'We had a long meeting about scope.', bucket: 'Describes activity' },
          ],
        },
      },
    ],
  },
  {
    title: 'Running a meeting that decides something',
    estimatedMinutes: 15,
    content: `A meeting that produces no decision is a status update with chairs. The fix is not shorter meetings, it is knowing what the meeting is for before anyone joins.

[Video: How to Run an Effective Meeting · Alexander Lyon (short, practical)](https://www.youtube.com/watch?v=iQsw3cdJbbM)

### Name the decision

Every invite carries one line: by the end, we will decide X. If you cannot write that line, the meeting is a document.

Three shapes cover most cases.

- **Decide.** Two options and someone with the authority to choose.
- **Unblock.** Someone is stuck and needs a person with access.
- **Inform.** Nobody decides, and a short written note would do, unless the discussion could change minds.

### Who has to be there

| Person | Why they are there |
|---|---|
| The decider | Someone who can say yes without checking with anyone |
| The builder | Someone who knows what the options cost |
| The affected | Someone who will live with the result |
| Everyone else | Optional. They get the notes |

A meeting with no decider becomes a meeting that schedules another meeting.

### Three minutes of structure

1. **Read the decision question out loud.** It feels slow and it prevents the hour of drift.
2. **Timebox each option.** Ten minutes per option, not thirty minutes of context.
3. **Ask the decider directly.** "Which one?" Silence means the options are not ready, not that everyone agrees.
4. **Write the decision and the owner.** In the meeting, on screen, before people leave.

> A decision without an owner and a date is a hope.

### When the decision does not come

Sometimes the room is not ready. That is a real outcome, and it should be named: "We cannot decide today because we do not know the migration cost. Sam will find the number by Wednesday and we decide by email."

That is a decision about the process. It is much better than ending with "we will take it offline", which usually means nothing happens.

### The notes that get read

Three lines, sent within an hour.

- **Decided:** what changed.
- **Owner:** who acts, by when.
- **Open:** what is still unresolved, and who is finding out.

### Meetings you can cancel

- A status meeting where everyone already posted an update.
- A review with no decision at the end.
- A recurring meeting whose decision was made two weeks ago.

Cancelling one of these is a better use of the hour than attending it.`,
    activities: [
      {
        type: 'slides',
        title: 'Decide, unblock or inform',
        xpReward: 15,
        config: {
          slides: [
            {
              heading: 'One line on the invite',
              bullets: [
                'By the end we decide X',
                'No line means a document',
                'The line filters the room',
                'It also sets the clock',
              ],
              narration:
                'Write the decision on the invitation. If you cannot write it, the meeting has no reason to exist. A note would do the job, and it would cost less. The same line tells people whether they need to attend. It also gives the meeting a natural end, which is what most meetings are missing.',
              detail: 'A vague invite collects people who are worried rather than people who decide.',
              visual: 'three-moves',
            },
            {
              heading: 'Pick one of three shapes',
              bullets: [
                'Decide: two options and one decider',
                'Unblock: someone needs access',
                'Inform: a note would do',
                'Wrong shape wastes the room',
              ],
              narration:
                'Most meetings are one of three shapes. A decision needs options and an owner. An unblock needs one person who can grant access. An inform is usually better as a written note, unless the discussion could genuinely change minds. Naming the shape on the invite stops a meeting from becoming all three at once.',
              detail: 'Naming the shape on the invite stops the meeting from becoming all three at once.',
              visual: 'trade-off',
            },
            {
              heading: 'A decider must be able to say yes',
              bullets: [
                'Not someone who checks later',
                'Not three people with vetoes',
                'One name on the invite',
                'If they cannot come, move the decision',
              ],
              narration:
                'A meeting with three decision makers has none. Pick one person who can say yes without calling anyone afterwards. Say who that person is before the meeting starts. If they cannot attend, move the decision instead of guessing. A room without authority can prepare a decision, but it cannot make one.',
              detail: 'If the real decider is not in the room, send the two options by email instead of deciding by accident.',
              visual: 'tone-meter',
            },
            {
              heading: 'Close in the room',
              bullets: [
                'Say the decision out loud',
                'Name the owner and the date',
                'Write it where everyone can see',
                'Send three lines within the hour',
              ],
              narration:
                'Before anyone leaves, repeat the decision, the owner and the date. People remember what they heard last. This is your only chance to fix a misunderstanding while everyone is still in the room. Then send three lines to the people who came and the ones who did not. Decided, owner, open. If you cannot fill all three, the meeting did not finish.',
              detail: 'Decided, owner, open. If you cannot fill those three, the meeting did not finish.',
              visual: 'dialogue-review',
              check: {
                question: 'A meeting ends with "we will take it offline". What went wrong?',
                options: [
                  'Nothing, that is a normal ending.',
                  'The decision was moved to a place with no owner and no date.',
                  'The meeting was too short.',
                ],
                answerIndex: 1,
                explanation:
                  'Taking it offline is fine when you name who decides and when. Without that, it is a way of ending a meeting without a result.',
              },
            },
          ],
        },
      },
      {
        type: 'sort',
        title: 'Decide or just document?',
        xpReward: 20,
        config: {
          instructions:
            'For each situation, decide whether it needs a meeting with a decision, or a short written note.',
          buckets: ['Needs a decision', 'A note is enough'],
          items: [
            { text: 'Two database options, and one costs a week more.', bucket: 'Needs a decision' },
            { text: 'The weekly progress summary.', bucket: 'A note is enough' },
            { text: 'Whether to delay the release by three days.', bucket: 'Needs a decision' },
            { text: 'The new office wifi password.', bucket: 'A note is enough' },
            { text: 'Which team owns the notification service.', bucket: 'Needs a decision' },
            { text: 'The minutes of yesterday\'s review.', bucket: 'A note is enough' },
          ],
        },
      },
      {
        type: 'quiz',
        title: 'Was that a decision?',
        xpReward: 15,
        config: {
          questions: [
            {
              prompt: 'Which ending counts as a decision?',
              options: [
                'We will take it offline.',
                'Sam picks the cheaper option by Wednesday and writes it in the channel.',
                'The team agrees in principle.',
                'We will revisit it next sprint.',
              ],
              answerIndex: 1,
              explanation:
                'A decision names an owner and a date. The others move the question without resolving it.',
            },
            {
              prompt: 'Nobody in the room can approve the change. What should happen?',
              options: [
                'Vote, and treat the majority as approval.',
                'Name the person who can approve it, and send them the two options in writing.',
                'Decide anyway and tell them afterwards.',
                'Cancel the work.',
              ],
              answerIndex: 1,
              explanation:
                'A room without authority can prepare a decision, not make one. Write it up for whoever can.',
            },
          ],
        },
      },
    ],
  },
  {
    title: 'When something breaks in production',
    estimatedMinutes: 15,
    content: `Something will break, and it will usually break at the worst time. What people remember is not the outage. It is how the team behaved while it was happening and what they said afterwards.

[Video: How Meta runs blameless post-mortems at scale · HAMY LABS](https://www.youtube.com/watch?v=qzzv_Us0hrY)

### The first ten minutes

Resist the urge to debug first. Do these in order.

1. **Contain.** Stop the bleeding: roll back, turn off the feature, or serve the last good version.
2. **Say something.** One short message to the people who will hear about it from their own customers.
3. **Then investigate.** With a second person keeping notes, because nobody remembers the order of events later.

> The person who is typing is not the person who should be talking. Split the two roles out loud.

### What to say in the first hour

| Useful | Useless |
|---|---|
| What is broken, in the user's words | A list of things you tried |
| Who is affected, and how many | Internal service names |
| What you are doing right now | "We are investigating" with no next update time |
| When you will write again, even if nothing changes | A promise that it will not happen again |

The promise is the one that costs you later. You cannot know it after twenty minutes.

### The postmortem is for the system

A blameless postmortem is not politeness. It is the only way to get the real story. If the write-up can end with "Sam was careless", people will stop volunteering what they actually saw, and the next incident will be harder to fix.

Better questions:

- What made this mistake possible?
- Why did the system allow one person to cause this?
- What alarm did not fire, and what would have caught it sooner?
- Which change makes the same class of failure unlikely, not just this instance?

### Owning it without theatre

If you caused it, say so once, plainly, in the write-up. Then spend the rest of the meeting on the system. Apologising three times makes the room comfort you, which is not the work.

> "I shipped the change that broke it. Here is why nothing caught it, and here is what we are changing."

That sentence is the whole apology. Everything after it should be engineering.

### Practice the boring part

Write the first-hour message before you need it. A template with the four fields takes ten minutes to make and saves you from composing under pressure.`,
    activities: [
      {
        type: 'slides',
        title: 'Contain, communicate, then debug',
        xpReward: 15,
        config: {
          slides: [
            {
              heading: 'Stop the bleeding first',
              bullets: [
                'Roll back or turn it off',
                'Serve the last good version',
                'Keep the logs before you revert',
                'Understanding can wait ten minutes',
              ],
              narration:
                'The first action in an outage is to reduce harm, not to understand it. Roll back, turn the feature off, or serve the last good version. Keep the logs before you revert, because the diagnosis can wait ten minutes. A rollback that loses the diagnosis is still cheaper than ten more minutes of users hitting an error page. Ask what makes this worse for the person on the other end.',
              detail: 'Ask one question before you act: what makes this worse for the person on the other end?',
              visual: 'trade-off',
            },
            {
              heading: 'One person talks, one person fixes',
              bullets: [
                'Split the roles out loud',
                'Short status with a real next time',
                'Say who is affected',
                'Silence is read as chaos',
              ],
              narration:
                'Split the work: one person fixes, one person talks. The person talking sends short updates with a real next time attached. Say who is affected and what you are doing right now. Investigating on its own tells people to ask again in ten minutes, which is worse than saying nothing. Name the next update time even if you expect no change.',
              detail: 'Name the next update time even if you expect no change.',
              visual: 'dialogue-client',
            },
            {
              heading: 'What belongs in the first hour',
              bullets: [
                'What broke, in the user words',
                'How many people are affected',
                'What you are doing now',
                'Never a promise it will not repeat',
              ],
              narration:
                'In the first hour, give the impact, the current action and the next update time. Leave out the list of things you tried and the internal names. Never promise that it will not happen again, because after twenty minutes you cannot know. The most expensive sentence in an incident is a guarantee you cannot keep. Everything else can wait for the write-up.',
              detail: 'The most expensive sentence in an incident is a guarantee you cannot keep.',
              visual: 'tone-meter',
            },
            {
              heading: 'The system, not the person',
              bullets: [
                'What made it possible',
                'Which alarm was missing',
                'What changes, with an owner',
                'Owning it once, then engineering',
              ],
              narration:
                'Afterwards, ask what made the mistake possible. A person can always make a mistake; the system decides whether one mistake becomes an outage. Ask which alarm was missing and what would have caught it sooner. If the write-up could end with a name and a verdict, it is not finished. Blameless means no punishment, not no facts.',
              detail: 'Blameless means no punishment, not no facts. Name the change once, then analyse the system.',
              visual: 'three-moves',
              check: {
                question: 'You caused the outage. What belongs in the write-up?',
                options: [
                  'A long apology and an offer to resign.',
                  'One plain sentence that you shipped the change, then the system analysis.',
                  'Nothing about who did it, to keep it blameless.',
                ],
                answerIndex: 1,
                explanation:
                  'Blameless means no punishment, not no facts. Naming the change once is honest; the rest belongs to the system.',
              },
            },
          ],
        },
      },
      {
        type: 'sort',
        title: 'First hour: say it or skip it',
        xpReward: 20,
        config: {
          instructions: 'During the first hour of an outage, which lines belong in the update?',
          buckets: ['Say it', 'Leave it out'],
          items: [
            { text: 'Payments are failing for about one in ten users.', bucket: 'Say it' },
            { text: 'We tried restarting the queue twice.', bucket: 'Leave it out' },
            { text: 'We have rolled back the last change.', bucket: 'Say it' },
            { text: 'This will not happen again.', bucket: 'Leave it out' },
            { text: 'Next update at 3pm, even if nothing changes.', bucket: 'Say it' },
            { text: 'The retry worker lost its lease on the partition.', bucket: 'Leave it out' },
          ],
        },
      },
      {
        type: 'quiz',
        title: 'The first hour',
        xpReward: 15,
        config: {
          questions: [
            {
              prompt: 'Payments are failing for some users. What is the first thing to do?',
              options: [
                'Find the root cause before saying anything.',
                'Contain it: roll back or disable the failing path.',
                'Write the postmortem while it is fresh.',
                'Ask the team who deployed last.',
              ],
              answerIndex: 1,
              explanation: 'Reduce harm first. Diagnosis is easier once users are not being hurt.',
            },
            {
              prompt: 'Which promise should you avoid in the first update?',
              options: [
                'We will update you again at 3pm.',
                'Payments are failing for about one in ten users.',
                'This will not happen again.',
                'We have rolled back the last change.',
              ],
              answerIndex: 2,
              explanation:
                'You cannot know that yet. Promising it early costs credibility exactly when you need it most.',
            },
            {
              prompt: 'What makes a postmortem useful?',
              options: [
                'A clear finding that one person was careless.',
                'A timeline, the system cause, and changes with owners.',
                'A short summary that avoids uncomfortable detail.',
                'A list of everything the team tried.',
              ],
              answerIndex: 1,
              explanation:
                'The changes with owners are the output. The timeline is evidence, and blame ends the flow of evidence.',
            },
          ],
        },
      },
    ],
  },
  {
    title: 'Disagreeing about a technical decision',
    estimatedMinutes: 15,
    content: `Two engineers disagree about a design. One of them is wrong, and neither knows which. The team has to move anyway. This lesson is about doing that without losing the argument, the relationship, or the time.

[Video: Disagree and Commit · Engineering Leadership Community](https://www.youtube.com/watch?v=GNeDTQa4I0A)

### Separate the kinds of claim

Most disagreements are really three different arguments wearing the same clothes.

| Kind | Example | How to settle it |
|---|---|---|
| A fact | "This query takes 400ms today." | Measure it. Nobody votes on a number |
| A principle | "We should not add another service." | Agree on the principle first, then apply it |
| A preference | "I would rather use the other library." | Whoever owns the code decides, and says why |

Facts end quickly. Principles are worth an hour. Preferences should not take one.

### Write the disagreement down

An argument in a meeting is remembered differently by everyone. A short written version is worth ten minutes:

- **The decision:** what we are about to do.
- **My concern:** the specific failure I expect, with a scenario.
- **What would change my mind:** the measurement or event that settles it.

That last line is the one that turns a disagreement into a test. If neither side can name what would change their mind, the disagreement is about taste, and the owner should decide.

> A concern with a scenario is engineering. A concern without one is mood.

### Disagree and commit, properly

Disagree and commit does not mean going quiet. It means:

1. You argued in the open, before the decision.
2. The owner decided, and wrote down the reason.
3. You now build the chosen thing as if you had picked it.

Step three is not acting. A half-built design that "nobody really agreed with" fails slowly and takes the team with it.

### When to escalate

Escalate when the cost of being wrong is high and irreversible, or when the same disagreement keeps returning. Not when you are losing.

Bring the written version, not the story. A manager can act on a scenario and a test; they cannot act on "we had a long argument".

### Afterwards

If you were right, say so once, quietly, and move on. Teams remember the person who was right and gracious, and they avoid the person who was right and loud.`,
    activities: [
      {
        type: 'slides',
        title: 'Fact, principle or taste',
        xpReward: 15,
        config: {
          slides: [
            {
              heading: 'Name the kind of claim',
              bullets: [
                'Facts are measured',
                'Principles are agreed once',
                'Taste belongs to the owner',
                'Naming it shortens the argument',
              ],
              narration:
                'Before arguing, decide what kind of claim you are making. A fact can be measured in an hour. A principle is worth a discussion, because it will come back. A preference should be decided by whoever owns the code, without a meeting. Most long arguments are preferences dressed as principles.',
              detail: 'Most long arguments are preferences dressed as principles.',
              visual: 'trade-off',
            },
            {
              heading: 'Write the concern, not the feeling',
              bullets: [
                'The scenario that worries you',
                'The failure you expect',
                'The measurement that settles it',
                'A test beats an opinion',
              ],
              narration:
                'A concern becomes useful when it has a scenario and a test. This will not scale is a feeling. At two hundred concurrent users this pool runs out, and we will see timeouts in the logs, is something the team can watch for. If you cannot name what would change your mind, you are describing taste. A test beats an opinion every time.',
              detail: 'If you cannot name what would change your mind, you are describing taste.',
              visual: 'tone-meter',
              check: {
                question: 'Which sentence is engineering rather than mood?',
                options: [
                  'This design feels fragile to me.',
                  'I have seen this pattern fail twice. At 200 users we will time out.',
                  'I just do not like it.',
                ],
                answerIndex: 1,
                explanation: 'It names a mechanism and a condition. That is something the team can test.',
              },
            },
            {
              heading: 'Commit means build',
              bullets: [
                'Argue before the decision',
                'Lose in public, gracefully',
                'Then build it properly',
                'Repeating the objection is not commit',
              ],
              narration:
                'After the decision, build the chosen design as if you had chosen it. A half-hearted implementation is the most expensive way to be right. It fails slowly, and it proves nothing. If you still think it is wrong, write the concern down and set a date to check the result. A team can carry a design nobody loved, but it cannot carry one nobody built.',
              detail: 'A team can carry a design nobody loved. It cannot carry one nobody built.',
              visual: 'dialogue-review',
            },
            {
              heading: 'Escalate rarely, and in writing',
              bullets: [
                'High cost and hard to undo',
                'Or a disagreement that keeps returning',
                'Bring the scenario and the test',
                'Not because you are losing',
              ],
              narration:
                'Escalate when being wrong is expensive and hard to reverse. Escalate when the same argument keeps coming back. Do not escalate because you are losing. Bring the written version, not the story, because a manager can act on a scenario and a test. Raising it once in writing beats raising it five times in the corridor.',
              detail: 'Raising it once in writing beats raising it five times in the corridor.',
              visual: 'three-moves',
            },
          ],
        },
      },
      {
        type: 'sort',
        title: 'Fact, principle or preference',
        xpReward: 20,
        config: {
          instructions: 'Sort each statement by the kind of claim it is.',
          buckets: ['Fact', 'Principle', 'Preference'],
          items: [
            { text: 'This query takes 400ms on the current data.', bucket: 'Fact' },
            { text: 'We should not add another service for one feature.', bucket: 'Principle' },
            { text: 'I would rather use the other library.', bucket: 'Preference' },
            { text: 'The last deploy added 30 seconds to the build.', bucket: 'Fact' },
            { text: 'Data that leaves the database should be encrypted.', bucket: 'Principle' },
            { text: 'Tabs are better than spaces in this folder.', bucket: 'Preference' },
          ],
        },
      },
      {
        type: 'quiz',
        title: 'Settle it quickly',
        xpReward: 15,
        config: {
          questions: [
            {
              prompt: 'A teammate says the new query is too slow. What settles it?',
              options: [
                'A vote in the team channel.',
                'Measuring it on realistic data.',
                'Whichever engineer has more experience.',
                'The manager deciding.',
              ],
              answerIndex: 1,
              explanation: 'It is a fact claim. Facts are measured, and the measurement ends the argument in minutes.',
            },
            {
              prompt: 'The decision went against you. What does commit look like?',
              options: [
                'Building it, but noting the risk in every standup.',
                'Building the chosen design properly, with your concern written down.',
                'Quietly building the version you preferred.',
                'Asking a manager to reverse it.',
              ],
              answerIndex: 1,
              explanation:
                'Written concern plus a real implementation. Repeating the objection in every meeting is not commit.',
            },
            {
              prompt: 'When is escalation the right move?',
              options: [
                'Whenever you are losing the argument.',
                'When the cost of being wrong is high and hard to undo.',
                'When the other person is more senior.',
                'Never; teams should always settle it alone.',
              ],
              answerIndex: 1,
              explanation: 'Irreversible, expensive decisions justify a second opinion. Being outvoted does not.',
            },
          ],
        },
      },
    ],
  },
  {
    title: 'Onboarding a new teammate',
    estimatedMinutes: 10,
    content: `A new teammate spends their first week deciding whether this team is organised. That impression is set before they write any code, and it is mostly made of small, cheap things.

### The first day is a checklist, not a welcome speech

Before they start, have these ready.

| Ready before day one | Why it matters |
|---|---|
| Accounts, access, and a laptop that runs the project | Being blocked on day one is the strongest signal of all |
| A written setup path that someone followed recently | If nobody followed it, it is wrong |
| A named buddy for the first two weeks | A person to ask the small questions |
| One small task that can ship in two days | Proof that the path works end to end |

The small task matters more than the tour. Someone who ships on day two believes they can contribute. Someone who reads documentation for a week is not sure.

### Ship something, then read everything

The fastest way to learn a codebase is to change it and watch what breaks. Pick a task that touches the parts they will work in, and that a reviewer can check in an hour.

Pair for the first change, even if they do not need it. Pairing teaches the unwritten rules: how the team names things, when to ask, what a good pull request looks like here.

### The newcomer is the best writer you have

For about two weeks, a new person is the only one who can see what the documentation is missing. Ask them to fix the setup guide as they go. It costs them minutes and saves the next person days.

> A setup guide that has never been followed by a newcomer is a guess.

### What to say in the first week

- What the team is responsible for, and what it is not.
- How work arrives: who decides priority, and where it is written.
- How to get unstuck: the buddy, the channel, the person who knows the deploy.
- What good looks like: one example of a change the team was proud of.

### The review is a gift

At the end of week one, ask two questions: what was confusing, and what would you remove from this week. Write the answers down. They are the only unbiased feedback you will get for a year.

### The test that matters

In two weeks, can they ship a small change without asking where anything is? If not, the problem is the onboarding, not the person.`,
    activities: [
      {
        type: 'slides',
        title: 'The first week is a product',
        xpReward: 15,
        config: {
          slides: [
            {
              heading: 'Unblocked on day one',
              bullets: [
                'Access before the start date',
                'A guide someone followed',
                'A named buddy for two weeks',
                'One task that can ship',
              ],
              narration:
                'Everything a new person needs to run the project should work before they sit down. A missing account on the first morning teaches them that this team is disorganised. That lesson is hard to undo. Ask the last person who joined which step was wrong, because there is always one. Then fix it before the next person arrives.',
              detail: 'Ask the last person who joined which step was wrong. There is always one.',
              visual: 'three-moves',
            },
            {
              heading: 'A checklist beats a welcome speech',
              bullets: [
                'Accounts, editor, database, tests',
                'The channel where questions go',
                'Who knows the deploy process',
                'Written down, not remembered',
              ],
              narration:
                'The first day usually goes wrong for boring reasons. An account is missing, the database will not start, or nobody mentioned the test suite. A checklist written by the team removes those reasons. It is the cheapest thing on this list. If the checklist is right, the new person spends day one working instead of waiting.',
              detail: 'If the checklist is right, the new person spends day one working instead of waiting.',
              visual: 'trade-off',
            },
            {
              heading: 'Ship in the first two days',
              bullets: [
                'Small, real and reviewable',
                'Pair on the first change',
                'Pass on the unwritten rules',
                'Their notes fix your docs',
              ],
              narration:
                'A small shipped change teaches more than a week of reading. Pick something real, small enough to review in an hour. Pair on the first one so the unwritten rules come with it. Ask them to fix the setup guide as they hit each problem. Only they can see the gaps, and the fix costs them minutes.',
              detail: 'The first task is a test of your setup guide as much as of the new person.',
              visual: 'dialogue-review',
            },
            {
              heading: 'The two-week test',
              bullets: [
                'Can they ship without asking where things are',
                'Ask what was confusing',
                'Write the answers down',
                'Fix the process, not the person',
              ],
              narration:
                'In two weeks, can they ship a small change without asking where anything is. If not, the problem is the onboarding. Ask at the end of week one what was confusing, and write the answers down. Change the process rather than the person. Three weeks of basic questions is data about the onboarding, not about the newcomer.',
              detail: 'Three weeks of basic questions is data about the onboarding, not about the newcomer.',
              visual: 'tone-meter',
              check: {
                question: 'A new teammate is still asking basic questions in week three. What is the likely cause?',
                options: [
                  'They are not trying hard enough.',
                  'The onboarding is missing something, and it is worth fixing.',
                  'They should be given more documentation to read.',
                ],
                answerIndex: 1,
                explanation:
                  'Three weeks of basic questions is data about the onboarding. Fixing it helps everyone who joins next.',
              },
            },
          ],
        },
      },
      {
        type: 'sort',
        title: 'Before day one, or during week one?',
        xpReward: 20,
        config: {
          instructions: 'Sort each item by when it should happen.',
          buckets: ['Before day one', 'During week one'],
          items: [
            { text: 'Accounts and repository access.', bucket: 'Before day one' },
            { text: 'A small task that can ship in two days.', bucket: 'Before day one' },
            { text: 'Meet the person who knows the deploy process.', bucket: 'During week one' },
            { text: 'A setup guide that someone has followed.', bucket: 'Before day one' },
            { text: 'Pair on the first real change.', bucket: 'During week one' },
            { text: 'Ask what was confusing, and write it down.', bucket: 'During week one' },
          ],
        },
      },
      {
        type: 'quiz',
        title: 'Fix the first week',
        xpReward: 15,
        config: {
          questions: [
            {
              prompt: 'A new teammate cannot run the project on day one. What should change?',
              options: [
                'Nothing, everyone struggles in week one.',
                'The setup path: someone should follow it before the next person joins.',
                'Give them a longer document to read.',
                'Ask them to pair with someone all week.',
              ],
              answerIndex: 1,
              explanation: 'The setup path is a team product. If it fails once, it fails for everyone who joins.',
            },
            {
              prompt: 'Why is pairing on the first change worth the time?',
              options: [
                'It proves the new person is competent.',
                'It passes on the unwritten rules: naming, review style, when to ask.',
                'It keeps them busy for the week.',
                'It is required by the process.',
              ],
              answerIndex: 1,
              explanation: 'The written rules are in the repository. Pairing is how the rest of them travel.',
            },
          ],
        },
      },
    ],
  },
];
