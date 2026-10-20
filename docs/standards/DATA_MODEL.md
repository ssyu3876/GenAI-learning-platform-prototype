# Data Model

> Chinese version: [DATA_MODEL.zh-CN.md](DATA_MODEL.zh-CN.md). Source of truth:
> `src/core/db/schema.ts` (core) and `src/modules/*/schema.ts` (module tables).
> Field names below are the TypeScript names; the SQL columns are the snake_case versions.

## 1. Conventions

- Primary keys: prefixed text ids from `newId()`: `usr_`, `crs_`, `lsn_`, `act_`, `att_`, `evt_`, `cls_`, `aiu_`.
- Every table has `createdAt`; mutable tables also have `updatedAt` (set it in every update).
- Enums are stored as `text` with a TypeScript union type (easier to extend than Postgres enums).
- Flexible, type-specific data goes in `jsonb` and is validated with zod at the edges
  (`activities.config`, `activity_attempts.detail`, `learning_events.payload`).
- Deleting a parent cascades to children (course → lessons → activities → attempts).

## 2. Core tables

| Table | Purpose | Key fields |
|---|---|---|
| `users` | Accounts | `id`, `email` (unique, lowercase), `name`, `role` (`learner`/`instructor`/`admin`), `avatarSeed`, `lastActiveAt` |
| `learner_profiles` | Onboarding answers + personal path | `userId` (PK), `background` (`non_cs`/`cs_student`/`cs_graduate`/`other`), `goal` (`understand`/`career`/`build`/`ai_skills`), `codingLevel` 0-3, `interests[]`, `track` (`explorer`/`builder`), `recommendedCourseIds[]`, `welcomeNote` |
| `courses` | A mini-course | `slug` (unique), `title`, `summary`, `subject` (any domain), `level`, `audience` (`everyone`/`non_cs`/`cs`), `tags[]`, `color`, `emoji`, `status` (`draft`/`pending_review`/`published`/`archived`), `visibility` (`public`/`class`/`private`), `source` (`seed`/`manual`/`ai`/`learner_ai`), `ownerId`, `forkedFromId` |
| `lessons` | Ordered pages of a course | `courseId`, `position` (0-based), `title`, `content` (Markdown), `estimatedMinutes` |
| `activities` | Interactive tasks in a lesson | `lessonId`, `position`, `type` (see §4), `title`, `config` (jsonb), `xpReward` |
| `enrollments` | Learner ↔ course | PK (`userId`, `courseId`), `enrolledAt`, `completedAt` |
| `activity_attempts` | Best result per learner per activity | unique (`userId`, `activityId`), `courseId`, `bestScore` 0-100, `attemptCount`, `xpEarned`, `detail` |
| `lesson_completions` | Lessons finished | PK (`userId`, `lessonId`), `courseId` |
| `learning_events` | **Append-only log**, source of XP and analytics | `userId`, `type`, `courseId?`, `lessonId?`, `activityId?`, `xp`, `payload`, `createdAt` |
| `classes` | Instructor's class | `name`, `instructorId`, `inviteCode` (6 chars, unique) |
| `class_members` | Learner ↔ class | PK (`classId`, `userId`) |
| `class_courses` | Courses assigned to a class | PK (`classId`, `courseId`) |
| `ai_usage` | One row per AI call | `userId?`, `feature`, `model`, `mocked`, `promptTokens`, `completionTokens`, `latencyMs` |

Who can see a course (`src/core/content/queries.ts`): published + public → everyone;
assigned to one of your classes → class members; `ownerId` = you → you; admins → all.

## 3. Learning events

XP is **never stored on the user**. Total XP = `sum(learning_events.xp)`. Weekly XP = the same
sum over the last 7 days. This keeps leaderboards, streaks and dashboards consistent.

| `type` | Written by | `xp` | `payload` |
|---|---|---|---|
| `activity.completed` | `completeActivity()` | only the improvement over the previous best | `{ score, attempt }` |
| `lesson.completed` | `completeLesson()` | 10 | — |
| `course.completed` | `completeLesson()` (last lesson) | 50 | — |
| `course.enrolled` | `enrollInCourse()` | 0 | — |
| `course.generated` | self-learn | 0 | `{ courseId }` |
| `onboarding.completed` | onboarding | 0 | `{ track }` |
| `tutor.asked` | ai-tutor | 0 | `{ lessonId? }` |
| `class.joined` | classes | 0 | `{ classId }` |
| `scenario.completed` | scenarios | the run score 0-100 | `{ scenarioKey, score }` |

XP rules (`src/core/progress/xp.ts`): score ≥ 60 earns the activity's `xpReward`, 100 earns
120%, below 60 earns a proportional share. Levels: Seed 0, Sprout 100, Seedling 250, Sapling
500, Young Tree 900, Tree 1400, Grove 2100, Forest 3000. A streak counts consecutive UTC days
with any event.

Add new event types to `EVENT_TYPES` in `src/core/events.ts` and to this table.

## 4. Activity types (`activities.type` + `activities.config`)

Each type is an `ActivityDefinition` (`src/core/activity-types.ts`) with a zod `schema` for its
`config`. Built-in types (`src/modules/activities/`):

| `type` | What the learner does | Config (short) |
|---|---|---|
| `quiz` | Multiple choice with explanations | `{ questions: [{ prompt, options[], answerIndex, explanation }] }` |
| `sort` | Put cards into the right bucket | `{ instructions, buckets[], items: [{ text, bucket }] }` |
| `sequence` | Put steps in the right order | `{ instructions, steps[] }` (stored in correct order, shown shuffled) |
| `coding` | Write a JS function, run tests in the browser | `{ instructions, starterCode, functionName, tests: [{ args[], expected, label? }] }` |
| `slides` | AI-narrated slide deck (text-to-speech) | `{ slides: [{ heading, bullets[], narration }] }` |
| `roleplay` | Chat with an AI character, then get scored | `{ scenario, persona, personaRole, goals[], opening, rubric[], maxTurns }` |

## 5. Module-owned tables

| Table | Module | Purpose |
|---|---|---|
| `leaderboard_prefs` | leaderboard | Per-user display choice: real name or nickname, opt out |
| `leaderboard_class_settings` | leaderboard | Instructor switch: show the class board or not |
| `lesson_adaptations` | courses | Cached "explain it my way" rewrites per lesson × learner track |
| `scenario_runs` | scenarios | One row per learner per scenario key: `state` jsonb (steps, stats, history), `bestScore`, `completions` |

Achievements (`src/modules/achievements/`) owns **no tables**. A badge is a predicate over a
snapshot built from `learning_events`, `activity_attempts`, `lesson_completions` and
`enrollments`, so it can never disagree with the XP totals. Scenario results are read back
from `learning_events` (`scenario.completed`), which is why the achievements module never
imports the scenarios module.

When you add a table, add a row here in the same PR.
