# Review notebook and class insights

Two additions that close the loop on quizzes. Learners get their missed questions back on a
spaced schedule; instructors see which questions the class misses and why. Both are built on
data the app already saved (`activity_attempts.detail.answers`), so no activity code changed.
Read `docs/standards/` first; this page only explains what was added and why.

## What was added

| Feature | Where | Route / tab | Home widget | Nav |
|---|---|---|---|---|
| Review: mistake notebook + spaced review | `src/modules/review/` (new module) | `/review` (learners) | "Review" (order 25, half) | Review (order 25, learners) |
| Class insights | `src/modules/classes/` (existing module) | `/classes/[classId]?tab=insights` (instructors, admins) | – | – |

Files outside these two modules that changed:

- `src/registry/modules.ts` — one import and one list entry for the review module.
- `src/core/events.ts` — new `EVENT_TYPES.reviewAnswered` (`review.answered`), as DATA_MODEL
  asks for every new event.
- `eslint.config.mjs` — `review` added to the module-boundary list, so the "modules never
  import each other" rule covers it.
- `scripts/seed/run.ts` — seeded learners now save their quiz answers (see below).
- `docs/standards/DATA_MODEL.md` and `DATA_MODEL.zh-CN.md` — the two tables and the event.

**Two migrations, one per feature:**

| Migration | Table |
|---|---|
| `drizzle/0003_review_items.sql` | `review_items` |
| `drizzle/0004_class_insight_summaries.sql` | `class_insight_summaries` |

After pulling, stop `npm run dev` and run `npm run db:reset` (new tables and new seed data).

## Why these placements

Quizzes already saved every answer a learner picked, but nothing read them back: a wrong
answer was forgotten as soon as the result screen closed, and instructors only saw XP and
activity counts. These two features are the read side of the same data.

- **Review is its own module.** It is a learner tool with its own page, table and widget, and
  it does not belong to any one course.
- **Insights is a tab in `classes`.** It only makes sense for one class, it needs the class
  roster and assigned courses, and the instructor already goes to the class page to check on
  their students. A separate module would have had to rebuild all of that.

Neither imports the quiz module. Each keeps a narrow zod copy of the quiz config and answer
shapes and parses the stored JSON itself, which is what the module isolation rule asks for.

## Review: mistake notebook and spaced review

### Where cards come from

`syncReviewItems()` (`review/queries.ts`) runs whenever the learner opens Home or `/review`.
It reads the learner's quiz attempts, compares `detail.answers` with each question's
`answerIndex`, and adds one `review_items` row per question answered wrong. It is safe to run
on every view: a question already in the notebook is not added twice, and a mastered card comes
back only when a newer quiz attempt gets it wrong again.

Each row keeps a snapshot of the prompt. If the course author later edits or removes the
question, the old card is hidden instead of showing a different question.

### The schedule (Leitner boxes)

All rules live in `review/logic.ts` as pure functions with unit tests (`logic.test.ts`).

| Box | Meaning | After a right answer |
|---|---|---|
| 0 | Just missed (due now) | box 1, due in 1 day |
| 1 | | box 2, due in 3 days |
| 2 | | box 3, due in 7 days |
| 3 | | mastered |

Four right answers in a row on due cards means mastered. A wrong answer at any point sends the
card back to box 0, due again tomorrow, and counts as a lapse.

### Rules that keep it honest

- **Answers are checked on the server** (`answerReviewCard` in `review/actions.ts`). The page
  never receives the right answer or the explanation until the learner has picked an option.
- **Only due cards move.** Answering a card that is not due yet is allowed, but it changes
  nothing, so the schedule cannot be skipped by clicking the same card twice.
- **Small XP.** A right answer on a due card earns 2 XP (`REVIEW_CORRECT_XP`), written as a
  `review.answered` event, so reviewing shows up on the leaderboard and streak without being a
  way to farm XP.
- **Short sessions.** One sitting shows at most 10 due cards (`SESSION_SIZE`), oldest first.

### What the learner sees

- **Home widget:** "N questions to try again" with a Start review button, or "All caught up"
  with the next due date.
- **`/review`, top:** three stats (due now, in rotation, mastered) and the current session,
  one card at a time, in the same option style as the quiz player. After checking, the card
  shows whether it was right, the author's explanation, what the learner picked in the
  original quiz, and when the card comes back.
- **`/review`, bottom:** the full notebook grouped by course, each card with a link back to its
  lesson and its next review date.

## Class insights

### The numbers

`getClassQuestionInsights()` (`classes/queries.ts`) takes each class member's **latest** saved
attempt for every quiz in the class's assigned courses (or every course, if none are assigned)
and tallies the answers per question. The pure counting functions are in `classes/insights.ts`
and tested in `insights.test.ts`.

The tab shows:

- **Four stats:** quiz answers, average error rate (weighted over every answer), questions
  missed by 50% or more, and students answering out of the class size.
- **Question by question:** every answered question, most missed first, with an error-rate
  bar, "N of M wrong", the most common wrong option, and a "See every option" breakdown of how
  many students picked each option.

### The AI misconception summary

The instructor clicks **Summarise** (`summariseMisconceptions` in `classes/actions.ts`):

1. `pickFocusQuestions()` takes up to 8 of the worst questions with at least 2 answers.
2. `buildMisconceptionInput()` sends each one with the right answer, how many missed it and
   which wrong options were picked. **No student names or ids are sent.**
3. `generateJson()` (feature `classes.summarise_misconceptions`, fast tier) returns 2–4
   misconceptions, each with a short explanation and one teaching tip. The output is checked
   against `misconceptionSummarySchema`.
4. The result is stored in `class_insight_summaries` (one row per class) with the number of
   answers it was based on. When new answers arrive, the card says "N new answers since this
   summary" so the instructor knows when to refresh.

With no AI key, a daily limit reached or a provider error, `mockMisconceptionSummary()` builds
a summary straight from the numbers ("5 students picked X instead of Y") and the card says it is
a demo summary. The tab works fully offline.

## Seed data

The original seed saved scores but not which options were picked, so both features would open
empty on a fresh database. `simulatedQuizAnswers()` in `scripts/seed/run.ts` now writes answers
that match each seeded score. Some questions are made harder than others, and most misses land
on the same tempting wrong option, so the insights tab shows a realistic pattern. It uses its
own random stream, so the rest of the demo history (XP, streaks, leaderboard) is unchanged.

## Testing

- `npm run check` passes (typecheck, lint, tests). New tests: `src/modules/review/logic.test.ts`
  and `src/modules/classes/insights.test.ts`.
- Manual check in the browser on a freshly reset database:
  - As **Mia** (learner): answer a quiz question wrong → it appears on `/review` as due now →
    answer it right → "+2 XP", the card is due tomorrow, and the page source contains no right
    answers.
  - As **Dr. Chan** (instructor): the Insights tab shows the new answer in the counts and error
    rates, "new answers since this summary" appears, and Refresh summary updates it.

## Known limitations and follow-ups

- **Stats do not refresh after a review round** until the page is reloaded (the action does not
  call `revalidatePath` yet). Small fix to follow.
- **Only the latest attempt is kept** per learner per quiz (`activity_attempts` is overwritten
  on retry). The notebook syncs on every Home and Review visit, so a missed question is almost
  always captured first, but insights cannot show how a student's first attempt differed from
  their last.
- **Review answers are not counted in insights.** The tab shows quiz results only, not whether
  students still miss a question during review. Worth discussing as a next step.
- **If quiz options are ever shuffled**, the quiz player must keep saving the *original* option
  index in `detail.answers`, otherwise both features will count the wrong option.
- **Home widget order:** the Review widget uses order 25, the same as Scenarios, so on wide
  screens it sits just before Scenarios. Agree on the final home layout as a team.

## Style notes

Everything uses the existing UI kit and tokens: `Card` with a tint, `Stat`, `Badge`,
`ProgressBar`, `Button`, `EmptyState` and `Pip` for empty states. The review card reuses the quiz
player's option style so a learner recognises it. The AI summary card uses lilac, the tint the
UI guidelines reserve for AI features. Copy is plain English and avoids the banned words.

## How it was built

Code written with Claude Code (in VS Code) following `AGENTS.md` and `docs/standards/`. I
reviewed the changes, tested both roles in the browser, split the work into one commit per
feature, and resolved the merge with `main` (migration numbering, module registry, data model
docs) before opening PR #3.
