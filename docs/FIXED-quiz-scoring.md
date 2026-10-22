# Quiz answer order and server-side scoring

Two fixes to how activities are played and scored. Neither adds a page, a table or a
migration. Read `docs/standards/` first; this page only explains what was wrong, what changed
and what is still open.

## The two problems

1. **The right answer was almost always A.** In the seeded courses, 15 of the 16 quiz questions
   had `answerIndex: 0`, and the quiz player showed options in the stored order. A learner could
   pass most quizzes by always picking the first option, which is also easy to spot in a demo.
   The AI course generator's example config also uses `answerIndex: 0`, so generated quizzes lean
   the same way.
2. **The browser decided the score.** `submitActivityResult` (`src/modules/courses/actions.ts`)
   trusted the `score` sent by the player. Anyone could call the server action with
   `score: 100` and get full XP, complete lessons and climb the leaderboard without answering.

## What changed

| File | Change |
|---|---|
| `src/modules/activities/quiz/player.tsx` | Options are shown in a shuffled order; the original option index is still what gets saved |
| `src/modules/activities/grading.ts` (new) | Pure scoring functions for quiz, sort and sequence |
| `src/modules/activities/grading.test.ts` (new) | Unit tests for the scoring functions |
| `src/modules/activities/{quiz,sort,sequence}/definition.ts` | One line each: `grade: gradeQuiz` / `gradeSort` / `gradeSequence` |
| `src/core/activity-types.ts` | **Shared file:** new optional `grade` field on `ActivityDefinition` |
| `src/modules/courses/actions.ts` | `submitActivityResult` scores graded types on the server |

No new dependencies, no database changes, and no change to how scores turn into XP
(`core/progress/xp.ts` is untouched).

## 1. Shuffled quiz options

`QuizPlayer` builds a display order for each question with the existing `seededShuffle()`
helper, seeded with `"<activityId>:<questionIndex>"`:

- **Stable.** The same question always shows the same order, on the server and in the browser,
  so there is no hydration mismatch and a retry looks the same.
- **Different per question.** Each question gets its own order, so the right answer lands on
  A, B, C or D roughly evenly across a quiz.
- **The letters follow the screen.** "A" is whatever is shown first.

**What is saved does not change.** `picked` and `detail.answers` still hold the **original**
option index (the position in `config.options`), not the on-screen position. Server scoring
relies on this, and so does anything else that reads `activity_attempts.detail.answers` (for
example the Review notebook and class Insights in PR #3). Anyone changing the quiz player later
must keep it that way.

The seed data and `answerIndex` values were left as they are: with shuffling, the stored
position no longer decides where the answer appears.

## 2. Server-side scoring

### The contract

`ActivityDefinition` (in `src/core/activity-types.ts`) gets one optional field:

```ts
grade?: (config: C, detail: unknown) => number | null;
```

Given the validated config and the `detail` the player submitted, it returns the 0-100 score,
or `null` when the detail does not fit the activity. When a type has `grade()`, the browser's
score is ignored.

### Which types are graded

| Type | `detail` the player sends | Server rule |
|---|---|---|
| `quiz` | `{ answers: (number \| null)[] }`, original option index per question | right answers / questions. `null` counts as wrong. Wrong length or an option index that does not exist → rejected |
| `sort` | `{ placed: { [itemIndex]: bucket } }` | items in their correct bucket / items. Unplaced items count as wrong. Unknown item or bucket → rejected |
| `sequence` | `{ order: number[] }`, step index shown at each position | steps in their own position / steps. Not a full permutation → rejected |

The rules are the same ones the players already used to show the result screen, so a learner
who plays normally sees exactly the same score as before. The functions are pure (no database,
no React) and live in `src/modules/activities/grading.ts`.

### The server action

`submitActivityResult` now loads the activity's `type` and `config` with its lesson, then calls
`scoreOnServer()`:

1. Look up the type in the activity registry (`getActivityType`).
2. No `grade()` → use the submitted score, as before.
3. Otherwise validate the stored config with the type's schema and call `grade(config, detail)`.
4. `null` → throw ("These answers do not match the activity"). Nothing is saved, and the
   player shows its usual "Could not save your result" message.

The courses module reaches the activity code through `src/registry/activities.ts`, the same way
the studio already does, so the module boundary rule still holds.

## Not fixed yet

- **Coding, role-play and slides still use the browser's score.**
  - Coding tests run in a Web Worker in the browser. Scoring on the server would mean running
    learner code on the server, which needs a proper sandbox.
  - Role-play is scored by the AI in `/api/activities/roleplay`, but the player sends the score
    afterwards. The fix is to save the feedback on the server and read the score from there.
  - Slides only report how many slides were seen, so there is nothing to check.
- **The answer key is still sent to the browser.** The quiz, sort and sequence players need it to
  show right or wrong immediately, so someone reading the page source can still find the
  answers. What they can no longer do is send a score they did not earn.
- **Seed and AI prompt still put most answers at index 0.** Harmless now that options are
  shuffled, but the AI prompt example in `quiz/definition.ts` could vary `answerIndex` too.
- **After PR #3 is merged:** the Review card and the Insights "most common wrong pick" label
  options by their original letter, while the quiz now shows a shuffled order. The counts are
  right, but the letter a learner remembers may differ. Easiest follow-up: show the option text
  without a letter there, or reuse the same seeded order.

## Testing

- `npm run check` (typecheck, lint, tests). New: `src/modules/activities/grading.test.ts`, which
  covers normal scoring, unanswered questions, and rejected details (wrong length, unknown
  option, unknown bucket, broken permutation, a bare `{ score: 100 }`).
- Manual check in the browser on a freshly reset database, as Mia (learner):
  - *User story check* quiz: the right answers now sit at B, A and C for the three questions,
    and the order is the same after a reload.
  - Answering all three right normally: 100% and +4 XP (the gap between the previous 20 XP and
    the 24 XP for a perfect score), as before the change.
  - Forged requests: the outgoing request was rewritten to `score: 100` while the answers were
    partly wrong. In every case the server kept the real score and gave no XP:

    | Activity | Real result | Sent | Server outcome |
    |---|---|---|---|
    | Quiz (*User story check*) | 1 of 3 (33%) | 100 | No new XP, best stays 67% |
    | Sort (*Functional or non-functional?*) | 4 of 8 (50%) | 100 | No new XP, best stays 88% |
    | Sequence (*Put the CampusEats journey in order*) | 1 of 7 (14%) | 100 | No new XP, best stays 71% |

  - The saved `detail.answers` holds original option indexes (for example the quiz above saved
    `[2, 0, 2]`), so data read by other features keeps its meaning.

## How it was built

Code written with Claude Code following `AGENTS.md` and `docs/standards/`. I checked that no other
branch had touched these files, reviewed the diff, and tested both fixes in the browser before
opening the PR.
