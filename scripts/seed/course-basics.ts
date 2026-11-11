import type { CourseDraft } from '@/core/content/draft';

export const basicsCourse: CourseDraft = {
  title: 'How Software Gets Built',
  summary:
    'Follow a small student team from "we should make an app" to a working release. No coding needed: this is about how the work is organised.',
  subject: 'Software Engineering',
  level: 'beginner',
  audience: 'everyone',
  tags: ['fundamentals', 'sdlc', 'requirements', 'teamwork', 'testing'],
  emoji: '🛠️',
  color: 'coral',
  lessons: [
    {
      title: 'From idea to app: the life of a feature',
      estimatedMinutes: 18,
      content: `Meet **CampusEats**: four students who want to let classmates pre-order lunch from the canteen so they can skip the queue.

Nobody starts by typing code. Before a single line is written, the team goes through a loop that almost every software project shares:

| Stage | The question it answers | CampusEats example |
|---|---|---|
| Understand | What problem are we solving, and for whom? | The lunch queue takes 20 minutes |
| Plan | What do we build first? | Ordering before payments |
| Design | How will it look and fit together? | Sketch the order screen |
| Build | Make it work | Write the order form and a simple database |
| Test | Does it really work? | Try 30 fake orders at once |
| Release | Get it to real users | Launch for one canteen |
| Learn | What did users actually do? | People want "order again" |

A university lecture walks through the same stages. It calls them the phases of the *software development life cycle* (SDLC):

[Video: SDLC Part 1 · K-State Computational Core (10 min, CC BY-NC-SA 4.0)](https://youtu.be/KXHfIKWltGc)

### It is a loop, not a line

After "Learn", the team goes back to "Understand" with new information. Each trip around the loop is short (often one or two weeks). That way, if they are building the wrong thing, they find out early, while it is still cheap to change.

> **Takeaway:** good teams spend a surprising amount of time *before* and *after* coding. That is where most expensive mistakes are caught.`,
      activities: [
        {
          type: 'slides',
          title: 'Pip explains the software loop',
          xpReward: 15,
          config: {
            slides: [
              { heading: 'Software is built in loops', visual: 'software-loop', bullets: ['Understand → Plan → Design', 'Build → Test → Release → Learn'], narration: 'Here is the big secret: software is not built in one straight line. Teams go round a loop, again and again.' },
              { heading: 'Why loops?', bullets: ['Find mistakes early', 'Change is cheaper at the start'], narration: 'Fixing a wrong idea on a whiteboard costs minutes. Fixing it after launch can cost months. Short loops catch problems early.' },
              { heading: 'Coding is one stage of seven', bullets: ['Lots of thinking before', 'Lots of checking after'], narration: 'Notice that writing code is only one of the seven stages. The thinking before and the checking after matter just as much.' },
              { heading: 'Your turn', bullets: ['Put the stages in order', 'Think about CampusEats'], narration: 'Now let us see if you can put the stages in the right order. Picture the CampusEats team as you go.' },
            ],
          },
        },
        {
          type: 'sequence',
          title: 'Put the CampusEats journey in order',
          xpReward: 20,
          config: {
            instructions: 'The CampusEats team did these things for their first version. What order did they happen in?',
            steps: [
              'Interview students about the lunch queue',
              'Decide to build ordering before payments',
              'Sketch the order screen on paper',
              'Build the order form and database',
              'Test with 30 fake orders',
              'Launch at one canteen',
              'Notice people want "order again"',
            ],
          },
        },
        {
          type: 'quiz',
          title: 'Where do they go next?',
          xpReward: 20,
          config: {
            questions: [
              {
                prompt: 'After launch, many students leave the app on the payment screen. What should the CampusEats team do first?',
                options: [
                  'Go back to Understand: ask a few students why they gave up',
                  'Rebuild the payment screen straight away',
                  'Release the same version to more canteens',
                  'Add more fake orders to the tests',
                ],
                answerIndex: 0,
                explanation: 'They do not know the cause yet. Asking a few students is cheaper than guessing and rebuilding.',
              },
              {
                prompt: 'In testing, orders with more than 10 items crash the app. What happens next?',
                options: [
                  'Release anyway and fix it later',
                  'Delete the test that failed',
                  'Fix it in Build, then run the tests again',
                  'Start the whole project again from Understand',
                ],
                answerIndex: 2,
                explanation: 'A failed test sends that one problem back to Build. Once it is fixed, the team tests again.',
              },
              {
                prompt: 'Why is a two-week loop safer than one big six-month plan?',
                options: [
                  'Two weeks is the usual legal minimum for a project',
                  'Mistakes show up while they are still cheap to fix',
                  'Users cannot give feedback during long projects',
                  'Short loops do not need testing',
                ],
                answerIndex: 1,
                explanation: 'Every loop ends with real feedback, so the team never builds the wrong thing for long.',
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Requirements: what are we actually building?',
      estimatedMinutes: 25,
      content: `A **requirement** is something the software must do or be. Vague requirements are the number one reason projects go wrong: "make it easy to use" means something different to everyone.

### User stories

Teams often write requirements as short **user stories**:

> As a **student**, I want to **save my usual order** so that **I can reorder in one tap**.

Three parts: *who* wants it, *what* they want, and *why*. The "why" is the part people skip, and it is the most useful: it tells the team what problem they are really solving.

Mike Cohn, one of the people who made user stories popular, shows how teams write them in practice:

[Video: What Is a User Story in Agile? · Mountain Goat Software (9 min)](https://youtu.be/kkihaNjwRik)

### Acceptance criteria

A story is not finished until everyone agrees how to check it. Acceptance criteria make that concrete:

- Given I have ordered before, when I open the app, I see "Order again"
- Tapping it fills the cart with my last order
- I can still change items before paying

### From vague to testable

A requirement is testable when two people would agree on whether it is met. Replace adjectives with numbers, people and situations:

| Vague | Testable |
|---|---|
| "The app should be fast" | "The menu loads in under 2 seconds on 4G" |
| "Easy to use" | "A first-time user can place an order in under 1 minute without help" |
| "Secure payments" | "Card details are handled by the payment provider and never stored on our server" |
| "Works for everyone" | "Every button can be reached with a phone screen reader" |

### Functional vs non-functional

- **Functional** requirements are *what the system does*: "students can cancel an order".
- **Non-functional** requirements are *how well it does it*: speed, security, accessibility, cost. "The menu loads in under 2 seconds on mobile data."

Non-functional requirements are easy to forget and painful to add later. Ask about them early.`,
      activities: [
        {
          type: 'slides',
          title: 'Pip explains user stories',
          xpReward: 15,
          config: {
            slides: [
              {
                heading: 'Three parts of a user story',
                visual: 'user-story',
                bullets: ['Who: "As a student…"', 'What: "…I want to save my usual order…"', 'Why: "…so that I can reorder in one tap"'],
                narration: 'A user story fits on a sticky note, and it has three parts. First, who wants it: a student. Second, what they want: to save their usual order. Third, the part people skip, why: so they can reorder in one tap.',
              },
              {
                heading: 'From vague to testable',
                visual: 'vague-to-testable',
                bullets: ['Vague: "the app should be fast"', 'Testable: "the menu loads in under 2 seconds on 4G"', 'Check it: a clear yes or no'],
                narration: 'Fast means something different to everyone, so nobody can check it. Swap the adjective for a number: the menu loads in under two seconds on 4G. Now anyone can test it and get a clear yes or no.',
              },
              {
                heading: 'What it does, and how well',
                bullets: ['Functional: what the system does', 'Non-functional: speed, security, accessibility', 'Ask about both early'],
                narration: 'Functional requirements say what the system does, like letting a student cancel an order. Non-functional ones say how well it does it: speed, security, accessibility and cost. Those are easy to forget and painful to add later, so ask about them on day one.',
              },
              {
                heading: 'Your turn',
                bullets: ['Sort the CampusEats requirements', 'Then catch the vague ones'],
                narration: 'Now try it with real CampusEats requirements. Sort them first, then catch the ones that are too vague to test.',
              },
            ],
          },
        },
        {
          type: 'sort',
          title: 'Functional or non-functional?',
          xpReward: 20,
          config: {
            instructions: 'Sort these CampusEats requirements.',
            buckets: ['Functional', 'Non-functional'],
            items: [
              { text: 'Students can cancel an order before 11:30', bucket: 'Functional' },
              { text: 'The menu loads in under 2 seconds on 4G', bucket: 'Non-functional' },
              { text: 'Canteen staff see new orders on a tablet', bucket: 'Functional' },
              { text: 'Works with a phone screen reader', bucket: 'Non-functional' },
              { text: 'Students get a notification when food is ready', bucket: 'Functional' },
              { text: 'Card details are never stored on our server', bucket: 'Non-functional' },
              { text: 'Handles 500 orders in the lunch rush', bucket: 'Non-functional' },
              { text: 'Students can save a favourite order', bucket: 'Functional' },
            ],
          },
        },
        {
          type: 'quiz',
          title: 'User story check',
          xpReward: 20,
          config: {
            questions: [
              {
                prompt: 'Which of these is a well-formed user story?',
                options: [
                  'As a canteen manager, I want a daily order summary so that I can prepare the right amount of food.',
                  'Add a summary page.',
                  'The system shall use a PostgreSQL database.',
                  'Make the app faster.',
                ],
                answerIndex: 0,
                explanation: 'It names who (canteen manager), what (daily summary) and why (prepare the right amount).',
              },
              {
                prompt: 'Why is the "so that…" part of a user story useful?',
                options: ['It tells the team the real problem being solved', 'It makes the story longer', 'It is required by law', 'It decides the programming language'],
                answerIndex: 0,
                explanation: 'Knowing the goal lets the team suggest simpler or better solutions.',
              },
              {
                prompt: 'What are acceptance criteria for?',
                options: ['Agreeing how we will check a story is done', 'Estimating the price', 'Choosing who writes the code', 'Naming the database tables'],
                answerIndex: 0,
                explanation: 'They turn "done" into something you can actually test.',
              },
            ],
          },
        },
        {
          type: 'sort',
          title: 'Testable or too vague?',
          xpReward: 20,
          config: {
            instructions: 'Could the CampusEats team check each requirement with a clear yes or no?',
            buckets: ['Testable', 'Too vague'],
            items: [
              { text: 'Orders placed after 11:30 are rejected with a message', bucket: 'Testable' },
              { text: 'The app should feel modern', bucket: 'Too vague' },
              { text: 'A receipt email arrives within 1 minute of paying', bucket: 'Testable' },
              { text: 'The menu is easy to browse', bucket: 'Too vague' },
              { text: 'Staff can mark an order as ready in one tap', bucket: 'Testable' },
              { text: 'The system must be very reliable', bucket: 'Too vague' },
              { text: 'The app is available 99% of the time between 11:00 and 14:00', bucket: 'Testable' },
              { text: 'Users should like the design', bucket: 'Too vague' },
            ],
          },
        },
      ],
    },
    {
      title: 'Talking to your first client',
      estimatedMinutes: 28,
      content: `Clients rarely know exactly what they need. They know what *hurts*. Your job in a requirements conversation is to find the pain behind the request.

Watch a business analyst go through the questions worth asking in a first requirements meeting:

[Video: Requirements Elicitation – What Questions to Ask · Bridging the Gap (9 min)](https://youtu.be/eTcTl_LrQGY)

### Habits that work

1. **Ask open questions.** "What happens at lunchtime?" gets a story. "Do you want an app?" gets a yes.
2. **Ask why, more than once.** "Why do you want an app?" → "To be modern." → "Why does that matter?" → "Because regulars leave when the queue is long." Now you know the real goal.
3. **Ask about constraints early:** budget, deadline, who will use it, what already exists.
4. **Summarise back.** "So the real problem is the lunch queue, the budget is small and it needs to work before summer. Did I get that right?"
5. **Do not design during the meeting.** Write things down, promise a proposal later.

### Common traps

- Agreeing to features before understanding the problem
- Using jargon ("we'll spin up a backend") that makes the client nod without understanding
- Forgetting to ask who the *users* are, which may not be the client

> In the role-play below, Mrs. Lau will only tell you the useful details if you ask good questions. Warm up first by sorting questions into open and closed ones.`,
      activities: [
        {
          type: 'slides',
          title: 'Pip\'s tips for a first client meeting',
          xpReward: 15,
          config: {
            slides: [
              {
                heading: 'Find the problem behind the request',
                visual: 'why-ladder',
                bullets: ['"I need an app"', 'Why? "Apps look modern"', 'Why? "Regulars walk out at lunch"', 'The real need: a shorter lunch queue'],
                narration: 'Clients often arrive with a solution, not a problem. The café owner starts with: I need an app. Ask why, and she says apps look modern. Ask why again, and you hear that regulars walk out at lunch. That is the real need: the lunch queue is too long.',
              },
              {
                heading: 'Open questions get stories',
                visual: 'open-closed',
                bullets: ['Closed: "Do you want an app?" gets a yes', 'Open: "What happens at lunchtime?" gets a story'],
                narration: 'A closed question gets a yes, a no or a number, and you learn almost nothing. An open question that starts with what, how or why gets a story full of useful details.',
              },
              {
                heading: 'Before you leave the meeting',
                bullets: ['Ask about budget, deadline and users', 'Summarise back in plain words', 'Promise a proposal; do not design on the spot'],
                narration: 'Ask about the limits early: the budget, the deadline and who will actually use it. Then summarise what you heard in plain words and check you got it right. Do not design in the meeting; write things down and promise a proposal later.',
              },
              {
                heading: 'Your turn',
                bullets: ['Warm up: open or closed?', 'Then meet Mrs. Lau'],
                narration: 'Warm up by sorting some questions into open and closed ones. Then sit down with the café owner and see what you can find out.',
              },
            ],
          },
        },
        {
          type: 'sort',
          title: 'Open or closed question?',
          xpReward: 15,
          config: {
            instructions: 'Open questions invite a story. Closed questions get a yes, a no or a number. Sort these questions for Mrs. Lau.',
            buckets: ['Open', 'Closed'],
            items: [
              { text: 'What happens at the counter at lunchtime?', bucket: 'Open' },
              { text: 'Do you want an app?', bucket: 'Closed' },
              { text: 'Why does the queue matter to you?', bucket: 'Open' },
              { text: 'Is your budget HK$30,000?', bucket: 'Closed' },
              { text: 'How do customers order today?', bucket: 'Open' },
              { text: 'Can it be ready by July?', bucket: 'Closed' },
              { text: 'Who would use this most?', bucket: 'Open' },
              { text: 'Should the button be green?', bucket: 'Closed' },
            ],
          },
        },
        {
          type: 'roleplay',
          title: 'Requirements meeting with Mrs. Lau',
          xpReward: 40,
          config: {
            scenario: 'Mrs. Lau runs a busy café near campus. She emailed your team saying "I need an app". You have a short meeting to find out what she really needs.',
            persona: 'Mrs. Lau',
            personaRole: 'Café owner, your first client',
            personaBrief:
              'Busy, a bit impatient, kind underneath. Thinks she needs "an app" because a competitor has one. Real problem: at lunch (12:00-13:30) the queue goes out the door and office workers from the next building leave. Budget is small (around HK$30,000). Wants something before July. Has no interest in technology itself. Only reveals the queue problem, the office workers and the budget when asked open or "why" questions. If the learner talks jargon, she gets confused and a bit annoyed.',
            learnerRole: 'Junior developer from a small student team',
            goals: ['Find the real problem behind "an app"', 'Learn the budget and deadline', 'Summarise what you heard back to her'],
            opening: 'Thanks for coming. So, I need an app. My competitor across the road has one. How quickly can you build it?',
            rubric: [
              { criterion: 'Asks open questions', description: 'Uses what / why / how questions instead of yes/no or jumping to solutions' },
              { criterion: 'Uncovers the real need', description: 'Finds out about the lunch queue and who the customers are' },
              { criterion: 'Checks constraints and summarises', description: 'Asks about budget/deadline and summarises back in plain words' },
            ],
            maxTurns: 7,
            // Offline only: what Mrs. Lau says when no AI model is available. Rules answer the topic
            // the learner raised; the plain replies keep her vague when nothing matches.
            mockReplies: [
              'Hmm. I am not sure what you mean. I just know my competitor has an app.',
              'I do not know much about apps. Ask me about my café.',
              'Is that important? I have customers waiting, you know.',
            ],
            mockRules: [
              {
                keywords: ['api', 'backend', 'back-end', 'back end', 'frontend', 'front-end', 'database', 'server', 'framework', 'deploy', 'cloud', 'sdk', 'tech stack', 'cms', 'saas', 'endpoint', 'microservice', '后端', '前端', '数据库', '服务器', '框架', '部署', '接口', '技术栈', '云端'],
                reply: 'Sorry, you lost me there. I sell coffee. Can you say that in plain words?',
              },
              {
                keywords: ['just to check', 'to confirm', 'let me check', 'summar', 'did i get', 'is that right', 'if i understand', 'so the real', 'so what you', 'so you need', '总结', '确认一下', '我理解得对', '理解得对吗', '也就是说', '我复述'],
                reply: 'Yes, that is it exactly. You explain it better than I did!',
              },
              {
                keywords: ['why', 'problem', 'what happens', 'happen', 'lunch', 'busy', 'busi', 'queue', 'line', 'wait', 'trouble', 'difficult', 'struggle', 'worr', 'tell me about', '为什么', '问题', '发生', '排队', '午饭', '午餐', '忙', '麻烦', '困难', '担心', '说说', '情况'],
                reply: 'Well... mostly I see people give up at lunchtime. The queue goes out the door.',
              },
              {
                keywords: ['who', 'customer', 'user', 'people', 'office', 'regular', '谁', '顾客', '客人', '客户', '用户', '上班族', '熟客'],
                reply: 'Lunch customers? Office workers from the building next door, they only have 45 minutes.',
              },
              {
                keywords: ['budget', 'cost', 'money', 'price', 'afford', 'spend', 'how much', 'expensive', 'cheap', '预算', '费用', '多少钱', '钱', '价格', '成本', '贵'],
                reply: 'Budget? I am a small café, not a bank. Maybe thirty thousand dollars.',
              },
              {
                keywords: ['when', 'deadline', 'date', 'how long', 'how soon', 'soon', 'time', 'july', 'summer', 'month', 'week', 'launch', 'ready by', '什么时候', '截止', '期限', '时间', '多久', '几月', '夏天', '上线', '日期'],
                reply: 'Before July, please. Summer is when it gets really busy.',
              },
              {
                keywords: ['feature', 'function', 'button', 'screen', 'design', 'look like', 'colour', 'color', 'logo', 'page', '功能', '按钮', '界面', '设计', '颜色', '页面', '样子'],
                reply: 'Honestly, I do not care how it works. I just do not want to lose those customers.',
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Agile in one page: sprints, stand-ups and retros',
      estimatedMinutes: 21,
      content: `Most teams today work in an **agile** way: plan a little, build a little, show it, adjust. The most common recipe is **Scrum**. You only need five words to follow along in any tech team:

- **Backlog** – the to-do list of user stories, most important at the top.
- **Sprint** – a fixed time box (usually 1–2 weeks) where the team commits to a few stories.
- **Sprint planning** – the meeting at the start: "what can we finish this sprint?"
- **Daily stand-up** – 15 minutes each morning: what I did, what I'll do, what is blocking me.
- **Retrospective (retro)** – at the end: what went well, what didn't, what we'll try next time.

There is also a **sprint review**, where the team shows working software to stakeholders and gets feedback.

### Who is in a Scrum team?

- **Product Owner** – decides what is most valuable and keeps the backlog in order.
- **Scrum Master** – helps the team follow the process and clears blockers.
- **Developers** – everyone who builds and tests the product, not only programmers.

This short animation shows how the pieces fit together in one sprint:

[Video: What Is Scrum in Under 7 Minutes · Joshua Partogi (8 min)](https://youtu.be/9l2o9kISio0)

### A board makes it visible

Teams track work on a board with columns like **To do → In progress → Review → Done**. Teams usually keep it in a tool such as GitHub Projects or Jira, where every card links to the work behind it.

> Agile is not about meetings. It is about getting feedback often enough that you never drift far from what people need.`,
      activities: [
        {
          type: 'slides',
          title: 'Pip walks through one sprint',
          xpReward: 15,
          config: {
            slides: [
              {
                heading: 'One sprint, start to finish',
                visual: 'sprint-cycle',
                bullets: ['Backlog: most valuable first', 'Sprint planning: pick what fits', 'Build, with a stand-up every morning', 'Sprint review: show working software', 'Retro: one thing to improve'],
                narration: 'Here is one sprint from start to finish. It begins with the backlog, ordered so the most valuable stories are on top. In sprint planning, the team picks the stories it can finish in one or two weeks. Then they build, with a fifteen-minute stand-up every morning. At the sprint review, they show working software and collect feedback. Finally, the retro asks what to change next time, and the loop starts again.',
              },
              {
                heading: 'Who is in a Scrum team?',
                bullets: ['Product Owner: decides what matters most', 'Scrum Master: clears blockers', 'Developers: build and test the product'],
                narration: 'The Product Owner decides what is most valuable and keeps the backlog in order. The Scrum Master helps the team follow the process and clears anything blocking them. The developers are everyone who builds and tests the product, not only programmers.',
              },
              {
                heading: 'Make the work visible',
                visual: 'task-board',
                bullets: ['To do: chosen for this sprint', 'In progress: someone is on it', 'Review: a teammate checks it', 'Done: meets the Definition of Done'],
                narration: 'A board shows everyone where the work is. To do holds the stories chosen for this sprint. In progress means someone is working on it right now. Review means a teammate is checking it. Done means it meets the Definition of Done, which is coming up in the next lesson.',
              },
              {
                heading: 'Your turn',
                bullets: ['Match each line to its meeting', 'Then put a sprint in order'],
                narration: 'Let us practise. Match what people say to the right meeting, then put a whole sprint in order.',
              },
            ],
          },
        },
        {
          type: 'sort',
          title: 'Which meeting is this?',
          xpReward: 20,
          config: {
            instructions: 'Each line was said in a team meeting. Which meeting?',
            buckets: ['Sprint planning', 'Daily stand-up', 'Retrospective'],
            items: [
              { text: '"We can probably finish these three stories in two weeks."', bucket: 'Sprint planning' },
              { text: '"Yesterday I finished the menu page, today I start on cancel."', bucket: 'Daily stand-up' },
              { text: '"Our PRs were too big this time, let us keep them small."', bucket: 'Retrospective' },
              { text: '"I am blocked: I need the payment API key."', bucket: 'Daily stand-up' },
              { text: '"Payments are too risky for this sprint, push them to the next one."', bucket: 'Sprint planning' },
              { text: '"Pairing on the hard bug really helped, let us do it more."', bucket: 'Retrospective' },
            ],
          },
        },
        {
          type: 'quiz',
          title: 'Agile basics',
          xpReward: 20,
          config: {
            questions: [
              {
                prompt: 'Why are sprints kept short (1–2 weeks)?',
                options: ['To get feedback early and change course cheaply', 'So people can take holidays', 'Because computers need restarting', 'To avoid writing tests'],
                answerIndex: 0,
                explanation: 'Short cycles mean you never build for long in the wrong direction.',
              },
              {
                prompt: 'What belongs at the top of the backlog?',
                options: ['The most important stories', 'The easiest stories', 'The oldest stories', 'Bug reports only'],
                answerIndex: 0,
                explanation: 'The backlog is ordered by value, so the team always works on what matters most.',
              },
            ],
          },
        },
        {
          type: 'sequence',
          title: 'Order a sprint',
          xpReward: 20,
          config: {
            instructions: 'Put one CampusEats sprint in order, from preparing the backlog to looking back.',
            steps: [
              'Order the backlog by value',
              'Sprint planning: choose the stories for this sprint',
              'Build, with a short stand-up every morning',
              'Sprint review: show the working software',
              'Retrospective: agree one thing to improve',
            ],
          },
        },
      ],
    },
    {
      title: 'Testing and release: is it really done?',
      estimatedMinutes: 22,
      content: `CampusEats now has a working order form. Is it *done*? Not yet. Good teams agree in advance what "done" means, check it with tests, and release carefully.

### The Definition of Done

A **Definition of Done** is the team's shared checklist for every story. For CampusEats it could be:

- The acceptance criteria pass
- Automated tests cover the new code, and every test passes
- Someone else has reviewed the code
- It works with a phone screen reader
- It is released to at least one canteen

### Testing at different levels

| Level | What it checks | CampusEats example |
|---|---|---|
| Unit test | One small piece of code on its own | The price total adds up, discounts included |
| Integration test | Pieces working together | A new order is saved and shows up on the staff tablet |
| End-to-end test | A whole journey through the real app | A student logs in, orders, pays and sees "ready" |
| Acceptance test | The story does what was agreed | The canteen manager tries "order again" and agrees it works |

Keep many small, fast unit tests, and a few slower end-to-end tests for the journeys that matter most.

[Video: Software Testing Explained in 100 Seconds · Fireship (2 min)](https://youtu.be/u6QfIXgjwGQ)

### Continuous integration

With **continuous integration** (CI), everyone merges small changes often and the tests run automatically on each one. A change that breaks something is caught within minutes, not at the end of the month. In the Sprout project, \`npm run check\` runs the type checker, the linter and the tests, and every pull request gets a preview deployment to try before it is merged.

[Video: What is Continuous Integration? · IBM Technology (6 min)](https://youtu.be/1er2cjUq1UI)

### Releasing safely

- **Start small:** launch at one canteen before all of them.
- **Watch what happens:** errors, slow pages, orders that never finish.
- **Have a way back:** if something breaks, roll back to the last version that worked.

> **Takeaway:** "done" means tested, reviewed and in front of real users, not "it works on my laptop".

Want to practise? The [Sprint Zero scenario](/scenarios/sprint-zero) lets you lead a student team through three weeks of these decisions.`,
      activities: [
        {
          type: 'slides',
          title: 'Pip on testing and release',
          xpReward: 15,
          config: {
            slides: [
              {
                heading: 'What does "done" mean?',
                visual: 'done-checklist',
                bullets: ['The acceptance criteria pass', 'Tests are written and passing', 'Someone else reviewed the code', 'It is in front of real users'],
                narration: 'Done is a checklist the whole team agrees on, not a feeling. First, the acceptance criteria pass. Second, tests are written and every one of them passes. Third, someone else has reviewed the code. And fourth, it is released to real users.',
              },
              {
                heading: 'The test pyramid',
                visual: 'test-pyramid',
                bullets: ['Many fast unit tests', 'Some integration tests', 'A few end-to-end tests'],
                narration: 'Picture a pyramid of tests. At the bottom, lots of small unit tests check one piece each and run in milliseconds. In the middle, integration tests check that pieces work together. At the top, a few slow end-to-end tests walk through the journeys that matter most.',
              },
              {
                heading: 'Continuous integration',
                visual: 'ci-pipeline',
                bullets: ['Merge small changes often', 'Tests run on every change', 'Green: merge it. Red: fix it now'],
                narration: 'With continuous integration, everyone merges small changes often. Every change runs the tests automatically. If they pass, it is merged; if one fails, you fix it within minutes, while the change is still fresh in your mind.',
              },
              {
                heading: 'Release safely',
                visual: 'safe-release',
                bullets: ['Start with one canteen', 'Watch errors and slow pages', 'All good? Roll out to every canteen', 'Something broke? Roll back'],
                narration: 'Even tested code can surprise you, so release in small steps. Start with one canteen. Watch for errors, slow pages and orders that never finish. If all is well, roll out to every canteen. If something breaks, roll back to the last version that worked, then investigate.',
              },
              {
                heading: 'Your turn',
                bullets: ['Which test would catch this bug?', 'Done or not done?'],
                narration: 'Time to test yourself. Match each bug to the test that would catch it, then decide whether some stories are really done.',
              },
            ],
          },
        },
        {
          type: 'sort',
          title: 'Which test would catch this?',
          xpReward: 20,
          config: {
            instructions: 'Each line is a bug or a problem in CampusEats. Which kind of test would catch it first?',
            buckets: ['Unit test', 'Integration test', 'Acceptance test'],
            items: [
              { text: 'Two HK$20 meals add up to HK$30 in the cart', bucket: 'Unit test' },
              { text: 'The 10% student discount is applied twice', bucket: 'Unit test' },
              { text: 'Orders are saved but never appear on the staff tablet', bucket: 'Integration test' },
              { text: 'The payment provider confirms a payment, but the order stays "unpaid"', bucket: 'Integration test' },
              { text: 'The daily summary leaves out the drinks the canteen manager needs to prepare', bucket: 'Acceptance test' },
              { text: 'Students can reorder, but nobody finds the "order again" button', bucket: 'Acceptance test' },
            ],
          },
        },
        {
          type: 'quiz',
          title: 'Done or not done?',
          xpReward: 20,
          config: {
            questions: [
              {
                prompt: 'The order form works on the developer\'s laptop, but it has no tests and nobody has reviewed it. Is the story done?',
                options: [
                  'Yes: it works',
                  'No: it does not meet the Definition of Done yet',
                  'Yes, if the deadline is close',
                  'Only if the client is happy with the colours',
                ],
                answerIndex: 1,
                explanation: 'Working once on one laptop is not done. The team agreed on tests and a review for every story.',
              },
              {
                prompt: 'What does continuous integration give the team?',
                options: [
                  'Code that never has bugs',
                  'No more need for code review',
                  'A new release every day',
                  'Broken changes are caught within minutes by automatic tests',
                ],
                answerIndex: 3,
                explanation: 'CI does not prevent mistakes. It finds them quickly, while the change is small and fresh in mind.',
              },
              {
                prompt: 'A new version makes ordering slow at the first canteen. What is the safest move?',
                options: [
                  'Roll back to the last version that worked, then investigate',
                  'Release it to every canteen to collect more data',
                  'Ask students to wait longer',
                  'Delete the tests for the slow feature',
                ],
                answerIndex: 0,
                explanation: 'Rolling back protects users right away. The team can then find the cause without time pressure.',
              },
            ],
          },
        },
      ],
    },
  ],
};
