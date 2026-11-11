# The richer "Working with AI Coding Agents" course

The middle preset course is now a structured, book-like course for busy professionals who want
to move from using AI autocomplete to directing coding agents at work. It has **9 lessons and
24 activities**, about 3.5 hours end to end, with a **90-minute fast path** for people who only
have a lunch break at a time.

English lives in `scripts/seed/course-agents.ts`; Chinese lives in
`src/i18n/content/zh/course-agents.ts` with the same structure. The content dictionary pairs
the two files position by position, so the course is fully bilingual.

## Structure

| Part | Lesson | Core idea | Practice | Videos |
|---|---|---|---|---|
| I — Foundations | 1 The shift | Value moves from typing to specifying and verifying | Quiz, sort | AI Fluency 3B (5 min); optional Karpathy talk (40 min) |
| I — Foundations | 2 What a coding agent actually does | Model + tools + context + loop + guardrails | Narrated slides, sequence, quiz | Building more effective AI agents (19 min) |
| II — The working loop | 3 Delegation | Delegate well-defined, checkable, low-risk work | Sort (3 buckets), quiz | AI Fluency 4D (5 min), Delegation (6 min) |
| II — The working loop | 4 Description | C-G-C-E-D brief, plan before diff | Quiz, sequence, slides | Description (4 min); optional Prompting for Agents (29 min) |
| II — The working loop | 5 The loop in practice | A worked 45-minute slice with evidence | Sequence, quiz | Claude Code best practices (26 min) |
| II — The working loop | 6 Discernment | Review scope, correctness, safety, evidence | Sort, coding challenge, quiz | Discernment (5 min), Testing in 100 Seconds (2 min) |
| III — Ship safely | 7 Diligence | Evidence ladder, test-first, ownership | Sequence, quiz, slides | Diligence (7 min), Continuous Integration (6 min) |
| III — Ship safely | 8 Working safely | Permissions, secrets, prompt injection | Sort, quiz, sequence | Prompt injection testing (9 min) |
| III — Ship safely | 9 Team workflow and 30-day plan | Team habits, capstone, career plan | Role-play, quiz, slides | Tips for building AI agents (18 min) |

Every lesson has a "core" explanation, an "At work this week" exercise, common traps and key
takeaways. Every lesson embeds at least one video as a real player: put a YouTube or Bilibili
link on its own line in the Markdown, as described in `ADDED-lesson-videos.md`.

## Activities used

The studio exposes the full activity registry: quiz, sorting game, put in order, narrated
slides, coding exercise and AI role-play, plus the Release simulation from the scenarios
module. This course uses the six core types:

- **Quiz** — check understanding after each concept block.
- **Sorting game** — classify tasks, review comments, safe/risky habits.
- **Put in order** — the agent loop, the brief-to-merge workflow, evidence-first work,
  incident response.
- **Narrated slides** — visual summaries with optional named diagrams.
- **Coding** — one realistic review exercise: the agent's `applyDiscount` implementation has
  three bugs (boundary, case-sensitivity, rounding) for the learner to find and fix.
- **AI role-play** — the capstone conversation: push back on a teammate who wants to merge a
  700-line agent diff because "the tests are green".

## Keeping the live database in sync

`scripts/seed/run.ts` now refreshes the three preset courses **in place** on every
`npm run db:seed`, even when the demo accounts already exist. It:

- updates the course row (`title`, `summary`, subject, level, audience, tags, minutes);
- matches lessons by position and keeps their IDs, so enrolments, class assignments and
  existing progress keep pointing at the same rows;
- matches activities by position and keeps their IDs, then deletes any extra old activities;
- leaves user accounts, history and the three extra demo courses untouched.

Vercel runs `vercel-build` (`db:migrate && db:seed && next build`), so a deploy now ships
richer seeded course content to the live demo database without a manual reset. Locally,
`npm run db:seed` updates the existing database; `npm run db:reset` still rebuilds it from
scratch.

> This also means the seeded courses are treated as canonical: editing a preset course in the
> Studio will be overwritten by the next seed. That is intentional for demo content; use a
> copied/forked course for real edits.

## Testing

- `npm run check` passes, including `src/i18n/content/agents-course.test.ts`, which checks the
  lesson/activity shape, video embed URLs, quiz answer indexes, sort bucket membership and
  coding tests across both languages.
- Manual check: open `/courses/working-with-ai-coding-agents` in English and Chinese; every
  lesson shows its video player and caption, all activities render, and the code review
  exercise scores on the server.
