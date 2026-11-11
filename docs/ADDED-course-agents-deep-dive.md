# The richer "Working with AI Coding Agents" course

The middle preset course now has **two editions** built from one core:

- **Professional edition** — 9 lessons and 24 activities, about 3.5 hours end to end, with a
  **90-minute fast path** for people who only have a lunch break at a time.
- **Student edition** — the same 9 core lessons plus **9 project labs**, 18 lessons and 42
  activities, about **30 hours**. It is project-based: every lab has a deliverable, evidence
  and a self-check, not just another video.

English lives in `scripts/seed/course-agents.ts` (professional) and
`scripts/seed/course-agents-student.ts` (student, composing the core plus labs). Chinese lives
in `src/i18n/content/zh/course-agents.ts` and `src/i18n/content/zh/course-agents-student.ts`
with the same structures. The content dictionary pairs each pair position by position, so both
editions are fully bilingual.

## How onboarding chooses an edition

The questionnaire is unchanged. Its four identity options map to two editions:

| Onboarding identity | Course edition |
|---|---|
| Computer science, still studying (`cs_student`) | Student edition |
| Another subject, e.g. business/design/arts/science (`non_cs`) | Student edition |
| Computer science, graduated and job-seeking (`cs_graduate`) | Professional edition |
| Working, changing career, or curious (`other`) | Professional edition |

`recommendCourses()` filters out the edition that does not match the learner's identity, so the
path never contains both. The other two preset courses remain available to everyone and are not
duplicated.

## Professional edition structure

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

## Student edition labs

| Lab | Deliverable | Main activity |
|---|---|---|
| 1 Agent readiness audit | `AGENTS.md` + baseline and permission report | Quiz, sequence |
| 2 Brief and acceptance tests | C-G-C-E-D brief + failing tests before implementation | Quiz, sort |
| 3 Plan-mode experiment | Three plans compared + decision memo | Sequence, quiz |
| 4 Build one vertical slice | PR under ~300 lines with evidence and rollback | Sequence, quiz |
| 5 Review a buggy agent PR | Severity-ranked review + reproduced bug + fix | Sort, quiz |
| 6 Test-first repair and CI | Failing regression test → fix → CI gate + incident note | Sequence, quiz |
| 7 Security and prompt-injection drill | Permission audit + malicious-input exercise + incident checklist | Sort, quiz |
| 8 Team review simulation | Review conversation + team convention + PR template | Role-play, quiz |
| 9 Capstone and portfolio | Shipped feature + one-page case study + five-minute demo | Quiz, slides |

The labs add 1,600 minutes to the 204-minute core, for 1,804 minutes (about 30 hours) in total.

Every professional lesson has a "core" explanation, an "At work this week" exercise, common
traps and key takeaways. Every lesson embeds at least one video as a real player: put a YouTube
or Bilibili link on its own line in the Markdown, as described in `ADDED-lesson-videos.md`.

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

`scripts/seed/run.ts` now refreshes the preset courses **in place** on every
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

- `npm run check` passes, including `src/i18n/content/agents-course.test.ts` and
  `src/i18n/content/agents-student.test.ts`, which check lesson/activity shape, video embed
  URLs, quiz answer indexes, sort bucket membership, coding tests and the 30-hour total across
  both languages.
- Manual check: open both `/courses/working-with-ai-coding-agents` (professional) and
  `/courses/working-with-ai-coding-agents-student` in English and Chinese; every lesson shows
  its video player and caption, all activities render, and the code review exercise scores on
  the server.
- Onboarding check: choose each of the four identities; the path contains only the matching AI
  agents edition (student for the first two, professional for the last two).
