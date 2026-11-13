# Self-learn course generator — staged plan and progress log

Status: **MVP implemented locally, awaiting review/deploy**
Owner: student learning-content module
Last updated: 2026-11-13

## Implementation status

- Stage 0: DeepSeek key verified against `deepseek-flash` + `reasoning_effort=max`.
- Stage 1: preferences form + framework generation + framework review page.
- Stage 2: full course is generated **one lesson at a time** from an approved framework; each
  lesson is a separate server action so it stays under the serverless timeout, with live
  progress and retry.
- Stage 3: post-course feedback, framework feedback, and per-lesson regeneration are wired.
- Stage 4: external video discovery remains future work; MVP uses narrated slides + diagrams.

## Decisions / constraints

- The app already has a DeepSeek key in Vercel; local development needs the same key in
  `.env.local` (gitignored). No APK is involved: this is a web app.
- Quality first: the current 4-lesson, seconds-long result is largely the offline mock plus
  tight generation limits. Real generation must be verified with `ai_usage.mocked = false`.
- **Framework first**: show an editable course outline before generating full lessons. Only
  generate the course after the learner approves the framework.
- **Two feedback gates**: after the framework and after the full course. Iterate from feedback
  rather than regenerating from scratch.
- **Video**: AI cannot generate real video. MVP uses narrated slides + diagrams. External
  YouTube/Bilibili videos are Phase 2 and must be curated/approved, never scraped blindly.
- Development order: **MVP first**, then enhancements.

## Stage 0 — Environment and baseline (MVP, first)

**Do**
- Add DeepSeek key to local `.env.local`:
  `AI_API_KEY=...`, `AI_BASE_URL=https://api.deepseek.com`, `AI_MODEL_SMART=deepseek-chat`.
- Restart dev server; generate one course; confirm `ai_usage.mocked = false` and latency/content
  are from the provider, not `mockDraft`.
- Record baseline: current lesson count, words per lesson, activities per lesson.

**Acceptance**
- One real generated course appears with provider output, not the 4-lesson mock template.

## Stage 1 — Learning brief + framework preview (MVP core)

**Form fields**
- Existing: topic, why, level.
- New: time budget (30 min / 1 h / 2 h / 4 h), explanation style, content format, assessment
  preference.
- Time mapping: 30 min → 3 lessons; 1 h → 4–5; 2 h → 6–7; 4 h → 8–10 (cap for MVP: 8).

**Framework output**
- Title, one-line promise, learning outcomes, lesson list with objective/time/activity plan,
  assessment plan, visual/video plan.
- UI: immediate skeleton/progress; editable outline; buttons for **Approve**, **Adjust**,
  **Regenerate**; feedback captured before full generation.

**Acceptance**
- Submitting the form shows a framework in a few seconds without generating full lessons.
- Learner can change lesson count/emphasis and regenerate the framework.
- No full course is saved until the framework is approved.

## Stage 2 — Full course generation (MVP core)

**Generate**
- Per-lesson Markdown (400–700 words): objective, explanation, concrete example, common
  mistake, practice prompt.
- 2–3 activities per lesson, chosen from the learner's format/assessment preferences.
- Narrated slides (with diagrams) when "slides/visual" is chosen; quiz/sort/sequence/coding/
  roleplay as appropriate.
- Course summary, tags, estimated time consistent with the chosen time budget.

**Quality gate**
- Validate lesson count, words, activities, and estimated minutes; retry once with an "expand"
  instruction if too thin.
- Drop invalid activity configs via the existing sanitizer; never save a lesson with no activity
  unless the learner chose reading-only.

**Acceptance**
- A 1-hour course has 4–5 substantial lessons; a 4-hour course has 8 lessons.
- Every lesson has at least one concrete example and two practice activities.
- Generated time is close to the requested budget.

## Stage 3 — Feedback and iteration (MVP core)

- After full generation: difficulty (too easy/right/too hard), usefulness 1–5, missing-content
  comment.
- Allow **regenerate this lesson** or **adjust framework** without regenerating the whole course.
- Store feedback and generated versions so progress can be reviewed later.
- Use feedback to adjust the next prompt; do not silently overwrite approved content.

**Acceptance**
- Two feedback records exist per generated course (framework + full course).
- A learner can regenerate one lesson and keep the rest.
- Feedback is visible in the database/admin for later analysis.

## Stage 4 — Enhancements (after MVP)

- External video candidates: search/curate YouTube (and Bilibili only if reliable), validate
  embeddability, show candidates for approval, fallback to narrated slides. No downloading or
  re-uploading; credit the creator.
- Per-section "explain differently" and richer visual diagrams.
- A small curated video bank for common topics, used before any runtime search.
- Analytics: generation time, retries, completion, feedback trends.

## Suggested implementation order

| Order | Work | Output | Status |
|---|---|---|---|
| 1 | Local AI key + real generation baseline | Provider output, `mocked=false` | pending |
| 2 | Preferences schema + form | 4 new fields, validation | pending |
| 3 | Framework prompt/schema + preview UI | Editable outline, approve/regenerate | pending |
| 4 | Full-course prompt + quality checks | Rich lessons/activities | pending |
| 5 | Two feedback gates + per-lesson regenerate | Feedback rows, iteration | pending |
| 6 | External video discovery (Phase 2) | Approved video candidates | later |

## Data / API notes

- Persist a generation session: request fields, preferences, outline JSON, status, version, and
  feedback. A `course_generation_sessions` table or equivalent is preferred; do not cram
  preferences into free-text tags.
- Outline schema should be a small zod object so it can be validated and edited safely.
- Full course generation should reuse the existing `saveCourseDraft`/activity schemas.
- Keep the DeepSeek key server-side only; never expose it to the client or commit `.env.local`.

## Progress log

| Date | Stage | What changed | Verification |
|---|---|---|---|
| 2026-11-13 | Plan | Proposal written; awaiting confirmation | — |
| 2026-11-13 | Stage 0 | `deepseek-flash` + max effort verified with a live API call | returned `OK`, model `deepseek-flash` |
| 2026-11-13 | Stage 1 | Preferences form + outline generation/review/regenerate | browser: 3-lesson outline in ~20s |
| 2026-11-13 | Stage 2 | Per-lesson generation page with progress | browser: 3 lessons generated, each ~30–55s |
| 2026-11-13 | Stage 3 | Course feedback + per-lesson regeneration | feedback saved; one lesson rewritten |
| 2026-11-13 | Checks | `npm run check` and `npm run build` | 168 tests, build passes |
