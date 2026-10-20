# Scenarios, badges and Pip growth

Three additions to Sprout, all built as modules so they follow the same rules as everything
else. Read `docs/standards/` first; this page only explains what was added and why it sits
where it sits.

## What was added

| Module | Route | Home widget | Nav |
|---|---|---|---|
| `src/modules/scenarios/` | `/scenarios`, `/scenarios/[key]`, `/scenarios/interview` | "Scenarios" (order 25) | Scenarios (order 100) |
| `src/modules/achievements/` | `/badges` | "Your sprout" (order 26) | Badges (order 110) |

Two files outside the modules changed:

- `src/registry/modules.ts` — two import lines and two list entries. That is the documented
  way to add a module.
- `docs/standards/DATA_MODEL.md` — records the `scenario_runs` table and the
  `scenario.completed` event.

**One migration is required** because a new table was added:

```bash
npm run db:generate   # creates the SQL for scenario_runs
npm run db:migrate
```

## Why these placements

The app already has three tiers of practice:

1. **Activities** inside a lesson — two minutes, one idea.
2. **Courses** — a sequence of lessons.
3. **Studio / classes** — instructor work.

Scenarios are the missing middle: ten to twenty minutes where your decisions persist. They
are not lessons and they are not graded activities, so they get their own route and their own
home widget rather than being squeezed into the lesson runner.

The home grid now reads, in order: *Keep going* (20), *Scenarios* (25), *Your sprout* (26),
*Leaderboard* (30). One row on wide screens: the thing you were doing, the place to practise,
the thing you are growing, the thing you are racing. Badges deliberately sit with growth and
not with the leaderboard, because a badge is about what you did, not who you beat.

## Scenarios

`ScenarioDef` (see `content/types.ts`) is the whole contract:

```ts
{
  key, title, tagline, summary, meta, minutes,
  stats,       // which numbers this scenario shows
  parts,       // one part, or three weeks
  steps,       // situations with 2-4 choices each
  start(),     // opening numbers
  ending(),    // pure function: numbers + history -> ending
  score(),     // 0-100
}
```

Adding a scenario is one file in `content/` plus one line in `engine.ts`. The runner is
generic: `components/choice-runner.tsx` renders whatever the definition describes, so a new
scenario needs no UI work.

### Ship It

A bank of **thirty** review turns. Nine are drawn per run — three correct as written, three to
reject, three to repair — then shuffled, so the verdicts are never grouped and a player cannot
pattern-match "the agent is always wrong". Roughly a third of the bank is correct, which makes
this a calibration exercise rather than a suspicion exercise.

Four verbs, four different costs:

| Verb | Cost | Effect |
|---|---|---|
| Read the tests | 2 min | Reveals the test output or git log. **No quality cost** — looking is not a judgement. |
| Approve | 0 min | Free, which is exactly why it is the one to distrust. |
| Reject | 1–2 min | Right when the change is fundamentally unsound. Wrong when it was correct. |
| Repair | 4–8 min | Enters a 1–2 step repair sequence, then asks for a verdict. |

Score is `0.65 × project quality + 0.35 × (unspent minutes / budget)`. Quality starts at 100
and only ever goes down, so saving time and keeping quality are in direct conflict.

The evidence verb exists so that guessing has an alternative. A player who never reads the
tests still finishes faster; a player who reads all nine spends eighteen of thirty minutes and
loses a third of the time component. Both are defensible, which is the point.

### Sprint Zero

Three weeks. Each week has its own bank (18 / 17 / 17 questions) and draws **eight**: three
from the opening act, three from the middle, two from the end, then restores narrative order.
A fresh seed is generated every time a week is entered, so two playthroughs differ while the
story still reads in sequence.

Each week starts on the numbers the previous week ended with, ends with a **week summary**
(what moved in each of the four stats, plus one piece of advice derived from the weakest one),
and then returns to the week picker. A week opens only when the one before it is finished.

Six of the fifty-two questions carry a **trap option** that ends the run immediately and scores
zero. The debrief names the decision rather than the decline.

Three decisions are timed. When the clock runs out, the worst option is taken for you, and the
result screen says so.

### Interview Coach

Seven formats, five questions each, thirty-five questions total. One question at a time, and a
three-step hint ladder when the learner stalls. Using a hint costs 0.4 of a point, because the
point of the exercise is answering unaided.

Scoring is **deterministic** (`content/interview-engine.ts`): a regex pass over the answer looks
for an example, a number, a trade-off, a verification step and whether AI came up. The same
answer always produces the same score, which is what makes the debrief trustworthy. A model
can be added later to improve the wording, but the anchors should stay where they are.

The debrief quotes the learner's own sentences back at them. If they never mention AI, the
AI-fluency grid is left unscored and says so, rather than inventing a score.

## Badges

No table. `achievements/definitions.ts` is a list of predicates over one
`BadgeSnapshot`:

```ts
{ id, name, description, group, icon, tint,
  progress: (s) => ({ have, need }),
  earned: (s) => boolean }
```

The snapshot is built in `achievements/queries.ts` from `learning_events`,
`activity_attempts`, `lesson_completions` and `enrollments`. Because scenarios write
`scenario.completed` events, the achievements module can see scenario results **without
importing the scenarios module** — which is what the module isolation rule asks for.

Nineteen badges in three groups: Learning, Practice, Showing up. Every badge shows progress,
so a locked badge is a target rather than a mystery.

## Pip growth

`growthStage(level)` in core already mapped levels to mascot stages; what was missing was
anywhere that showed the journey. `components/growth-card.tsx` renders all five stages with
the XP threshold for each, the current one marked, and the distance to the next one. The home
widget shows the same thing in one line.

Thresholds come from `LEVELS` in `core/progress/xp.ts`: 0 / 100 / 250 / 900 / 2100 XP.

Scenario scores feed the same XP total, so practising a scenario grows Pip too. Only
improvement over your previous best is awarded, matching `xpDelta()` for activities, so a
scenario cannot be farmed by replaying it.

## Style notes

Everything uses the existing kit and tokens: `Card` with a tint, `Badge`, `Button`,
`ProgressBar`, `Pip`, `PipSays`. No new colours, no new border or shadow rules, no emoji in
buttons, and the copy avoids the banned words. Icons are `lucide-react` at `h-4 w-4` in
buttons and `h-5 w-5` in headers.

One deliberate restraint: scenario cards are the same sticker shape as course cards, not a
separate visual language. The only difference is the tint (coral for supervision, sky for the
simulation, lilac for the interview), which matches the meaning already assigned to those
tokens in `UI_GUIDELINES.md`.
