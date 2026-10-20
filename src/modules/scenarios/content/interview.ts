// Interview Coach: a practice interview, not a hiring tool. One question at a time, a
// three-step hint ladder when the learner stalls, then a debrief that quotes what they
// actually said. Scoring is deterministic so the same answer always scores the same.

export type InterviewKind =
  | 'behavioral'
  | 'engineering'
  | 'agent-workflow'
  | 'review'
  | 'product'
  | 'hr'
  | 'career-switch';

export interface InterviewQuestion {
  id: string;
  prompt: string;
  competency: string;
  /** Three hints, from a nudge to a strong scaffold. Never the answer. */
  hints: [string, string, string];
  /** What a strong answer contains. Used in the debrief, never shown mid-interview. */
  listenFor: string[];
}

export interface InterviewType {
  id: InterviewKind;
  name: string;
  blurb: string;
  competencies: string[];
  questions: InterviewQuestion[];
}

export const INTERVIEW_TYPES: InterviewType[] = [
  {
    id: 'behavioral',
    name: 'Behavioural and soft skills',
    blurb: 'How you work with people when something goes wrong.',
    competencies: ['Structure', 'Evidence', 'Ownership', 'Communication'],
    questions: [
      {
        id: 'disagree',
        prompt: 'Tell me about a time you disagreed with a teammate about a technical decision.',
        competency: 'Structure',
        hints: [
          'Pick one real disagreement, not a general pattern.',
          'Use a simple arc: situation, what you wanted, what they wanted, what you did.',
          'Include the part where you changed your own position, not just where you won.',
        ],
        listenFor: ['A named situation with a real decision', 'A fair description of the other position'],
      },
      {
        id: 'proud',
        prompt: 'Describe something you shipped that you were not proud of. Why did it happen?',
        competency: 'Ownership',
        hints: [
          'Name the artefact, not the feeling.',
          'Separate the decision from the outcome: did you know at the time?',
          'End with the concrete change you made afterwards.',
        ],
        listenFor: ['An honest account without excessive blame', 'A specific process change'],
      },
      {
        id: 'feedback',
        prompt: 'How do you give feedback to someone whose work is not good enough?',
        competency: 'Communication',
        hints: [
          'Start with what you would actually say out loud.',
          'Keep the work separate from the person.',
          'Say how you would check that the feedback landed.',
        ],
        listenFor: ['Language about the artefact', 'A way to verify improvement'],
      },
      {
        id: 'failure',
        prompt: 'Tell me about a project that failed. What was your part in it?',
        competency: 'Ownership',
        hints: [
          'Choose a real failure, not a success that ran late.',
          'Name what you missed or decided wrongly.',
          'Finish with what you would do differently at the decision point.',
        ],
        listenFor: ['An actual failure with a specific cause', 'Their mistake kept separate from bad luck'],
      },
      {
        id: 'help',
        prompt: 'How do you decide when to ask for help instead of working it out alone?',
        competency: 'Structure',
        hints: [
          'Think of one recent case where you chose each way.',
          'Name the signals: time spent, risk, reversibility.',
          'Mention what asking costs, not only what it saves.',
        ],
        listenFor: ['A concrete threshold rather than it depends', 'Awareness that interrupting has a cost'],
      },
    ],
  },
  {
    id: 'engineering',
    name: 'Software engineering basics',
    blurb: 'Requirements, design, testing and trade-offs.',
    competencies: ['Requirements', 'Design', 'Testing', 'Trade-offs'],
    questions: [
      {
        id: 'fast',
        prompt: 'A stakeholder says the app should be fast. How do you turn that into something you can build and test?',
        competency: 'Requirements',
        hints: [
          'Start by naming what fast could mean for different users.',
          'Try the shape: what is observable, in what condition, to what tolerance.',
          'Pick the interaction that matters most and a percentile.',
        ],
        listenFor: ['Replacing the adjective with a number and a context', 'Recognising that fast hides a decision'],
      },
      {
        id: 'layer',
        prompt: 'How do you decide which layer a piece of business logic belongs in?',
        competency: 'Design',
        hints: [
          'Think about who else needs the rule, not just this caller.',
          'Consider the lowest layer every caller passes through.',
          'Mention what happens when the rule lives in the UI.',
        ],
        listenFor: ['A principle rather than a preference', 'Awareness of duplicated rules drifting'],
      },
      {
        id: 'tests',
        prompt: 'How do you know your tests are actually doing something?',
        competency: 'Testing',
        hints: [
          'A useful test is one that can fail. What would make yours go red?',
          'Think about assertions that pass for almost any output.',
          'Consider the gap between coverage and confidence.',
        ],
        listenFor: ['A test must be able to fail', 'Suspicion of coverage as a proxy'],
      },
      {
        id: 'week',
        prompt: 'You have one week and two of three features are half-built. How do you decide what ships?',
        competency: 'Trade-offs',
        hints: [
          'Separate what makes the product usable from what makes it nicer.',
          'Name what leaves the release.',
          'Say who has to agree to that trade.',
        ],
        listenFor: ['Protecting the must-ship set', 'Naming the dropped scope'],
      },
      {
        id: 'api',
        prompt: 'How would you review a change that adds a new external API call?',
        competency: 'Design',
        hints: [
          'Think about failure: timeouts, retries, rate limits.',
          'Consider slow but not down.',
          'Include how you would test it without the real service.',
        ],
        listenFor: ['Failure handling before happy path', 'A test strategy that does not need the live service'],
      },
    ],
  },
  {
    id: 'agent-workflow',
    name: 'Working with a coding agent',
    blurb: 'Delegation, description, checking and owning the result.',
    competencies: ['Delegation', 'Description', 'Discernment', 'Diligence'],
    questions: [
      {
        id: 'which',
        prompt: 'Which parts of your work do you hand to an AI agent, and which do you keep?',
        competency: 'Delegation',
        hints: [
          'Think in terms of risk and reversibility, not task size.',
          'Name one thing you would never delegate, and why.',
          'Consider the middle case: agent drafts, you decide.',
        ],
        listenFor: ['A rule rather than a feeling', 'At least one thing that stays human'],
      },
      {
        id: 'describe',
        prompt: 'Say out loud the description you would give an agent for a login function.',
        competency: 'Description',
        hints: [
          'Cover language, signature, data shape and error behaviour.',
          'Add what must not happen. That is the part people skip.',
          'Consider what the agent assumes if you leave it out.',
        ],
        listenFor: ['At least four of the five elements', 'Awareness that silence becomes an assumption'],
      },
      {
        id: 'check',
        prompt: 'How do you check code that an AI wrote?',
        competency: 'Discernment',
        hints: [
          'Start with the parts that fail silently: edges, errors, permissions.',
          'Mention reading the diff against the requirement, not just running it.',
          'Say what you do when a summary sounds confident.',
        ],
        listenFor: ['A repeatable review order', 'Suspicion of confident summaries'],
      },
      {
        id: 'record',
        prompt: 'How do you keep a record of what AI contributed to a project?',
        competency: 'Diligence',
        hints: [
          'Think about what you would need if someone asked who wrote this.',
          'Consider the prompt, the diff, and the decision to keep or reject.',
          'Mention what changes on a team versus alone.',
        ],
        listenFor: ['A concrete artefact, not I remember', 'Accountability rather than bookkeeping'],
      },
      {
        id: 'citation',
        prompt: 'An agent tells you it followed the documentation. What do you do next?',
        competency: 'Discernment',
        hints: [
          'A named source is a claim, not a fact.',
          'Open the section and compare it with the code.',
          'Think about which mistakes a model makes most convincingly.',
        ],
        listenFor: ['Checking the source rather than the summary', 'Specificity is not accuracy'],
      },
    ],
  },
  {
    id: 'review',
    name: 'Code review and requirements',
    blurb: 'Reading someone else work and asking the right question.',
    competencies: ['Critical reading', 'Severity', 'Question quality', 'Tone'],
    questions: [
      {
        id: 'password',
        prompt: 'You are reviewing a change that stores passwords for the first time. What do you look for?',
        competency: 'Critical reading',
        hints: [
          'Start from what an attacker wants, not from style.',
          'Consider how the value is stored and compared.',
          'Mention logging: is the password written anywhere it should not be?',
        ],
        listenFor: ['Security as a first-order concern', 'A specific mechanism'],
      },
      {
        id: 'severity',
        prompt: 'How do you decide whether a review comment is a blocker or a nitpick?',
        competency: 'Severity',
        hints: [
          'Tie severity to what breaks, not to how much it annoys you.',
          'Separate defects from preferences.',
          'Think about who should own formatting.',
        ],
        listenFor: ['A stated severity rule', 'Willingness to let style go'],
      },
      {
        id: 'cancel',
        prompt: 'A requirement says the user can cancel an order. What do you ask before writing code?',
        competency: 'Question quality',
        hints: [
          'Ask about the state after cancelling, not just the action.',
          'Consider recovery: can it be undone, and for how long?',
          'Ask who else is affected: payments, stock, notifications.',
        ],
        listenFor: ['Post-conditions and recovery', 'Recognising the sentence is under-specified'],
      },
      {
        id: 'volume',
        prompt: 'A pull request has one real problem and twenty small ones. How do you respond?',
        competency: 'Tone',
        hints: [
          'Lead with the one that matters and say why.',
          'Consider how many comments a person can act on at once.',
          'Think about what you want them to do.',
        ],
        listenFor: ['One clear blocker rather than a wall', 'Language about the code'],
      },
      {
        id: 'refactor',
        prompt: 'How would you review a refactor that claims no behaviour change?',
        competency: 'Critical reading',
        hints: [
          'A refactor claim is itself a claim to verify.',
          'Look for silent changes: ordering, defaults, rounding.',
          'Mention the tests: do they pin the behaviour?',
        ],
        listenFor: ['Treating the claim as unverified', 'A concrete way to prove equivalence'],
      },
    ],
  },
  {
    id: 'product',
    name: 'Product thinking',
    blurb: 'What to build, what to drop, and how you know.',
    competencies: ['Problem framing', 'Prioritisation', 'Measurement', 'Communication'],
    questions: [
      {
        id: 'export',
        prompt: 'A user asks for an export button. What do you do before building it?',
        competency: 'Problem framing',
        hints: [
          'Ask what they are trying to get done, not what they want built.',
          'Look for the manual work around the request.',
          'Consider a cheaper test than the thing they asked for.',
        ],
        listenFor: ['Separating the request from the need', 'A cheaper test before a build'],
      },
      {
        id: 'five',
        prompt: 'You have five requests and capacity for two. How do you choose?',
        competency: 'Prioritisation',
        hints: [
          'Start with what makes the product usable at all.',
          'Name the criteria: reach, severity, reversibility.',
          'Say what you are dropping, out loud.',
        ],
        listenFor: ['Explicit criteria', 'Naming the dropped work'],
      },
      {
        id: 'success',
        prompt: 'How would you know a feature succeeded?',
        competency: 'Measurement',
        hints: [
          'Define success before launch, in observable terms.',
          'Distinguish usage from outcome.',
          'Name a counter-metric: what would show it is hurting?',
        ],
        listenFor: ['A pre-committed measure', 'Awareness that a feature can look good and still be bad'],
      },
      {
        id: 'three-percent',
        prompt: 'A feature you shipped is used by three percent of users. What do you conclude?',
        competency: 'Measurement',
        hints: [
          'Separate nobody needs it from nobody found it.',
          'Look at who the three percent are.',
          'Consider whether the metric measures what you intended.',
        ],
        listenFor: ['Discovery versus value', 'A decision rule rather than a feeling'],
      },
      {
        id: 'delay',
        prompt: 'How do you explain a technical delay to someone who does not care about the cause?',
        competency: 'Communication',
        hints: [
          'Lead with the consequence for them.',
          'Give a date and a choice.',
          'Make a recommendation instead of a status report.',
        ],
        listenFor: ['Consequence first', 'A recommendation, not a chronology'],
      },
    ],
  },
  {
    id: 'hr',
    name: 'Motivation and fit',
    blurb: 'Why this work, how you work, what you want next.',
    competencies: ['Self-awareness', 'Motivation', 'Structure', 'Communication'],
    questions: [
      {
        id: 'why',
        prompt: 'Why this kind of role, and why now?',
        competency: 'Motivation',
        hints: [
          'Connect one specific past experience to one specific interest.',
          'Avoid generic enthusiasm. Name what you actually enjoy doing.',
          'Mention what you are deliberately moving away from.',
        ],
        listenFor: ['A reason grounded in experience', 'Some awareness of the trade being chosen'],
      },
      {
        id: 'environment',
        prompt: 'What kind of environment do you do your best work in?',
        competency: 'Self-awareness',
        hints: [
          'Describe conditions, not adjectives.',
          'Give one place it worked and one where it did not.',
          'Be honest about what you need, even if it is unglamorous.',
        ],
        listenFor: ['Concrete conditions with evidence', 'Honesty without entitlement'],
      },
      {
        id: 'learned',
        prompt: 'Tell me about something you learned recently without being asked to.',
        competency: 'Motivation',
        hints: [
          'Pick something you can talk about for two minutes.',
          'Say what triggered it and what you did with it.',
          'Mention whether it changed how you work.',
        ],
        listenFor: ['Genuine curiosity with follow-through', 'A result, not just consumption'],
      },
      {
        id: 'weakness',
        prompt: 'What is a weakness you are actively working on?',
        competency: 'Self-awareness',
        hints: [
          'Pick something real that is not a disguised strength.',
          'Name the behaviour, not the trait.',
          'Describe what you are doing about it and how you measure progress.',
        ],
        listenFor: ['A real weakness with a mechanism', 'Evidence of an attempt'],
      },
      {
        id: 'three-years',
        prompt: 'Where do you want to be in three years, and what is the step between here and there?',
        competency: 'Motivation',
        hints: [
          'Name a kind of capability, not a job title.',
          'Describe the next concrete step, not the destination.',
          'Connect it honestly to what this role offers.',
        ],
        listenFor: ['A direction with a next step', 'Realism about what the role can provide'],
      },
    ],
  },
  {
    id: 'career-switch',
    name: 'Moving into software',
    blurb: 'For people arriving from another field.',
    competencies: ['Transferable evidence', 'Learning', 'Technical grounding', 'Communication'],
    questions: [
      {
        id: 'no-degree',
        prompt: 'You do not have a computer science degree. What makes you think you can do this work?',
        competency: 'Transferable evidence',
        hints: [
          'Name one specific thing you have already built or shipped.',
          'Connect a skill from your previous field to engineering work.',
          'Be honest about the gap instead of arguing it does not exist.',
        ],
        listenFor: ['Evidence of shipped work', 'Honest gap awareness rather than defensiveness'],
      },
      {
        id: 'learn',
        prompt: 'How do you learn a new technical topic? Walk me through a recent example.',
        competency: 'Learning',
        hints: [
          'Pick one topic and describe the sequence you followed.',
          'Mention how you checked that you had understood it.',
          'Include something that did not work.',
        ],
        listenFor: ['A repeatable process', 'Verification, not just consumption'],
      },
      {
        id: 'index',
        prompt: 'Explain what a database index does, as if I were not technical.',
        competency: 'Technical grounding',
        hints: [
          'Use an analogy from something physical.',
          'Then say what the cost of an index is, not only the benefit.',
          'Check whether the explanation survives a follow-up.',
        ],
        listenFor: ['A correct analogy rather than jargon', 'Awareness of the cost side'],
      },
      {
        id: 'chance',
        prompt: 'Why should we take a chance on someone without a traditional background?',
        competency: 'Communication',
        hints: [
          'Argue from evidence, not enthusiasm.',
          'Acknowledge what would need to be true for you to succeed.',
          'Say what you would do in the first month to reduce that risk.',
        ],
        listenFor: ['A risk-aware argument', 'A concrete first-month plan'],
      },
      {
        id: 'ai-first-role',
        prompt: 'How would you use AI tools in your first engineering role?',
        competency: 'Learning',
        hints: [
          'Say what you would use them for and what you would not.',
          'Mention how you would check the output.',
          'Consider how you keep learning rather than outsourcing understanding.',
        ],
        listenFor: ['A considered boundary', 'Awareness that delegating understanding is a trap'],
      },
    ],
  },
];

export function interviewType(id: string): InterviewType | undefined {
  return INTERVIEW_TYPES.find((t) => t.id === id);
}
