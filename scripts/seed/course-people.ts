import type { CourseDraft } from '@/core/content/draft';
import { releaseGameConfig } from '@/modules/scenarios/content/release-week';

export const peopleCourse: CourseDraft = {
  title: 'People Skills for Tech Teams',
  summary:
    'The parts of software work that are not code: explaining things clearly, giving useful feedback, and telling your story in an interview.',
  subject: 'Soft & Product Skills',
  level: 'beginner',
  audience: 'everyone',
  tags: ['communication', 'teamwork', 'interview', 'soft-skills', 'product'],
  emoji: '🤝',
  color: 'mint',
  lessons: [
    {
      title: 'Explaining tech to non-tech people',
      estimatedMinutes: 10,
      content: `Sooner or later you will need to explain a technical problem to someone who does not care about the technology: a client, a manager, a user. They care about **what it means for them**.

This talk walks through the same problem from a practitioner's side:

[Video: How to explain technical things to a non-technical person · Patrick McLean (11 min)](https://www.youtube.com/watch?v=Q5zaQ6CC134)

### Three moves

1. **Lead with the impact.** "Orders placed after 11:30 are not reaching the kitchen" beats "the webhook queue is backing up".
2. **Use an analogy from their world.** A database index is like the index at the back of a book; caching is like keeping the popular dishes pre-made.
3. **End with a decision or next step.** "We can fix it today with a workaround, or properly by Friday. Which do you prefer?"

### Jargon translator

| Instead of… | Try… |
|---|---|
| "We need to refactor the backend" | "We need to tidy up some code so future changes are faster and safer" |
| "There's a race condition" | "Two things happen at the same moment and sometimes trip over each other" |
| "It's deployed to staging" | "It's on our test version of the site, not live yet" |

> If they ask a follow-up question, that is a good sign. If they nod politely and change the subject, you lost them.

### A worked example

The checkout page slowed down for an hour. Here is the same update twice.

**What not to send**

> "We saw elevated p99 latency on the checkout endpoint. The retry queue saturated the connection pool. A fix is deployed."

**What to send**

> "Between 9 and 10, checkout took up to 12 seconds instead of 2. It is fixed now, and orders are going through. We do not yet know why it started; I will tell you by 4pm. Do you need to tell your staff anything today?"

Why the second one works: it names the impact, the current state, the gap and the next checkpoint. The cause is optional. The decision you need from them is explicit.

### What to leave out

- Internal names nobody outside the team uses: service names, queue names, ticket ids.
- A list of everything you tried. Keep the one detail that changes their decision.
- Blame. "The vendor" and "the previous team" are not information they can act on.
- False certainty. "It will not happen again" is a promise you cannot keep after an hour of debugging.

### Turn a status update into a decision

If the message ends with "let me know if you have questions", it is a status update. If it ends with two options and a date, it is a decision. Aim for the second.

### A 60-second checklist

- [ ] The first sentence says what happened to them.
- [ ] The second says whether it is still happening.
- [ ] The gap is named, with a time you will come back.
- [ ] There is one clear next step or decision.
- [ ] No internal names, no blame, no invented certainty.`,
      activities: [
        {
          type: 'slides',
          title: 'The 12-second checkout',
          xpReward: 15,
          config: {
            slides: [
              {
                heading: 'A client, a slow page',
                bullets: ['Checkout took 12 seconds', 'She does not care why'],
                narration:
                  'Meet Dana. She runs online orders for the café. Yesterday, checkout took twelve seconds instead of two. She does not want the cause first. She wants to know what happened, and whether it will happen again.',
                visual: 'dialogue-client',
              },
              {
                heading: 'Lead with the impact',
                bullets: ['What they felt', 'Then the cause'],
                narration:
                  'Start with what she experienced: between nine and ten, checkout took twelve seconds. The retry storm and the queue can come second. Impact first buys you attention for the cause.',
                visual: 'impact-first',
                check: {
                  question: 'Which opening would Dana act on?',
                  options: [
                    'Between 9 and 10, checkout took 12 seconds instead of 2. It is fixed.',
                    'The webhook retry queue saturated the connection pool.',
                    'We observed elevated p99 latency on the checkout endpoint.',
                  ],
                  answerIndex: 0,
                  explanation: 'Impact first; the cause is the second sentence, not the first.',
                },
              },
              {
                heading: 'One analogy, one decision',
                bullets: ['Their world, not yours', 'End with a choice'],
                narration:
                  'Say the queue is like a till that keeps re-scanning the same item. Then end with a decision: a workaround today, or a proper fix by Friday. A choice turns a status update into a plan.',
                visual: 'three-moves',
              },
              {
                heading: 'What she actually needs',
                bullets: ['What happened', 'Whether it will happen again', 'What you need from her'],
                narration:
                  'Dana needs three things: what happened, whether it will happen again, and whether she has to tell her staff. None of them is the retry queue. Answer her three questions before you explain yours.',
                visual: 'dialogue-client',
              },
              {
                heading: 'Say what you do not know',
                bullets: ['Name the gap', 'Give the next checkpoint'],
                narration:
                  'You will not always know the cause. Saying so is better than inventing one: it is fixed, we do not know why yet, we will tell you by four.',
                check: {
                  question: 'You do not know the root cause yet. What do you say?',
                  options: [
                    'It is fixed. I do not know why yet, and I will tell you by four.',
                    'It was probably the database.',
                    'Nothing until we know for certain.',
                  ],
                  answerIndex: 0,
                  explanation: 'Naming the gap and a checkpoint is more trustworthy than a guess.',
                },
              },
              {
                heading: 'Your turn',
                bullets: ['Spot the impact-first message', 'Then name the analogy'],
                narration:
                  'Now try the next two activities. Pick the messages Dana would understand, and the ones that bury the point under jargon.',
              },
            ],
          },
        },
        {
          type: 'sort',
          title: 'Clear or confusing?',
          xpReward: 20,
          config: {
            instructions: 'You are updating a café owner (not technical). Which messages would she understand?',
            buckets: ['Clear for her', 'Too much jargon'],
            items: [
              { text: '"Some orders after 11:30 aren\'t reaching the kitchen. We\'ll fix it by tonight."', bucket: 'Clear for her' },
              { text: '"The webhook retries are exhausting the queue."', bucket: 'Too much jargon' },
              { text: '"The new menu is on our test site. Want to try it before it goes live?"', bucket: 'Clear for her' },
              { text: '"We pushed v2 to staging behind a feature flag."', bucket: 'Too much jargon' },
              { text: '"Card payments are safe: we never see or store the card number."', bucket: 'Clear for her' },
              { text: '"We\'re PCI-compliant via tokenisation."', bucket: 'Too much jargon' },
            ],
          },
        },
        {
          type: 'quiz',
          title: 'Lead with the impact',
          xpReward: 15,
          config: {
            questions: [
              {
                prompt: 'A client asks why the site was slow yesterday. Which opening is best?',
                options: [
                  'Between 9 and 10, checkout took 12 seconds instead of 2. It is fixed, and we are checking why it happened.',
                  'A downstream dependency saturated the connection pool.',
                  'We had a P1 incident in the payment service.',
                  'Intermittent latency affected a subset of requests.',
                ],
                answerIndex: 0,
                explanation: 'Lead with what happened to them, then what you did. The cause can come second.',
              },
              {
                prompt: 'You need a decision from a busy manager. What should the message end with?',
                options: [
                  'Let me know if you have any questions.',
                  'Two options: a workaround today that is safe but slow, or a proper fix by Friday. Which do you prefer?',
                  'I will keep you posted.',
                  'This is urgent and needs attention.',
                ],
                answerIndex: 1,
                explanation: 'A decision with a deadline beats an open-ended update.',
              },
              {
                prompt: 'Which analogy explains a database index to a café owner?',
                options: [
                  'It is a B-tree over the primary key.',
                  'It is like the index at the back of a recipe book: you jump to the page instead of reading every recipe.',
                  'It is a materialised view of the query planner.',
                  'It reduces the asymptotic complexity of lookups.',
                ],
                answerIndex: 1,
                explanation: 'An analogy from their world does work that a definition cannot.',
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Code review without the drama',
      estimatedMinutes: 10,
      content: `Code review is where teams catch bugs and share knowledge. It is also where feelings get hurt. Good reviewers are **specific, kind and focused on the code, not the person**.

### Writing useful comments

- **Be specific:** point at the line and say what could go wrong. "If \`items\` is empty, line 12 divides by zero."
- **Explain why:** "Could we name this \`totalCents\`? I wasn't sure if it was dollars."
- **Suggest, don't command:** "What do you think about…" invites discussion.
- **Separate must-fix from nice-to-have:** prefix small things with "nit:".
- **Say what is good,** too. "Nice test for the empty case!"

### Receiving feedback

Assume good intent, ask questions when unclear, and remember: comments on your code are not comments on you. On an AI-assisted team, many comments will be about code an agent wrote. Reviewing it together is the point.

### What a good comment contains

1. **The location.** A line or a function, not "somewhere in this file".
2. **The failure.** What breaks, for whom, under which input.
3. **The reason.** Why it matters, in one sentence.
4. **A direction.** A fix, a question, or a smaller alternative.

Example: "Line 12 divides by zero when the cart is empty. Empty carts are a real path for new users. Could we return 0 before the max?"

### Comment templates you can copy

| Situation | Template |
|---|---|
| Real bug | "When <input>, <line> does <wrong thing>. Could we <fix>?" |
| Unclear code | "I could not tell whether <name> is <unit A> or <unit B>. Could we rename it?" |
| Small improvement | "nit: <suggestion>. Not blocking." |
| Praise | "<specific thing> made this easier to review. Nice." |
| Question | "What happens if <edge case>? I might be missing context." |

### Must-fix or nice-to-have?

| Must-fix | Nice-to-have |
|---|---|
| Security, data loss, crashes | Naming, formatting, style |
| Broken tests or missing test for the changed path | Extra test for an unlikely edge |
| Behaviour that contradicts the requirement | A cleaner abstraction |
| Something that will page someone at 3am | Something that will annoy someone at 3pm |

If everything is must-fix, nothing is. Prefix small things with "nit:" so the author knows what actually blocks the merge.

### Common mistakes

- Reviewing the person instead of the diff: "why would you…" instead of "line 12 will…".
- Dumping twenty comments with no priority.
- Rewriting the code in a comment instead of describing the change.
- Approving because the tests are green, without reading what the tests cover.
- Saving the one real concern for a private message after approving.

### Before you press submit

- [ ] Every blocking comment says what breaks and where.
- [ ] Nits are labelled.
- [ ] At least one thing that is good is named, specifically.
- [ ] The author can tell what to do next without asking you.
- [ ] You would be glad to receive this review yourself.`,
      activities: [
        {
          type: 'slides',
          title: 'The comment that lands',
          xpReward: 15,
          config: {
            slides: [
              {
                heading: 'A comment has a temperature',
                bullets: ['What you mean', 'What they hear'],
                narration:
                  'A review comment carries two messages: the fix you want, and how much you respect the person. The second one is usually louder.',
                visual: 'tone-meter',
              },
              {
                heading: 'Point at the line',
                bullets: ['Specific beats clever', 'Say what could go wrong'],
                narration:
                  'Point at the line and describe the failure. If the cart is empty, line 12 divides by zero. The author can act on that without guessing.',
                check: {
                  question: 'Which comment can the author act on?',
                  options: [
                    'Line 12 divides by zero when the cart is empty. Return 0 early?',
                    'This is wrong.',
                    'Why would anyone write it like this?',
                  ],
                  answerIndex: 0,
                  explanation: 'A line, a failure and a suggestion. The other two are moods, not reviews.',
                },
              },
              {
                heading: 'Separate must-fix from nit',
                bullets: ['One blocks the merge', 'One can wait'],
                narration:
                  'Say which comments block the merge and which are nits. A review where everything is urgent is a review with no priorities.',
                check: {
                  question: 'Which comment actually blocks the merge?',
                  options: [
                    'Line 8 writes the password into the log.',
                    'This helper could be named totalCents.',
                    'Nit: extra blank line at the end.',
                  ],
                  answerIndex: 0,
                  explanation: 'A leaked credential blocks the merge; the others can wait.',
                },
              },
              {
                heading: 'Say why, not just what',
                bullets: ['The reason is the lesson', 'One sentence is enough'],
                narration:
                  'Naming the unit is clearer than quoting a rule: I could not tell whether totalCents was dollars. The reason lets the author apply the fix to the next line too.',
                visual: 'dialogue-review',
              },
              {
                heading: 'Review the reviewer',
                bullets: ['Would you be glad to receive it?', 'Read it as the author'],
                narration:
                  'Before you send, read the comment as the author. If you would feel attacked, cut the sentence that caused it, not the point you were making.',
                check: {
                  question: 'A review comment feels harsh. What should you change?',
                  options: [
                    'Cut the personal sentence and keep the specific point.',
                    'Delete the whole comment.',
                    'Add an apology at the start.',
                  ],
                  answerIndex: 0,
                  explanation: 'Keep the information; remove the part aimed at the person.',
                },
              },
              {
                heading: 'Your turn',
                bullets: ['Sort the comments', 'Then pick the best review'],
                narration:
                  'Now try the two sorting activities and the etiquette quiz. Notice which comments you would be glad to receive.',
              },
            ],
          },
        },
        {
          type: 'sort',
          title: 'Helpful or unhelpful review comment?',
          xpReward: 20,
          config: {
            instructions: 'Sort these real-looking review comments.',
            buckets: ['Helpful', 'Unhelpful'],
            items: [
              { text: '"If the cart is empty, line 12 divides by zero. Maybe return 0 early?"', bucket: 'Helpful' },
              { text: '"This is wrong."', bucket: 'Unhelpful' },
              { text: '"nit: could we call this totalCents so the unit is clear?"', bucket: 'Helpful' },
              { text: '"Why would anyone write it like this?"', bucket: 'Unhelpful' },
              { text: '"Nice test for the boundary case. Could we add one for negative numbers?"', bucket: 'Helpful' },
              { text: '"Just rewrite the whole thing."', bucket: 'Unhelpful' },
            ],
          },
        },
        {
          type: 'quiz',
          title: 'Review etiquette',
          xpReward: 15,
          config: {
            questions: [
              {
                prompt: 'A teammate\'s PR has one real bug and five tiny style issues. What is the best review?',
                options: [
                  'Flag the bug clearly as must-fix, mark the style points as "nit:"',
                  'Reject the PR without comments',
                  'Fix everything yourself silently',
                  'Only mention the style issues',
                ],
                answerIndex: 0,
                explanation: 'Make priorities obvious so the author knows what actually blocks the merge.',
              },
            ],
          },
        },
        {
          type: 'sort',
          title: 'Must-fix or nice to have?',
          xpReward: 20,
          config: {
            instructions: 'A review with ten "must fix" items is the same as one with none. Sort these.',
            buckets: ['Blocks the merge', 'Nice to have'],
            items: [
              { text: '"Line 8 writes the password into the log."', bucket: 'Blocks the merge' },
              { text: '"This helper could be named totalCents."', bucket: 'Nice to have' },
              { text: '"The retry loop has no cap, so a failing gateway gets hammered."', bucket: 'Blocks the merge' },
              { text: '"Nit: extra blank line at the end."', bucket: 'Nice to have' },
              { text: '"The empty cart path is not tested, and that is the bug we just fixed."', bucket: 'Blocks the merge' },
              { text: '"A for-of loop would read a little better here."', bucket: 'Nice to have' },
            ],
          },
        },
      ],
    },
    {
      title: 'Telling your story: the STAR method',
      estimatedMinutes: 15,
      content: `Behavioural interview questions ("Tell me about a time you…") are not trick questions. The interviewer wants evidence of how you work. The **STAR** structure keeps your answer clear and short:

[Video: How to answer STAR interview questions in 4 minutes · Clark Glassford (4 min)](https://www.youtube.com/watch?v=N5KoRxO4jEk)

| | What to say | Example |
|---|---|---|
| **S**ituation | Where and when, in one sentence | "In my software engineering course, our team had four weeks to build a learning app." |
| **T**ask | What *you* were responsible for | "I owned the leaderboard and our coding standards." |
| **A**ction | What *you* did, with specifics | "I wrote shared rules so everyone's AI agent produced compatible code, and reviewed every PR touching shared files." |
| **R**esult | What happened, ideally with a number | "We merged three prototypes in one day, with zero broken builds." |

### Tips

- Say **"I"**, not only "we". The interviewer is hiring you.
- Keep it under two minutes. Practise out loud.
- Have 3–4 stories ready (a conflict, a mistake, a success, a time you learned fast) and adapt them.
- It is fine to talk about AI tools. Explain how *you* directed and checked them.

Want a full run? The [practice interviews](/scenarios/interview) ask five questions and end with a debrief on structure, specifics and how you check AI output.

### A full answer, in order

> **Situation:** "Last semester, our four-person team had four weeks to build a learning app, and in week three we were two weeks behind."
>
> **Task:** "I owned the leaderboard and the shared coding rules, so I had to get the team back on track without asking people to work weekends."
>
> **Action:** "I split the remaining work into small tasks with one owner each, set a ten-minute check-in every morning, and wrote a one-page rules file so every agent produced compatible code."
>
> **Result:** "We delivered on time, the final demo got the top grade, and nobody worked past seven in the last week."

Notice the details that make it believable: a number in the situation, a boundary in the task ("without weekends"), concrete steps in the action, and a checkable result.

### Handling follow-ups

| They ask | You answer |
|---|---|
| "What did *you* do?" | Pick one action you owned, not the team's collective effort. |
| "What was the result?" | A number, a date, a ranking, or a concrete change. |
| "What would you do differently?" | One real lesson, not "nothing". |
| "How do you use AI?" | What you delegated, what you checked, one mistake you caught. |

### Common pitfalls

- **Too much situation.** Thirty seconds of context and no action is a summary, not a story.
- **"We" all the way through.** The interviewer cannot tell what you did.
- **No result.** "It went well" is not evidence.
- **Memorised script.** It sounds like a script and falls apart on the first follow-up.
- **Hiding the AI.** If the team used agents, saying so and explaining your checks is stronger than pretending you typed every line.

### A practice plan that works

1. Write three stories: a conflict, a mistake, a success.
2. Put each one into the four STAR boxes, one or two sentences per box.
3. Say it out loud, timed. Aim for 90–120 seconds.
4. Record one, listen back, and cut every sentence that does not add a fact.
5. Have someone ask one follow-up per story. If you cannot answer it, the story is not ready.`,
      activities: [
        {
          type: 'slides',
          title: 'One story, four boxes',
          xpReward: 15,
          config: {
            slides: [
              {
                heading: 'A story, not a summary',
                bullets: ['Where and when', 'What you owned'],
                narration:
                  'Behavioural answers are stories. Start with where and when, in one sentence, then say what you were responsible for.',
                visual: 'star-stack',
              },
              {
                heading: 'Situation in one sentence',
                bullets: ['One sentence of context', 'No life story'],
                narration:
                  'Give enough context to understand the stakes, then move on. Last semester, our four-person team was two weeks behind is enough. The interviewer does not need the history of the project.',
                check: {
                  question: 'Which situation sentence is the right length?',
                  options: [
                    'Last semester, our four-person team was two weeks behind.',
                    'It all started when I first became interested in computers.',
                    'We had a project and many things happened.',
                  ],
                  answerIndex: 0,
                  explanation: 'One sentence with stakes; the rest is the story.',
                },
              },
              {
                heading: 'What you did',
                bullets: ['Say I, not we', 'Concrete steps'],
                narration:
                  'The action is the part interviewers score. Say what you did, in order, without hiding behind the team.',
                visual: 'dialogue-interview',
                check: {
                  question: 'Which sentence shows your action?',
                  options: [
                    'I split the work into small tasks and set a daily check-in.',
                    'We did our best under difficult circumstances.',
                    'The team was great to work with.',
                  ],
                  answerIndex: 0,
                  explanation: 'A concrete step you took; the others describe the weather.',
                },
              },
              {
                heading: 'The result needs evidence',
                bullets: ['What changed', 'A number if you have one'],
                narration:
                  'End with what changed: shipped on time, cut the queue in half, top grade in the class. A result without evidence sounds like a hope.',
                check: {
                  question: 'Which result is evidence?',
                  options: [
                    'We delivered on time and the demo got the top grade.',
                    'It went really well overall.',
                    'Everyone was happy with the outcome.',
                  ],
                  answerIndex: 0,
                  explanation: 'A date and a ranking can be checked; "well" cannot.',
                },
              },
              {
                heading: 'Talk about AI honestly',
                bullets: ['What you handed over', 'How you checked it'],
                narration:
                  'AI is part of the story now. Say what you handed over and how you checked it. That is a skill, not a confession.',
              },
              {
                heading: 'Your turn',
                bullets: ['Build the STAR answer', 'Then practise with Jordan'],
                narration:
                  'Put the sentences in order, then run the mock interview. Keep the whole answer under two minutes.',
              },
            ],
          },
        },
        {
          type: 'sequence',
          title: 'Build a STAR answer',
          xpReward: 20,
          config: {
            instructions: 'Put these sentences in STAR order to make a strong answer.',
            steps: [
              'Last semester our team project was two weeks behind schedule.',
              'As the team lead, I had to get us back on track without burning people out.',
              'I split the remaining work into small tasks and set up a 10-minute daily check-in.',
              'We delivered on time, and our final demo got the top grade in the class.',
            ],
          },
        },
        {
          type: 'quiz',
          title: 'STAR or rambling?',
          xpReward: 15,
          config: {
            questions: [
              {
                prompt: 'Which sentence belongs in the Result?',
                options: [
                  'We had four weeks and a team of five.',
                  'I split the work into small tasks and set a daily check-in.',
                  'We delivered on time and the demo got the top grade.',
                  'I was the team lead for that project.',
                ],
                answerIndex: 2,
                explanation: 'The result is the outcome. Situation, task and action come before it.',
              },
              {
                prompt: 'An answer describes the project and the team but never says what you did. Which part is missing?',
                options: ['Situation', 'Task', 'Action', 'Result'],
                answerIndex: 2,
                explanation: 'Interviewers hire you, not the team. Say what you did.',
              },
              {
                prompt: 'What is the best way to keep a STAR answer under two minutes?',
                options: [
                  'Memorise one answer word for word and use it for every question.',
                  'Prepare three or four stories and adapt the one that fits.',
                  'Speak faster.',
                  'Skip the Result to save time.',
                ],
                answerIndex: 1,
                explanation: 'A small set of real stories covers most questions without sounding rehearsed.',
              },
            ],
          },
        },
        {
          type: 'roleplay',
          title: 'Mock interview with Jordan',
          xpReward: 45,
          config: {
            scenario: 'You are interviewing for a junior software engineer internship at a mid-size tech company. Jordan, an engineering manager, runs the behavioural part of the interview.',
            persona: 'Jordan',
            personaRole: 'Engineering manager interviewing you for an internship',
            personaBrief:
              'Friendly, professional, curious. Asks one behavioural question at a time: first "Tell me about a time you worked in a team that disagreed", then follows up on vague parts ("What did YOU do specifically?", "What was the result?"), then asks "How do you use AI tools in your work, and how do you check what they produce?". Rewards specific, structured answers. Never gives feedback during the interview.',
            learnerRole: 'Internship candidate',
            goals: ['Answer with a clear STAR structure', 'Talk about what YOU did, with specifics', 'Explain how you check AI-generated work'],
            opening: 'Thanks for joining today. To start, tell me about a time you worked in a team where people disagreed. What happened?',
            rubric: [
              { criterion: 'Structure (STAR)', description: 'Situation, task, action and result are all there and easy to follow' },
              { criterion: 'Specific personal actions', description: 'Uses "I", concrete steps, not just "we did stuff"' },
              { criterion: 'Results and reflection', description: 'Gives an outcome and what was learned' },
            ],
            maxTurns: 6,
            mockReplies: [
              'Interesting. What did you personally do to resolve it?',
              'And what was the outcome? How did you know it worked?',
              'Thanks. Next question: how do you use AI tools in your work, and how do you check what they produce?',
              'Can you give me a concrete example of catching a mistake an AI made?',
              'Great. Last one: what would you do differently next time?',
              'Thanks, that is all from me. Do you have any questions for us?',
            ],
          },
        },
      ],
    },
    {
      title: 'Working on a team that uses AI',
      estimatedMinutes: 8,
      content: `When everyone has an AI assistant, teamwork changes. Three people with three agents can produce three different styles of code in an afternoon. A few team habits keep things sane:

- **Agree on shared rules once** (stack, naming, folder structure) and give them to every agent. Our project keeps them in \`AGENTS.md\`.
- **Be open about AI use.** In each pull request, note what the AI wrote and what you checked. It makes reviews faster and builds trust.
- **Share good prompts.** If a brief worked well, paste it in the team chat. Prompts are team knowledge now.
- **Review each other's AI output.** A second pair of eyes catches what your agent and you both missed.
- **Own the result.** "The AI did it" is never an answer in a retro.

> Ask yourself after each task: which of the 4Ds did I use? Which did I skip?

### What goes in the shared rules file

A short file is enough. Keep it boring and specific:

- **Stack and versions.** Framework, language, package manager, test runner.
- **Structure.** Where pages, components, tests and shared helpers live.
- **Naming.** Files, components, database columns, event names.
- **Commands.** Install, run, test, lint, migrate.
- **Review rules.** What counts as must-fix, who reviews, how big a PR should be.
- **AI rules.** What an agent may change without asking, and what it must never touch.

Every agent gets the same file. When a rule changes, change it once and tell the team.

### A pull request that explains its AI use

> **What the agent wrote:** the settings form and its validation.
> **What I changed:** moved the permission check into the API route, added a test for the empty state.
> **What I checked:** ran the suite, clicked through as a learner, read the diff for anything touching auth.
> **What I did not verify:** the email preview in a real inbox.

Four lines. The reviewer knows where to look and what is still uncertain.

### What to check in AI output

- [ ] **Intent:** does it do the thing the task asked for, not a nearby thing?
- [ ] **Tests:** do they assert behaviour, or just run the code?
- [ ] **Edges:** empty, missing, duplicated, unauthorised.
- [ ] **Security:** secrets, logs, permissions, raw input.
- [ ] **Size:** is this one reviewable change or three changes in a trench coat?

### Retro language

| Instead of | Say |
|---|---|
| "The AI did it." | "I merged it without testing the edge case." |
| "Nobody told me to test." | "I will add the missing test before the next release." |
| "It worked on my machine." | "The staging data differs; here is how I will make them match." |

Ownership is a change you can make, not a place to point.

### Team checklist

- [ ] Everyone has the same rules file.
- [ ] Every AI-assisted PR says what the agent wrote and what was checked.
- [ ] A second person reviews changes to shared or auth code.
- [ ] Good prompts are shared, not kept private.
- [ ] The retro talks about the process, not the tool.`,
      activities: [
        {
          type: 'slides',
          title: 'Three people, one release',
          xpReward: 15,
          config: {
            slides: [
              {
                heading: 'Three agents, three styles',
                bullets: ['Shared rules once', 'One file every agent reads'],
                narration:
                  'Three people with three agents produce three styles in an afternoon. Agree the stack, the naming and the structure once, and give every agent the same rules file.',
              },
              {
                heading: 'Say what the AI wrote',
                bullets: ['In the pull request', 'What you checked'],
                narration:
                  'Write down what the agent wrote and what you checked. It makes the review faster and tells the team where to look first.',
                visual: 'dialogue-review',
              },
              {
                heading: 'Review the output together',
                bullets: ['A second pair of eyes', 'Catch what you both missed'],
                narration:
                  'The author and the agent share the same blind spot. A reviewer who did not write the prompt is the cheapest way to find it.',
                check: {
                  question: 'Why review AI-written code with a teammate?',
                  options: [
                    'A fresh reader catches what the author and the agent both missed.',
                    'The agent learns from the review.',
                    'It makes the pull request shorter.',
                  ],
                  answerIndex: 0,
                  explanation: 'Different context, different blind spots.',
                },
              },
              {
                heading: 'Own the result',
                bullets: ['"The AI did it" is not an answer', 'Fix the process, not the blame'],
                narration:
                  'In a retro, the useful sentence is what you will change next time: a test first, a smaller slice, a second reader. The agent cannot attend the retro, so the ownership stays with you.',
                check: {
                  question: 'An AI-written feature broke production. What belongs in the retro?',
                  options: [
                    'What I will change in the process next time.',
                    'That the AI wrote it.',
                    'That nobody told me to test it.',
                  ],
                  answerIndex: 0,
                  explanation: 'Ownership is a change you can make, not a place to point.',
                },
              },
              {
                heading: 'Your turn',
                bullets: ['Check your team habits', 'Then run the release week'],
                narration:
                  'Try the habits quiz, then play the short release game. Every decision there is a team decision, made under a date.',
              },
            ],
          },
        },
        {
          type: 'quiz',
          title: 'Team habits check',
          xpReward: 15,
          config: {
            questions: [
              {
                prompt: 'Three teammates use different AI agents and the code styles clash. What is the best fix?',
                options: [
                  'Agree on shared rules (stack, naming, structure) and give the same rules file to every agent',
                  'Everyone switches to the same agent',
                  'Ban AI tools',
                  'Let the last person to commit decide',
                ],
                answerIndex: 0,
                explanation: 'Shared, written rules work with any tool and also help new teammates.',
              },
              {
                prompt: 'Your AI-written feature broke production. In the retro, you say…',
                options: [
                  '"I merged it without testing the edge case. Next time I will add a test first."',
                  '"The AI did it."',
                  '"Nobody told me to test it."',
                  '"It worked on my machine."',
                ],
                answerIndex: 0,
                explanation: 'Diligence means owning the result and improving the process.',
              },
            ],
          },
        },
        {
          type: 'roleplay',
          title: 'The slipping release',
          xpReward: 45,
          config: {
            scenario: 'Two days before release, a review finds a bug that can log users out at random. You have to tell your lead the date moves.',
            persona: 'Priya',
            personaRole: 'Engineering lead on the release',
            personaBrief:
              'Direct, calm, allergic to vague updates. Wants the headline first, then the impact and the options. Pushes back on "it should be fine". Cares more about the team not burning out than about the date itself. Never proposes the solution for you.',
            learnerRole: 'Engineer who owns the release',
            goals: [
              'Say the headline first: the date moves',
              'Own what you know and what you do not',
              'Offer two realistic options with a trade-off',
              'Agree the next step and who decides',
            ],
            opening: 'You asked for five minutes. What is going on?',
            rubric: [
              { criterion: 'Headline first', description: 'States the slip before the technical detail' },
              { criterion: 'Clear options', description: 'Gives two realistic options and what each costs' },
              { criterion: 'Ownership', description: 'Says what happens next without blaming the AI or the team' },
            ],
            maxTurns: 6,
            mockReplies: [
              'Okay. How bad is it, and who is affected?',
              'When did we find this? Was it in the review or in production?',
              'What are the options? I do not want "we will try harder".',
              'If we ship on Friday anyway, what breaks?',
              'Who needs to hear this, and who tells them?',
              'Alright. Send me the two options in writing after this, and we decide at standup.',
            ],
          },
        },
        {
          type: 'release-run',
          title: 'Release Week: the small version',
          xpReward: 30,
          config: releaseGameConfig(),
        },
      ],
    },
    {
      title: 'Saying no without burning trust',
      estimatedMinutes: 10,
      content: `Saying no is part of the job. The deadline cannot move, the scope cannot grow, and the tests cannot be skipped — someone has to say so. The difference between a useful no and a rude one is what you offer instead.

### Three moves

1. **Say what you can do.** "I can get the export fix out by Friday" opens better than "I cannot do this week".
2. **Name the constraint, once.** "The release is Thursday and the tests take a day." Facts, not mood.
3. **Offer a choice.** "Do you want the export first, or the new dashboard?" A choice keeps the other person in charge.

If the conversation matters, write it down afterwards: what was agreed, who does what, and when you check again.

### What burns trust

- **The silent yes.** Agreeing now and hoping is how dates quietly break.
- **"That's not my job."** The boundary may be right; the sentence closes the relationship.
- **A no with no follow-up.** Silence leaves the other person guessing.

> A no without an alternative is a closed door. A no with one is a plan.

Want to practise? [Sprint Zero](/scenarios/sprint-zero) is three weeks of these trade-offs.

### A script you can say out loud

> "I cannot add it before Friday. Testing the release takes a full day, and Friday is fixed. I can either ship this on Tuesday, or swap it for the export fix and keep Friday. Which matters more to you?"

Four sentences: what you cannot do, why, two options, and a question that hands the decision back. No apology paragraph, no maybe.

The written version is three lines: the constraint, the two options, the date you will check again.

### Choosing the trade

| Request | Real cost | A trade you can offer |
|---|---|---|
| "One small feature" | A permission model + testing | Ship it Tuesday, or drop another item |
| "Can you join this meeting?" | Half a day of build time | Send notes, or attend the first ten minutes |
| "Skip the tests once" | A bug in production | A smaller test subset, run together |
| "Can you own this too?" | Your current deadline | Hand over one of your existing items |

The trade is not a trick to avoid the work. It makes the cost visible to the person choosing it.

### When they push back

- **"It is urgent."** Ask what happens if it ships Tuesday. Urgency without a consequence is a preference.
- **"Everyone else does it."** Point at the date and the testing time, not at other teams.
- **"Just try."** Offer a smaller version you can actually finish, with a date.
- **Silence.** Follow up in writing. An unanswered request is not an agreement.

### Common mistakes

- Saying yes and hoping. The date breaks later, louder.
- A no with no alternative. It closes the conversation and the relationship.
- Over-explaining. Three reasons sound like excuses; one constraint sounds like a fact.
- Refusing the person instead of the request.
- Promising a date you have not checked with the team.

### Before you send the no

- [ ] The constraint is one sentence and it is true.
- [ ] There are two real options, not one option and a threat.
- [ ] The next date is one the team can actually hit.
- [ ] It is in writing if the decision matters.
- [ ] You said no to the request, not to the person.`,
      activities: [
        {
          type: 'slides',
          title: 'The no that kept the client',
          xpReward: 15,
          config: {
            slides: [
              {
                heading: 'The ask that does not fit',
                bullets: ['Launch is Friday', 'The request arrives Wednesday'],
                narration:
                  'It is Wednesday. The launch is Friday. A client asks for one more feature, and the honest answer is no. The question is not whether to say it. It is what comes after the no.',
                visual: 'dialogue-client',
              },
              {
                heading: 'Say what you can do',
                bullets: ['"Not this week" is not a plan', 'Offer the next real date'],
                narration:
                  'A bare no leaves the client with nothing. I cannot add it before Friday, but I can ship it on Tuesday gives them a date they can plan around.',
              },
              {
                heading: 'Trade, do not refuse',
                bullets: ['Name the constraint once', 'Offer two options'],
                narration:
                  'Name the constraint once: the launch is Friday and testing takes a day. Then offer the trade: the new feature, or the export fix. Now the client is choosing, not arguing.',
                visual: 'trade-off',
                check: {
                  question: 'What makes this a trade rather than a refusal?',
                  options: [
                    'The client gets two real options and picks one.',
                    'You apologise several times.',
                    'You promise to try harder.',
                  ],
                  answerIndex: 0,
                  explanation: 'A choice moves the decision back to the client without reopening the date.',
                },
              },
              {
                heading: 'Write it down',
                bullets: ['What was agreed', 'When you check again'],
                narration:
                  'After the call, send three lines: what was agreed, who does what, and when you check again. Memory is not a project plan, and a written trade is harder to reopen by accident.',
                check: {
                  question: 'What belongs in the follow-up message?',
                  options: [
                    'The agreement, the owner and the next checkpoint.',
                    'A long explanation of why the request was hard.',
                    'Nothing; the call was enough.',
                  ],
                  answerIndex: 0,
                  explanation: 'Three facts the other person can act on.',
                },
              },
              {
                heading: 'Protect the relationship',
                bullets: ['No to the request, yes to the person', 'No silent yes'],
                narration:
                  'You are refusing a request, not a person. Keep the relationship by being early, specific and consistent. The silent yes is the one that costs the relationship later.',
              },
              {
                heading: 'Your turn',
                bullets: ['Sort the replies that keep trust', 'Then pick the best no'],
                narration:
                  'Try the sort and the quiz next. Every option turns something down. Only some of them keep the relationship.',
              },
            ],
          },
        },
        {
          type: 'sort',
          title: 'Keeps trust or burns it?',
          xpReward: 20,
          config: {
            instructions: 'These are all ways to turn something down. Which ones keep the relationship?',
            buckets: ['Keeps trust', 'Burns trust'],
            items: [
              { text: '"I can\'t do it this week. I can do next Tuesday, or hand it to Sam — which works?"', bucket: 'Keeps trust' },
              { text: '"That\'s not my job."', bucket: 'Burns trust' },
              { text: '"I\'ll try" and then nothing for a week.', bucket: 'Burns trust' },
              { text: '"The deadline is fixed. Here is what I can drop to make room."', bucket: 'Keeps trust' },
              { text: '"Yes, sure" and then quietly work the weekend.', bucket: 'Burns trust' },
              { text: '"No for now, and here is what would change my answer."', bucket: 'Keeps trust' },
            ],
          },
        },
        {
          type: 'quiz',
          title: 'The polite no',
          xpReward: 15,
          config: {
            questions: [
              {
                prompt: 'Your manager adds "one small feature" two days before release. What is the best response?',
                options: [
                  'We can add it after release on Tuesday, or swap it for the export fix. Which do you want first?',
                  'Sure, I will squeeze it in.',
                  'That is impossible.',
                  'The AI can probably do it, ask it.',
                ],
                answerIndex: 0,
                explanation: 'A trade, not a refusal. It keeps the date honest and leaves the choice with them.',
              },
              {
                prompt: 'A teammate asks you to skip the tests "just this once". What protects the relationship?',
                options: [
                  'Explain what the tests caught last time and offer to pair on a faster subset.',
                  'Say no and walk away.',
                  'Report them to the lead.',
                  'Agree, then run the tests anyway without telling them.',
                ],
                answerIndex: 0,
                explanation: 'The boundary stays, and you give them a path that still ships safely.',
              },
              {
                prompt: 'You have to decline a request in writing. What should the message contain?',
                options: [
                  'An apology and no alternative.',
                  'The constraint, what you can do instead, and a date to check back.',
                  'A list of everything else you are working on.',
                  'Nothing; silence is safer.',
                ],
                answerIndex: 1,
                explanation: 'Something they can act on beats an apology they cannot use.',
              },
            ],
          },
        },
      ],
    },
  ],
};
