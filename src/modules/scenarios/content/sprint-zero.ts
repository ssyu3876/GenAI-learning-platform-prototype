// Sprint Zero: three weeks running a small product team.
//
// Each week has a bank of twelve questions and draws eight of them, three from the opening
// act, three from the middle, two from the end. So the order still reads like a week, but
// two playthroughs are not the same week. Some options are traps: they end the run on the
// spot, and the summary says why.
import type { SprintScenario, SprintStep } from './types';

// ---------------------------------------------------------------------------
// Week 1 — Build it
// ---------------------------------------------------------------------------

const W1: SprintStep[] = [
  {
    id: 'w1-scope', act: 1,
    title: 'Three features, six weeks',
    body: 'A stakeholder brings a list. Three features, all must-have, six weeks, two people.',
    choices: [
      { id: 'all', label: 'Commit to all three', cost: 'fast, heavy', effects: { budget: -6, morale: -16, users: 8, quality: -20 }, outcome: 'Two features are half-built by week four. Nothing is finished and the team knows it.' },
      { id: 'one', label: 'Ship one, properly', cost: 'slow, solid', effects: { budget: 2, morale: 14, users: 3, quality: 14 }, outcome: 'One ships well. The stakeholder is annoyed and the codebase is still workable.' },
      { id: 'proto', label: 'Ask for a week to prototype', cost: 'burns time', effects: { budget: -10, morale: 4, users: 1, quality: 8 }, outcome: 'The prototype shows the third feature is not needed. Nobody thanks you for the week.' },
    ],
  },
  {
    id: 'w1-ceiling', act: 1,
    title: 'The stakeholder raises the ceiling',
    body: 'They come back with one more feature, "small", "just a button".',
    choices: [
      { id: 'accept', label: 'Add it, it sounds small', cost: 'scope creep', effects: { budget: -4, morale: -10, users: 6, quality: -12 }, outcome: 'It needed a new permission model. Nothing about it was small.' },
      { id: 'show', label: 'Show them the queue and ask what drops', cost: 'a conversation', effects: { budget: -2, morale: 6, users: 2, quality: 8 }, outcome: 'They drop the button and keep the export. The queue did the arguing for you.' },
      { id: 'silent', label: 'Say yes and quietly skip something else', cost: 'dishonest', effects: { budget: 0, morale: -14, users: -4, quality: -6 }, outcome: 'They find out later that the export is missing. The trust cost is larger than the feature.' },
    ],
  },
  {
    id: 'w1-agent', act: 1,
    title: 'The agent offers to write payments',
    body: 'A teammate suggests letting the agent handle the whole payment module unattended. "It is boilerplate." Payment code is never boilerplate.',
    choices: [
      { id: 'unattended', label: 'Let it run unattended', cost: 'saves days', effects: { budget: 12, morale: 8, users: 0, quality: -26 }, outcome: 'It works on the happy path. The refund path has never been executed.' },
      { id: 'review', label: 'Let it draft, review every diff', cost: 'slower, safer', effects: { budget: -4, morale: -4, users: 0, quality: 16 }, outcome: 'Review catches an off-by-one in the currency conversion.' },
      { id: 'self', label: 'Write it yourself', cost: 'slowest', effects: { budget: -10, morale: -10, users: 0, quality: 20 }, outcome: 'Three days of your life. Correct, and the teammate learns nothing by watching.' },
    ],
  },
  {
    id: 'w1-burnout', act: 1,
    title: 'Your teammate is running on fumes',
    body: 'It is 11pm. They have been in since seven and are making mistakes they would never normally make.',
    seconds: 12, timeoutChoice: 2,
    choices: [
      { id: 'push', label: 'Push to finish tonight', cost: 'ships tonight', effects: { budget: 0, morale: -24, users: 0, quality: -14 }, outcome: 'It ships. They take two sick days and the next feature takes twice as long.' },
      { id: 'home', label: 'Send them home, pick it up tomorrow', cost: 'one day', effects: { budget: -5, morale: 18, users: 0, quality: 6 }, outcome: 'Tomorrow they find the bug in twenty minutes. The 11pm version had a broken guard.' },
      { id: 'silent', label: 'Say nothing, let them decide', cost: 'time passes', effects: { budget: 0, morale: -12, users: 0, quality: -6 }, outcome: 'They keep going because nobody told them to stop. Silence reads as expectation.' },
    ],
  },
  {
    id: 'w1-auth', act: 1,
    title: 'The auth bug nobody wants to hear about',
    body: 'A late review finds a real authorisation flaw. Fixing it delays the beta by a week, and the beta is what the funder is waiting for.',
    choices: [
      { id: 'fix', label: 'Fix it now, delay the beta', cost: 'one week', effects: { budget: -14, morale: -8, users: -4, quality: 22 }, outcome: 'The funder is unhappy. The flaw would have let any user read another user invoice.' },
      { id: 'later', label: 'Ship the beta, patch next week', cost: 'keeps the date', effects: { budget: 6, morale: 4, users: 14, quality: -24 }, outcome: 'Signups jump. For six days the flaw is live in production.' },
      { id: 'ship-anyway', label: 'Ship it and do not tell the funder', cost: 'silent risk', effects: { budget: 8, morale: -20, users: 10, quality: -30 }, outcome: 'It works until someone reads an invoice that is not theirs.', fatal: { title: 'The beta was pulled', body: 'A tester opened another account invoice by changing one number in the URL. The funder found out from them, not from you. The grant is paused.' } },
    ],
  },
  {
    id: 'w1-pricing', act: 1,
    title: 'Users like it. Nobody is paying.',
    body: 'A hundred and fifty people use it weekly. Revenue is zero and six weeks of runway are left.',
    choices: [
      { id: 'free', label: 'Keep it free and grow the base', cost: 'no revenue', effects: { budget: -22, morale: 6, users: 38, quality: -4 }, outcome: 'Usage climbs and so does the hosting bill. Growth without revenue is a countdown.' },
      { id: 'paywall', label: 'Put up a paywall today', cost: 'revenue now', effects: { budget: 26, morale: -10, users: -22, quality: 2 }, outcome: 'A third of users leave within a week. The ones who stay pay.' },
      { id: 'freemium', label: 'Free tier plus a paid plan', cost: 'more work', effects: { budget: 10, morale: -4, users: 14, quality: -8 }, outcome: 'Two tiers take a week you did not have. Conversion is 4%, which is enough to matter.' },
    ],
  },
  {
    id: 'w1-enterprise', act: 2,
    title: 'Enterprise wants SSO or they walk',
    body: 'Your largest account needs single sign-on. A month of work for one customer who pays a fifth of revenue.',
    choices: [
      { id: 'build', label: 'Build SSO properly', cost: 'a month', effects: { budget: -18, morale: -8, users: 6, quality: 14 }, outcome: 'The account stays, and two more enterprises sign because SSO was their blocker too.' },
      { id: 'hack', label: 'Build a version for them only', cost: 'a week, fragile', effects: { budget: -6, morale: -4, users: 2, quality: -14 }, outcome: 'It works until their identity provider renames a field, then it is your problem at 2am.' },
      { id: 'drop', label: 'Let them go', cost: 'lose revenue', effects: { budget: -16, morale: 6, users: -18, quality: 4 }, outcome: 'You lose a fifth of revenue and keep a roadmap that serves everyone.' },
    ],
  },
  {
    id: 'w1-churn', act: 2,
    title: 'Sixty percent churn in week one',
    body: 'People sign up, use it twice, and never return. The activation flow has not changed since you built it for yourselves.',
    choices: [
      { id: 'onboarding', label: 'Rewrite onboarding around one real task', cost: 'two weeks', effects: { budget: -12, morale: 6, users: 20, quality: 8 }, outcome: 'New users do one useful thing in the first minute. Retention doubles.' },
      { id: 'email', label: 'Send an email sequence', cost: 'cheap, indirect', effects: { budget: -4, morale: -2, users: 4, quality: -2 }, outcome: 'Open rates are fine, clicks are not. Email cannot fix a product that hides its value.' },
      { id: 'features', label: 'Add more features to find', cost: 'makes it worse', effects: { budget: -10, morale: -8, users: -4, quality: -10 }, outcome: 'A bigger product is harder to start. You added surface to a leaking funnel.' },
    ],
  },
  {
    id: 'w1-marketing', act: 2,
    title: 'Marketing wants to promise a feature you do not have',
    body: 'The launch copy says "automatic reporting". Automatic reporting does not exist and would take a month.',
    choices: [
      { id: 'shipcopy', label: 'Ship the copy, build it after', cost: 'tell the truth later', effects: { budget: 12, morale: -12, users: 16, quality: -16 }, outcome: 'Signups spike. Then support gets a hundred messages asking where the feature is.' },
      { id: 'honest', label: 'Cut the claim to what exists', cost: 'honest, smaller', effects: { budget: -2, morale: 8, users: 4, quality: 8 }, outcome: 'Fewer signups, no angry customers. The people who sign up get what was promised.' },
      { id: 'minimal', label: 'Build a minimal version this week', cost: 'rush', effects: { budget: -14, morale: -6, users: 10, quality: -8 }, outcome: 'A scheduled email is not automatic reporting, but nobody complains loudly.' },
    ],
  },
  {
    id: 'w1-discount', act: 2,
    title: 'Your biggest customer asks for 30% off',
    body: 'They are forty percent of revenue and will re-evaluate at renewal.',
    choices: [
      { id: 'commit', label: 'Give it for a one-year commitment', cost: 'price for certainty', effects: { budget: 8, morale: -2, users: 4, quality: 0 }, outcome: 'You trade margin for predictable revenue. They will ask again next year.' },
      { id: 'value', label: 'Hold the price, add onboarding', cost: 'risky', effects: { budget: 0, morale: 8, users: -6, quality: 6 }, outcome: 'They stay, slightly annoyed, and your pricing holds.' },
      { id: 'yes', label: 'Say yes immediately', cost: 'sets a precedent', effects: { budget: -6, morale: -10, users: 6, quality: -2 }, outcome: 'They renew, and every other customer hears about it within a month.' },
    ],
  },
  {
    id: 'w1-rewrite', act: 3,
    title: 'Your engineer wants to rewrite auth',
    body: 'They say the current module holds everything back. It works, it has tests, and it is ugly.',
    choices: [
      { id: 'rewrite', label: 'Let them rewrite it over three weeks', cost: 'stops the roadmap', effects: { budget: -16, morale: 12, users: -4, quality: 16 }, outcome: 'The roadmap stops for three weeks. The new module is better and the engineer stays.' },
      { id: 'incremental', label: 'Refactor behind the same interface', cost: 'slower, safer', effects: { budget: -8, morale: 4, users: 0, quality: 10 }, outcome: 'No big bang. Six weeks later the internals are new and nobody noticed.' },
      { id: 'no', label: 'Say no, it works', cost: 'cheap now', effects: { budget: 0, morale: -18, users: 0, quality: -8 }, outcome: 'The engineer updates their CV. The module keeps getting harder to touch.' },
    ],
  },
  {
    id: 'w1-hire', act: 3,
    title: 'One senior or two juniors',
    body: 'The same budget either way, and you are the only other person on the team.',
    choices: [
      { id: 'senior', label: 'Hire the senior', cost: 'fast, narrow', effects: { budget: -20, morale: 10, users: 8, quality: 14 }, outcome: 'They ship from week one and review everyone. The bus factor stays alarming.' },
      { id: 'juniors', label: 'Hire two juniors', cost: 'slow, broad', effects: { budget: -20, morale: -6, users: 2, quality: -6 }, outcome: 'Both need mentoring you do not have time for. They become useful in month three.' },
      { id: 'mixed', label: 'Senior plus a part-time junior', cost: 'stretch the budget', effects: { budget: -24, morale: 6, users: 10, quality: 8 }, outcome: 'You overspend slightly and get both coverage and review.' },
    ],
  },
  {
    id: 'w1-arch', act: 3,
    title: 'Two people, two architectures',
    body: 'One wants a monolith because it ships faster. One wants services because they cannot deploy independently.',
    choices: [
      { id: 'pick', label: 'Pick one and commit fully', cost: 'clear, unpopular', effects: { budget: -6, morale: -6, users: 4, quality: 12 }, outcome: 'Half disagree and all of them know what to build. Velocity returns within a month.' },
      { id: 'both', label: 'Let each do their own thing', cost: 'avoids conflict', effects: { budget: -4, morale: 6, users: 2, quality: -16 }, outcome: 'Two systems, two deployment paths, and a data model that does not match in the middle.' },
      { id: 'review', label: 'Run a design review and decide together', cost: 'slower upfront', effects: { budget: -10, morale: 10, users: 4, quality: 10 }, outcome: 'Both sides see the trade. The decision holds because they made it.' },
    ],
  },
  {
    id: 'w1-investor', act: 1,
    title: 'The investor wants weekly numbers',
    body: 'Someone might fund you. Before that, they want a weekly report: users, revenue, burn, retention.',
    choices: [
      { id: 'manual', label: 'Pull it by hand every Friday', cost: 'an hour a week', effects: { budget: -4, morale: -6, users: 0, quality: 0 }, outcome: 'An hour of your week, every week, building the same spreadsheet from three sources.' },
      { id: 'script', label: 'Write a small script once', cost: 'two days', effects: { budget: -8, morale: 4, users: 0, quality: 8 }, outcome: 'Two days now, seconds later. The numbers are also reproducible, which turns out to matter more than the time saved.' },
      { id: 'promise', label: 'Promise the numbers and send estimates', cost: 'nothing now', effects: { budget: 0, morale: -10, users: 0, quality: -8 }, outcome: 'You send round numbers. They compare them to the bank statement.', fatal: { title: 'The numbers did not match', body: 'An investor found a twelve percent gap between your estimates and the real figure. The round ended there, and the reason given was not the number, it was that the number was invented.' } },
    ],
  },
  {
    id: 'w1-free-help', act: 1,
    title: 'A friend offers to work for free',
    body: 'A capable friend has two weeks free and offers to build something. No contract, no onboarding.',
    choices: [
      { id: 'take', label: 'Take the help, give them the payment module', cost: 'free labour', effects: { budget: 6, morale: 8, users: 2, quality: -14 }, outcome: 'They ship fast and leave. Nobody reviews the code, and nobody knows why it does what it does.' },
      { id: 'scope', label: 'Take the help on something self-contained', cost: 'careful scoping', effects: { budget: 0, morale: 10, users: 2, quality: 6 }, outcome: 'A settings page, reviewed, documented. Helpful and harmless.' },
      { id: 'decline', label: 'Decline politely', cost: 'no help', effects: { budget: 0, morale: -2, users: 0, quality: 0 }, outcome: 'You keep the codebase coherent and lose two weeks of free work.' },
    ],
  },
  {
    id: 'w1-bug-report', act: 2,
    title: 'A bug report from your largest user',
    body: 'They describe a case where the export drops the last row. You cannot reproduce it.',
    choices: [
      { id: 'repro', label: 'Write a test from their exact description', cost: 'half a day', effects: { budget: -4, morale: 4, users: 6, quality: 14 }, outcome: 'The test reproduces it on the third try: an off-by-one when the row count is a multiple of the page size.' },
      { id: 'ask', label: 'Ask them to record their screen', cost: 'a day of waiting', effects: { budget: 0, morale: -4, users: 2, quality: 4 }, outcome: 'They send a video. It confirms the same thing a test would have found, a day later.' },
      { id: 'cannot', label: 'Tell them it cannot be reproduced', cost: 'nothing now', effects: { budget: 0, morale: 0, users: -14, quality: -10 }, outcome: 'They hear "not our problem". Two weeks later they churn and cite the export.' },
    ],
  },
  {
    id: 'w1-hosting', act: 2,
    title: 'The hosting bill doubles',
    body: 'Traffic grew twenty percent and the bill grew a hundred. Something is not scaling linearly.',
    choices: [
      { id: 'investigate', label: 'Look at what changed before paying', cost: 'a day', effects: { budget: -2, morale: 4, users: 0, quality: 12 }, outcome: 'A scheduled job stopped using an index after a migration. The fix is one line and the bill halves again.' },
      { id: 'pay', label: 'Pay it, revisit next quarter', cost: 'money', effects: { budget: -18, morale: -2, users: 4, quality: -4 }, outcome: 'The bill is absorbed. The missed index is still missed, and it grows with traffic.' },
      { id: 'cut', label: 'Cut features to reduce load', cost: 'users lose things', effects: { budget: -4, morale: -8, users: -10, quality: 2 }, outcome: 'The bill drops and so does usage. You removed a symptom and a reason to use the product.' },
    ],
  },
  {
    id: 'w1-framework', act: 3,
    title: 'The team wants to switch framework',
    body: 'Half the team thinks the current stack is holding them back. The other half thinks a rewrite would kill the quarter.',
    choices: [
      { id: 'no', label: 'Not this quarter, write down why', cost: 'a decision', effects: { budget: 0, morale: -6, users: 0, quality: 4 }, outcome: 'You write the trade down. Half the team is disappointed and everyone knows the reason.' },
      { id: 'pilot', label: 'Pilot it on one internal page', cost: 'two weeks', effects: { budget: -10, morale: 8, users: 0, quality: 6 }, outcome: 'The pilot answers the question with evidence rather than opinion. The answer is "not yet, but for a different reason than we thought".' },
      { id: 'rewrite', label: 'Rewrite the whole thing', cost: 'the quarter', effects: { budget: -26, morale: -6, users: -18, quality: -16 }, outcome: 'Six weeks in it is half-migrated and neither version is stable.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Week 2 — Make it pay
// ---------------------------------------------------------------------------

const W2: SprintStep[] = [
  {
    id: 'w2-pricing-page', act: 1,
    title: 'The pricing page converts at 1%',
    body: 'A thousand people land on it each week and ten sign up. The product is not the problem any more, the page is.',
    choices: [
      { id: 'rewrite', label: 'Rewrite the page and test three versions', cost: 'two weeks', effects: { budget: -10, morale: 4, users: 18, quality: 2 }, outcome: 'The third version converts at 3.4%. The first two taught you which sentence mattered.' },
      { id: 'trial', label: 'Add a free trial instead', cost: 'lowers the wall', effects: { budget: -4, morale: 0, users: 12, quality: -4 }, outcome: 'Signups rise and so does support load, because people get in before they understand it.' },
      { id: 'cheap', label: 'Cut the price to five a month', cost: 'cheaper, less revenue', effects: { budget: -2, morale: -6, users: 22, quality: 0 }, outcome: 'More people pay, each pays less, and support cost per customer did not change.' },
    ],
  },
  {
    id: 'w2-competitor', act: 1,
    title: 'A competitor ships your best feature',
    body: 'They launched last week with the feature you are known for, and a marketing budget you cannot match.',
    choices: [
      { id: 'newfeature', label: 'Ship something they do not have', cost: 'rebuild momentum', effects: { budget: -16, morale: 10, users: 14, quality: -6 }, outcome: 'Differentiation by feature is a treadmill, but for one quarter it works.' },
      { id: 'compare', label: 'Publish a factual comparison page', cost: 'cheap', effects: { budget: -2, morale: 4, users: 8, quality: 4 }, outcome: 'Steady search traffic. Nothing dramatic, nothing expensive.' },
      { id: 'ignore', label: 'Ignore them and talk to users', cost: 'no defence', effects: { budget: 0, morale: 2, users: -10, quality: 2 }, outcome: 'You learn things worth knowing, and lose the accounts that wanted an excuse.' },
    ],
  },
  {
    id: 'w2-support', act: 1,
    title: 'Support tickets tripled',
    body: 'Two people now spend half their week answering the same six questions.',
    choices: [
      { id: 'hire', label: 'Hire a support person', cost: 'headcount', effects: { budget: -22, morale: 14, users: 10, quality: 0 }, outcome: 'The team gets its week back. The new hire asks the same six questions, which is a finding.' },
      { id: 'selfserve', label: 'Build answers into the product', cost: 'slow', effects: { budget: -12, morale: -4, users: 8, quality: 12 }, outcome: 'Three weeks removes half the tickets permanently. The other half are bugs.' },
      { id: 'docs', label: 'Write a help centre', cost: 'cheap, ineffective', effects: { budget: -2, morale: -10, users: -4, quality: -2 }, outcome: 'Nobody reads it. The tickets keep arriving, now with a link to the page they skipped.' },
    ],
  },
  {
    id: 'w2-viral', act: 1,
    title: 'A post brings ten thousand signups overnight',
    body: 'The infrastructure was sized for three hundred users. It is 3am and the database is at 95%.',
    seconds: 20, timeoutChoice: 2,
    choices: [
      { id: 'capacity', label: 'Pay for capacity now', cost: 'expensive, fast', effects: { budget: -26, morale: 6, users: 26, quality: 0 }, outcome: 'The bill triples and nothing goes down. You keep the wave instead of losing it.' },
      { id: 'ratelimit', label: 'Rate-limit new signups', cost: 'protects the core', effects: { budget: -4, morale: -4, users: 10, quality: 6 }, outcome: 'Existing users never notice. Most of the wave waits, and a third never returns.' },
      { id: 'nothing', label: 'Do nothing and hope it holds', cost: 'gamble', effects: { budget: 0, morale: -16, users: -8, quality: -18 }, outcome: 'It falls over at 4am. The status page gets more traffic than the post did.' },
    ],
  },
  {
    id: 'w2-enterprise', act: 1,
    title: 'The contract has a data clause',
    body: 'An enterprise customer wants their data in a separate database. Your schema has one tenant column.',
    choices: [
      { id: 'separate', label: 'Build per-tenant isolation properly', cost: 'three weeks', effects: { budget: -20, morale: -8, users: 8, quality: 18 }, outcome: 'Expensive and correct. Three more enterprise deals unblock because of it.' },
      { id: 'promise', label: 'Promise isolation and add a filter', cost: 'looks finished', effects: { budget: 4, morale: -6, users: 12, quality: -26 }, outcome: 'A filter is not isolation. One missing WHERE clause is now a data breach, not a bug.', fatal: { title: 'A cross-tenant leak', body: 'A report query skipped the tenant filter. One customer saw another customer rows. The contract clause existed because they had been burned before, and now so have you.' } },
      { id: 'decline', label: 'Decline the clause, keep the account small', cost: 'lose the deal', effects: { budget: -10, morale: 4, users: -6, quality: 6 }, outcome: 'You lose the deal and keep an honest architecture. They come back when it exists.' },
    ],
  },
  {
    id: 'w2-churn', act: 2,
    title: 'Enterprise wants SSO, or they walk',
    body: 'One account, a fifth of revenue, needs single sign-on. A month of work.',
    choices: [
      { id: 'build', label: 'Build SSO properly', cost: 'a month', effects: { budget: -18, morale: -8, users: 6, quality: 14 }, outcome: 'The account stays and two more sign because SSO was their blocker too.' },
      { id: 'hack', label: 'Build a version for them only', cost: 'a week, fragile', effects: { budget: -6, morale: -4, users: 2, quality: -14 }, outcome: 'It works until their identity provider renames a field.' },
      { id: 'drop', label: 'Let them go', cost: 'lose revenue', effects: { budget: -16, morale: 6, users: -18, quality: 4 }, outcome: 'You lose a fifth of revenue and keep a roadmap that serves everyone.' },
    ],
  },
  {
    id: 'w2-discount', act: 2,
    title: 'A customer asks for a discount you already gave',
    body: 'They heard the previous deal was 30% off and want the same. The previous deal was for a year upfront.',
    choices: [
      { id: 'match', label: 'Match it with no conditions', cost: 'sets a rule', effects: { budget: -12, morale: -6, users: 6, quality: -2 }, outcome: 'Everyone asks now. The price you publish stops meaning anything.' },
      { id: 'terms', label: 'Offer the same discount on the same terms', cost: 'consistent', effects: { budget: 6, morale: 4, users: 2, quality: 2 }, outcome: 'They take the year upfront. The rule is the terms, not the number.' },
      { id: 'refuse', label: 'Refuse and quote list price', cost: 'rigid', effects: { budget: 0, morale: -4, users: -8, quality: 0 }, outcome: 'They leave, and tell two other prospects why.' },
    ],
  },
  {
    id: 'w2-marketing', act: 2,
    title: 'Marketing wants a launch date you cannot hit',
    body: 'They have booked a launch for three weeks. The feature needs five.',
    choices: [
      { id: 'move', label: 'Ask them to move the date', cost: 'awkward now', effects: { budget: -2, morale: 8, users: 0, quality: 10 }, outcome: 'They move it. A launch date is cheaper to change than a broken launch.' },
      { id: 'crunch', label: 'Crunch to hit it', cost: 'morale', effects: { budget: -8, morale: -20, users: 10, quality: -14 }, outcome: 'It ships on the date with two known defects and a team that has stopped volunteering.' },
      { id: 'partial', label: 'Launch the half that works', cost: 'smaller story', effects: { budget: -4, morale: 4, users: 8, quality: 4 }, outcome: 'A smaller launch that is entirely true. Marketing is disappointed and the support queue is quiet.' },
    ],
  },
  {
    id: 'w2-offer-type', act: 2,
    title: 'A big customer wants a bespoke report',
    body: 'They will pay well for one report that exists only for them.',
    choices: [
      { id: 'bespoke', label: 'Build it just for them', cost: 'off-roadmap', effects: { budget: 22, morale: -10, users: 2, quality: -12 }, outcome: 'You are funded another quarter and your roadmap belongs to one customer.' },
      { id: 'config', label: 'Build a configurable version', cost: 'harder build', effects: { budget: 12, morale: -4, users: 10, quality: 2 }, outcome: 'Twice the work, and every future customer can use it.' },
      { id: 'decline', label: 'Decline, stay on roadmap', cost: 'no cash', effects: { budget: -6, morale: 10, users: 4, quality: 8 }, outcome: 'You say no to real money. The team ships the thing you planned.' },
    ],
  },
  {
    id: 'w2-lawyer', act: 3,
    title: 'The terms of service are a template',
    body: 'A prospect legal team asks about liability and data retention. You copied the terms from an example.',
    choices: [
      { id: 'lawyer', label: 'Pay a lawyer to write real terms', cost: 'expensive', effects: { budget: -18, morale: 2, users: 8, quality: 14 }, outcome: 'Boring, necessary, and it unblocks the deal and three others.' },
      { id: 'edit', label: 'Edit the template yourself', cost: 'cheap, risky', effects: { budget: -2, morale: 0, users: 4, quality: -10 }, outcome: 'It reads fine and says nothing enforceable. Legal notices.' },
      { id: 'ignore', label: 'Send the template unchanged', cost: 'nothing now', effects: { budget: 0, morale: -8, users: -6, quality: -16 }, outcome: 'The prospect forwards it to their counsel, who replies in two paragraphs.' },
    ],
  },
  {
    id: 'w2-arch', act: 3,
    title: 'Two teams want conflicting architectures',
    body: 'One wants a monolith because it ships faster. One wants services because they keep blocking each other.',
    choices: [
      { id: 'pick', label: 'Pick one and commit', cost: 'clear, unpopular', effects: { budget: -6, morale: -6, users: 4, quality: 12 }, outcome: 'Half disagree and everyone knows what to build.' },
      { id: 'both', label: 'Let each team choose', cost: 'avoids conflict', effects: { budget: -4, morale: 6, users: 2, quality: -16 }, outcome: 'Two systems and a data model that does not match in the middle.' },
      { id: 'review', label: 'Decide together in a review', cost: 'slower upfront', effects: { budget: -10, morale: 10, users: 4, quality: 10 }, outcome: 'The decision holds because they made it.' },
    ],
  },
  {
    id: 'w2-hire', act: 3,
    title: 'You can hire one more person',
    body: 'Support, sales, or engineering. All three are stretched.',
    choices: [
      { id: 'eng', label: 'Hire an engineer', cost: 'build faster', effects: { budget: -20, morale: 8, users: 4, quality: 12 }, outcome: 'The backlog moves and the support queue does not.' },
      { id: 'sales', label: 'Hire someone to sell', cost: 'revenue', effects: { budget: 14, morale: -2, users: 8, quality: -4 }, outcome: 'Two deals sign that you would never have chased. Delivery gets tighter.' },
      { id: 'support', label: 'Hire support', cost: 'protect the team', effects: { budget: -18, morale: 14, users: 6, quality: 4 }, outcome: 'Engineers stop answering tickets. The backlog moves for the first time in a month.' },
    ],
  },
  {
    id: 'w2-reseller', act: 1,
    title: 'A reseller wants to white-label it',
    body: 'An agency will sell your product under their brand to their clients, if you give them a partner discount.',
    choices: [
      { id: 'yes', label: 'Sign them up at thirty percent off', cost: 'new channel', effects: { budget: 16, morale: 4, users: 12, quality: -6 }, outcome: 'Three clients arrive in a month. Each one asks for something slightly different.' },
      { id: 'pilot', label: 'Trial with one client first', cost: 'slower', effects: { budget: 6, morale: 6, users: 6, quality: 4 }, outcome: 'One client, one set of requests, learned cheaply. The channel works, and you know what it costs.' },
      { id: 'no', label: 'Decline, sell direct only', cost: 'no channel', effects: { budget: -2, morale: -4, users: -4, quality: 4 }, outcome: 'You keep control of pricing and lose a channel you would have had to support.' },
    ],
  },
  {
    id: 'w2-abuse', act: 1,
    title: 'The free tier is being abused',
    body: 'One account runs forty percent of your total background jobs. It is on the free plan.',
    choices: [
      { id: 'limit', label: 'Add a fair-use limit to the free tier', cost: 'a week', effects: { budget: -6, morale: 4, users: -6, quality: 8 }, outcome: 'A handful of heavy users leave and the infrastructure calms down. The limit is written down and applies to everyone.' },
      { id: 'special', label: 'Throttle just that account quietly', cost: 'a hack', effects: { budget: -2, morale: -4, users: 0, quality: -8 }, outcome: 'It works until someone else does the same thing, and then there is no rule to point at.' },
      { id: 'convert', label: 'Ask them to move to a paid plan', cost: 'a conversation', effects: { budget: 10, morale: 2, users: 0, quality: 2 }, outcome: 'They agree, because forty percent of the jobs was worth paying for. Nobody else noticed anything.' },
    ],
  },
  {
    id: 'w2-refund', act: 2,
    title: 'A customer demands a refund',
    body: 'They paid for a year, used it twice, and want their money back. Your terms say thirty days.',
    choices: [
      { id: 'refund', label: 'Refund outside the window', cost: 'a precedent', effects: { budget: -8, morale: 4, users: 2, quality: 0 }, outcome: 'They leave satisfied and tell people. A second customer asks for the same thing the next week.' },
      { id: 'terms', label: 'Hold to the terms, offer credit instead', cost: 'firm but fair', effects: { budget: 0, morale: 0, users: -4, quality: 2 }, outcome: 'They take the credit and stay. The rule holds and nobody feels robbed.' },
      { id: 'ignore', label: 'Stop replying', cost: 'nothing', effects: { budget: 0, morale: -6, users: -8, quality: -6 }, outcome: 'They dispute the charge. The processor freezes the account for a week while it is looked into.' },
    ],
  },
  {
    id: 'w2-spam', act: 2,
    title: 'Your onboarding email lands in spam',
    body: 'Sixty percent of new signups never open the first email, because it never reaches the inbox.',
    choices: [
      { id: 'dns', label: 'Set up SPF, DKIM and DMARC properly', cost: 'a day', effects: { budget: -2, morale: 4, users: 14, quality: 8 }, outcome: 'Boring, correct, and it fixes the deliverability for everything you ever send.' },
      { id: 'inapp', label: 'Move onboarding into the product', cost: 'a week', effects: { budget: -8, morale: 6, users: 10, quality: 6 }, outcome: 'Nobody depends on an inbox any more. The email becomes a nudge rather than the only path.' },
      { id: 'resend', label: 'Send it from a different address', cost: 'a guess', effects: { budget: 0, morale: -4, users: -2, quality: -6 }, outcome: 'It works for a week and then lands in spam again, now with two addresses on your domain.' },
    ],
  },
  {
    id: 'w2-parttime', act: 3,
    title: 'A team member wants to go part-time',
    body: 'They want three days a week for personal reasons. They are your second most productive person.',
    choices: [
      { id: 'yes-adjust', label: 'Agree and re-plan around it', cost: 'less capacity', effects: { budget: -6, morale: 18, users: -4, quality: 6 }, outcome: 'You lose two days a week and keep someone who knows the codebase, fully engaged on the days they are there.' },
      { id: 'no', label: 'Ask them to stay full-time until after the launch', cost: 'delay', effects: { budget: 0, morale: -14, users: 0, quality: -4 }, outcome: 'They agree and disengage quietly. After the launch they leave anyway, on their own timeline.' },
      { id: 'contract', label: 'Agree but move them to contract work', cost: 'restructure', effects: { budget: -4, morale: -4, users: 0, quality: 2 }, outcome: 'The arrangement works on paper and they stop coming to the planning meetings, because contractors are not invited.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Week 3 — Keep it alive
// ---------------------------------------------------------------------------

const W3: SprintStep[] = [
  {
    id: 'w3-scale', act: 1,
    title: 'The database is at 80% mid-week',
    body: 'Traffic doubled and will double again next quarter. You can add hardware or fix the queries.',
    choices: [
      { id: 'hardware', label: 'Scale up the hardware', cost: 'money, buys time', effects: { budget: -20, morale: 4, users: 8, quality: -4 }, outcome: 'It buys two quarters. The queries still do full scans, on a bigger machine.' },
      { id: 'queries', label: 'Profile and fix the hot queries', cost: 'two weeks', effects: { budget: -10, morale: -4, users: 4, quality: 18 }, outcome: 'CPU drops to 30% and the bill falls with it.' },
      { id: 'cache', label: 'Cache the dashboard', cost: 'patch a symptom', effects: { budget: -6, morale: 0, users: 10, quality: 2 }, outcome: 'The dashboard is fast and everything else is still slow.' },
    ],
  },
  {
    id: 'w3-legacy', act: 1,
    title: 'The oldest module has no tests',
    body: 'Everyone is afraid to touch billing. It has been do-not-change for eight months.',
    choices: [
      { id: 'characterise', label: 'Write characterisation tests first', cost: 'slow, safe', effects: { budget: -14, morale: 2, users: 0, quality: 22 }, outcome: 'Two weeks pinning current behaviour. The next change takes an hour instead of a weekend.' },
      { id: 'rewrite', label: 'Rewrite it from scratch', cost: 'risky', effects: { budget: -24, morale: -10, users: -8, quality: -14 }, outcome: 'The rewrite covers 90% of cases. The other 10% are enterprise invoices.' },
      { id: 'delete', label: 'Delete the module and rebuild it live', cost: 'irreversible', effects: { budget: 0, morale: -20, users: -20, quality: -30 }, outcome: 'There was no backup of the invoice history.', fatal: { title: 'Invoices gone', body: 'You removed the module before migrating its data. Three years of invoices are unrecoverable. The company cannot bill this month.' } },
    ],
  },
  {
    id: 'w3-resign', act: 1,
    title: 'Your best engineer resigns',
    body: 'They have an offer for twenty percent more and a title you cannot match.',
    choices: [
      { id: 'counter', label: 'Counter-offer with more money', cost: 'expensive', effects: { budget: -22, morale: -6, users: 0, quality: 6 }, outcome: 'They stay a year, and everyone learns that resigning is how you get a raise.' },
      { id: 'ask', label: 'Ask what would actually keep them', cost: 'conversation', effects: { budget: -8, morale: 12, users: 0, quality: 8 }, outcome: 'It was never the money. They wanted to own something, so you give them the platform work.' },
      { id: 'go', label: 'Let them go and document the handover', cost: 'risk', effects: { budget: -6, morale: -10, users: -6, quality: 4 }, outcome: 'You lose six weeks of productivity and keep a good reference.' },
    ],
  },
  {
    id: 'w3-outage', act: 1,
    title: 'An outage during your biggest demo',
    body: 'Forty minutes in front of the largest prospect you have ever had, and the dashboard stops loading.',
    seconds: 15, timeoutChoice: 2,
    choices: [
      { id: 'honest', label: 'Say it is down, show the recording', cost: 'honest', effects: { budget: 0, morale: 6, users: 6, quality: 4 }, outcome: 'They respect the honesty and ask better questions. They sign a month later.' },
      { id: 'stall', label: 'Stall and retry until it returns', cost: 'gamble', effects: { budget: 0, morale: -10, users: -8, quality: -4 }, outcome: 'Fourteen minutes of small talk. It comes back. They do not sign.' },
      { id: 'blame', label: 'Blame their network', cost: 'looks easy', effects: { budget: 0, morale: -14, users: -14, quality: -8 }, outcome: 'Their engineer is on the call and knows it is not the network.' },
    ],
  },
  {
    id: 'w3-regulator', act: 1,
    title: 'A regulator asks about personal data',
    body: 'They want a written account of what you store, where, and for how long.',
    choices: [
      { id: 'audit', label: 'Audit everything, then answer fully', cost: 'three weeks', effects: { budget: -16, morale: -4, users: 2, quality: 20 }, outcome: 'The audit finds two fields stored longer than you said. You fix them before anyone asks again.' },
      { id: 'minimal', label: 'Answer with the minimum required', cost: 'fast, thin', effects: { budget: -4, morale: 0, users: 0, quality: -10 }, outcome: 'Technically compliant and practically useless. The next request is not polite.' },
      { id: 'consultant', label: 'Hire a consultant to handle it', cost: 'expensive', effects: { budget: -20, morale: 2, users: 0, quality: 6 }, outcome: 'A document nobody internally understands.' },
    ],
  },
  {
    id: 'w3-security', act: 2,
    title: 'A dependency has a known vulnerability',
    body: 'The advisory is two days old. Patching means a week of regression testing on the area nobody wants to touch.',
    choices: [
      { id: 'patch', label: 'Patch and regression test properly', cost: 'a week', effects: { budget: -16, morale: -6, users: -2, quality: 22 }, outcome: 'A quiet week and no incident. The advisory is closed with a test that proves it.' },
      { id: 'defer', label: 'Schedule it for next month', cost: 'hopeful', effects: { budget: 0, morale: 2, users: 2, quality: -18 }, outcome: 'It is still two days old in a month, and now it is public.' },
      { id: 'mitigate', label: 'Block the attack path at the edge', cost: 'partial', effects: { budget: -6, morale: 0, users: 0, quality: 8 }, outcome: 'It buys time honestly, and you say so in the ticket.' },
    ],
  },
  {
    id: 'w3-vendor', act: 2,
    title: 'A core dependency raises prices fivefold',
    body: 'Your product sits on one vendor. Their new pricing removes your margin.',
    choices: [
      { id: 'migrate', label: 'Migrate to a cheaper provider', cost: 'six weeks', effects: { budget: -18, morale: -8, users: -4, quality: 12 }, outcome: 'Painful, and you now own an abstraction that makes the next move cheaper.' },
      { id: 'absorb', label: 'Absorb the cost and raise prices', cost: 'pass it on', effects: { budget: -8, morale: -4, users: -10, quality: 0 }, outcome: 'Customers pay for your vendor decision.' },
      { id: 'negotiate', label: 'Negotiate a volume discount', cost: 'depends on leverage', effects: { budget: -6, morale: 2, users: 0, quality: 2 }, outcome: 'You get thirty percent off, which is not fivefold. Margin stays thin.' },
    ],
  },
  {
    id: 'w3-arch', act: 2,
    title: 'Two teams want conflicting architectures',
    body: 'One wants a monolith because it ships faster. One wants services because they keep blocking each other.',
    choices: [
      { id: 'pick', label: 'Pick one and commit', cost: 'clear, unpopular', effects: { budget: -6, morale: -6, users: 4, quality: 12 }, outcome: 'Half disagree and everyone knows what to build.' },
      { id: 'both', label: 'Let each team choose', cost: 'avoids conflict', effects: { budget: -4, morale: 6, users: 2, quality: -16 }, outcome: 'Two systems and a data model that does not match in the middle.' },
      { id: 'review', label: 'Decide together in a review', cost: 'slower upfront', effects: { budget: -10, morale: 10, users: 4, quality: 10 }, outcome: 'The decision holds because they made it.' },
    ],
  },
  {
    id: 'w3-burnout', act: 2,
    title: 'You have not taken a day off in four months',
    body: 'You are the bottleneck on every decision and the last to review every change.',
    choices: [
      { id: 'off', label: 'Take a week off and let someone decide', cost: 'trust', effects: { budget: 0, morale: 14, users: 0, quality: 6 }, outcome: 'One bad call gets made and reverted. You come back rested and the team discovers it can operate.' },
      { id: 'push', label: 'Push through until launch', cost: 'familiar', effects: { budget: 0, morale: -16, users: 4, quality: -12 }, outcome: 'You ship on time and make three decisions you would not have made rested.' },
      { id: 'head', label: 'Hire a head of engineering', cost: 'expensive', effects: { budget: -24, morale: 8, users: 2, quality: 10 }, outcome: 'A month to find, two to trust, then you are no longer the bottleneck.' },
    ],
  },
  {
    id: 'w3-offer', act: 3,
    title: 'An acquisition offer arrives',
    body: 'A larger company offers four times revenue. It would make everyone whole and end the company.',
    choices: [
      { id: 'consider', label: 'Seriously consider it', cost: 'distraction', effects: { budget: 8, morale: -10, users: -4, quality: -6 }, outcome: 'Three months of diligence and a roadmap nobody dares change. The offer falls through on terms.' },
      { id: 'decline', label: 'Decline and raise instead', cost: 'commit to independence', effects: { budget: 26, morale: 10, users: 12, quality: 4 }, outcome: 'You raise on your own terms, with a number to beat.' },
      { id: 'wait', label: 'Ask for more and revisit in a year', cost: 'keeps options', effects: { budget: 4, morale: 2, users: 6, quality: 0 }, outcome: 'They raise the number slightly. You have a year to decide.' },
    ],
  },
  {
    id: 'w3-talent', act: 3,
    title: 'Two of your team are interviewing elsewhere',
    body: 'You heard it second-hand. Neither has said anything to you.',
    choices: [
      { id: 'ask', label: 'Ask them directly what would make them stay', cost: 'uncomfortable', effects: { budget: -8, morale: 14, users: 0, quality: 8 }, outcome: 'One was already gone. The other had been waiting to be asked for four months.' },
      { id: 'raise', label: 'Give everyone a raise pre-emptively', cost: 'expensive', effects: { budget: -24, morale: 10, users: 0, quality: 0 }, outcome: 'Both stay. So does everyone else, and the runway shortens by a month.' },
      { id: 'nothing', label: 'Wait for them to tell you', cost: 'avoidance', effects: { budget: 0, morale: -16, users: -4, quality: -6 }, outcome: 'Both leave within a month, and you find out on their last day.' },
    ],
  },
  {
    id: 'w3-final', act: 3,
    title: 'Raise, sell, or stay',
    body: 'Three paths, and the numbers to justify any of them.',
    choices: [
      { id: 'raise', label: 'Raise and grow aggressively', cost: 'more pressure', effects: { budget: 34, morale: -8, users: 24, quality: -12 }, outcome: 'A larger round, a larger team, a larger burn. Growth arrives before the organisation can absorb it.' },
      { id: 'independent', label: 'Stay independent and profitable', cost: 'slower, stable', effects: { budget: 18, morale: 16, users: 8, quality: 12 }, outcome: 'You grow at the pace you can sustain. Nobody writes a profile of you and everybody stays.' },
      { id: 'sell', label: 'Sell', cost: 'the end', effects: { budget: 44, morale: -4, users: 6, quality: 0 }, outcome: 'The number is good. The product continues under someone else roadmap.' },
    ],
  },
  {
    id: 'w3-questionnaire', act: 1,
    title: 'A security questionnaire arrives',
    body: 'A prospect sends a hundred and twenty questions about your infrastructure. Two other deals are waiting on the same thing.',
    choices: [
      { id: 'do', label: 'Answer it properly, then reuse it', cost: 'a week', effects: { budget: -12, morale: -4, users: 8, quality: 16 }, outcome: 'A week of work becomes a reusable document, and it exposes two things you had not documented.' },
      { id: 'copy', label: 'Copy answers from a template online', cost: 'fast, wrong', effects: { budget: -2, morale: 0, users: 4, quality: -18 }, outcome: 'You claim encryption at rest that you do not have. That answer is now in writing.', fatal: { title: 'The claim was audited', body: 'The prospect checked two of the answers. One was false. The deal ended and the questionnaire is now evidence that you misrepresented your controls.' } },
      { id: 'partial', label: 'Answer the security section only', cost: 'partial', effects: { budget: -4, morale: 0, users: 2, quality: 4 }, outcome: 'They accept a partial answer for now and ask for the rest at contract time.' },
    ],
  },
  {
    id: 'w3-two-incidents', act: 1,
    title: 'Two incidents in one week',
    body: 'Neither was long, both were customer visible, and the team is jumpy.',
    choices: [
      { id: 'postmortem', label: 'Write a short postmortem for each, blameless', cost: 'two days', effects: { budget: -8, morale: 10, users: 2, quality: 18 }, outcome: 'Different triggers, same cause: a deploy that skipped a check. One fix closes both.' },
      { id: 'freeze', label: 'Freeze deploys for a week', cost: 'stops shipping', effects: { budget: -6, morale: -12, users: -6, quality: 4 }, outcome: 'No new incidents and no new features. The underlying check is still missing when the freeze lifts.' },
      { id: 'moveon', label: 'Fix both and move on', cost: 'fast', effects: { budget: -2, morale: -4, users: 0, quality: -12 }, outcome: 'Two fixes, two symptoms, one unchanged cause. The third incident arrives in a month.' },
    ],
  },
  {
    id: 'w3-reorg', act: 2,
    title: 'The board wants a reorg',
    body: 'They want named teams with clear ownership. Right now everyone works on everything.',
    choices: [
      { id: 'teams', label: 'Split into two teams with an owner each', cost: 'coordination cost', effects: { budget: -8, morale: 6, users: 2, quality: 12 }, outcome: 'Two clear owners, two roadmaps, and a weekly sync that exists to stop them diverging.' },
      { id: 'keep', label: 'Keep it flat and explain why', cost: 'pushback', effects: { budget: 0, morale: 4, users: 0, quality: 0 }, outcome: 'At nine people, flat still works. You say so in writing, with the number at which it stops working.' },
      { id: 'titles', label: 'Give everyone new titles instead', cost: 'paper change', effects: { budget: -2, morale: -8, users: 0, quality: -6 }, outcome: 'Titles change and ownership does not. Two people now believe they own the same thing.' },
    ],
  },
  {
    id: 'w3-exit-access', act: 2,
    title: 'A former employee still has access',
    body: 'They left six weeks ago. Their account is still active and still in the production group.',
    choices: [
      { id: 'revoke', label: 'Revoke now, then audit everyone', cost: 'an afternoon', effects: { budget: -4, morale: 2, users: 0, quality: 20 }, outcome: 'One account removed, then a list of everyone with production access, most of whom should not have it.' },
      { id: 'revoke-only', label: 'Just remove that one account', cost: 'a minute', effects: { budget: 0, morale: 0, users: 0, quality: 4 }, outcome: 'The immediate hole is closed. The next departure will repeat the same six weeks.' },
      { id: 'later', label: 'Add it to the list for next sprint', cost: 'nothing now', effects: { budget: 0, morale: -6, users: 0, quality: -20 }, outcome: 'An account with production access sits open for another two weeks.', fatal: { title: 'Someone logged in', body: 'The account was used from an address nobody recognised. Nothing was taken that you can prove, and you cannot prove anything, because the audit log only goes back nine days.' } },
    ],
  },
  {
    id: 'w3-keynote', act: 3,
    title: 'You are invited to give a keynote',
    body: 'A conference wants you to talk about building with AI agents. It is three days of preparation.',
    choices: [
      { id: 'yes', label: 'Do it, prepare properly', cost: 'three days', effects: { budget: -6, morale: 10, users: 18, quality: 0 }, outcome: 'Hiring gets easier and three inbound leads arrive. Three days of roadmap do not.' },
      { id: 'reuse', label: 'Do it with existing material', cost: 'a day', effects: { budget: -2, morale: 4, users: 8, quality: 0 }, outcome: 'A talk that is honest about being recycled. Still useful, and it cost a day.' },
      { id: 'no', label: 'Decline and ship instead', cost: 'no reach', effects: { budget: 0, morale: -4, users: -4, quality: 8 }, outcome: 'The feature ships. Nobody outside your users hears about it.' },
    ],
  },
];

export const SPRINT_ZERO: SprintScenario = {
  key: 'sprint-zero',
  title: 'Sprint Zero',
  tagline: 'Pick a week, run it, live with the numbers',
  summary:
    'Three weeks, eight decisions each, drawn from a bank of twelve. Each week starts on the numbers the last one ended with, and each week ends with a summary of what moved. Some options end the run on the spot.',
  meta: '3 weeks, 24 of 36 drawn',
  minutes: 20,
  stats: [
    { key: 'budget', label: 'Budget', max: 160, danger: 25 },
    { key: 'morale', label: 'Morale', max: 100, danger: 30 },
    { key: 'users', label: 'Users', max: 100, danger: 1 },
    { key: 'quality', label: 'Quality', max: 100, danger: 30 },
  ],
  start: () => ({ budget: 100, morale: 70, users: 0, quality: 80 }),
  weeks: [
    { id: 'build', title: 'Week 1: Build it', tagline: 'Six weeks, two people, no money.', bank: W1, draw: [3, 3, 2] },
    { id: 'pay', title: 'Week 2: Make it pay', tagline: 'Users exist. Revenue does not.', bank: W2, draw: [3, 3, 2] },
    { id: 'alive', title: 'Week 3: Keep it alive', tagline: 'Survive your own success.', bank: W3, draw: [3, 3, 2] },
  ],
  score: (stats) =>
    Math.max(
      0,
      Math.min(
        100,
        Math.round((stats.users * 1.6 + stats.quality * 0.9 + stats.morale * 0.9 + Math.max(0, stats.budget) * 0.4) / 3),
      ),
    ),
  ending: (stats) => {
    if (stats.budget <= 0 || stats.morale <= 0 || stats.quality <= 10) {
      return {
        key: 'collapse',
        title: 'It never survived',
        body: 'The runway ran out, or the team did, or the codebase did. There is no fourth week to write about.',
        insight:
          'No single call caused this. It was the accumulation: a scope you could not finish, a quality problem deferred twice, and a team that stopped believing the plan.',
        takeaway: 'Protect morale and quality early. Both are cheap to keep and expensive to recover.',
      };
    }
    if (stats.users >= 55 && stats.quality >= 60 && stats.morale >= 45) {
      return {
        key: 'sustainable',
        title: 'You built something that lasts',
        body: 'It shipped, it earns, people use it, and the team is still standing.',
        insight:
          'The numbers that decide this are the boring ones: quality above sixty, morale above forty-five. Neither is exciting in a weekly review, and both decide whether month twelve exists.',
        takeaway: 'The ending that lasts is the one where you said no at least once a week.',
      };
    }
    return {
      key: 'pyrrhic',
      title: 'It survived and it cost you the team',
      body: 'There is a product and there are users. But morale or quality is on the floor, and next quarter will be worse.',
      insight:
        'Shipping is not the only outcome. A product that leaves a codebase nobody wants to touch and a team quietly interviewing is a debt taken on to hit a date.',
      takeaway: 'A launch that burns the team is a loan, not a win.',
    };
  },
};
