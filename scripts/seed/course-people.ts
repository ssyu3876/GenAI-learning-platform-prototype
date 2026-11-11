import type { CourseDraft } from '@/core/content/draft';

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

> If they ask a follow-up question, that is a good sign. If they nod politely and change the subject, you lost them.`,
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
              },
              {
                heading: 'Lead with the impact',
                bullets: ['What they felt', 'Then the cause'],
                narration:
                  'Start with what she experienced: between nine and ten, checkout took twelve seconds. The retry storm and the queue can come second. Impact first buys you attention for the cause.',
                visual: 'impact-first',
              },
              {
                heading: 'One analogy, one decision',
                bullets: ['Their world, not yours', 'End with a choice'],
                narration:
                  'Say the queue is like a till that keeps re-scanning the same item. Then end with a decision: a workaround today, or a proper fix by Friday. A choice turns a status update into a plan.',
                visual: 'three-moves',
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

Assume good intent, ask questions when unclear, and remember: comments on your code are not comments on you. On an AI-assisted team, many comments will be about code an agent wrote. Reviewing it together is the point.`,
      activities: [
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

Want a full run? The [practice interviews](/scenarios/interview) ask five questions and end with a debrief on structure, specifics and how you check AI output.`,
      activities: [
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

> Ask yourself after each task: which of the 4Ds did I use? Which did I skip?`,
      activities: [
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

Want to practise? [Sprint Zero](/scenarios/sprint-zero) is three weeks of these trade-offs.`,
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
