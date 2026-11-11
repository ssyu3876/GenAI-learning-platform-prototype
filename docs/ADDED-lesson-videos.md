# Videos in lessons, narrated diagrams, and the richer "How Software Gets Built" course

Lessons can now show a real video where the author puts it, and the first course uses this
together with new activities and a fifth lesson. No new dependency, table or migration.

## How to add a video to a lesson

Put a YouTube or Bilibili link **on a line of its own** in the lesson's Markdown. The link text
becomes the caption, so use it for the title and the credit:

```markdown
This short animation shows how the pieces fit together in one sprint:

[Video: What Is Scrum in Under 7 Minutes · Joshua Partogi (8 min)](https://youtu.be/9l2o9kISio0)
```

- Recognised: `youtube.com/watch?v=…`, `youtu.be/…`, `youtube.com/embed|shorts|live/…`, and
  `bilibili.com/video/BV…` (with `?p=` for a part). A start time (`?t=90` or `?t=1m30s`) is kept.
- A video link inside a sentence, or a link to any other site, stays a normal link.
- YouTube plays through `youtube-nocookie.com`, without related videos at the end.
- In the Chinese course file, use the same link and translate the caption (say the video is in
  English).
- Works in Studio too: the lesson preview shows the player.

Before adding a video, check that it allows embedding, is short (under about 10 minutes), comes
from a source you can name, and that the lesson still makes sense without it. Credit the
creator and the licence in the caption; never download and re-upload someone's video.

## How it works

| File | Change |
|---|---|
| `src/components/ui/video-embed.ts` (new) | `parseVideoUrl()`: a YouTube / Bilibili link → player URL, or `null` |
| `src/components/ui/video-embed.test.ts` (new) | Link shapes, start times, look-alike hosts and `javascript:` links |
| `src/components/ui/markdown.tsx` | **Shared UI file.** New opt-in `videos` prop: a paragraph that holds only a video link renders a 16:9 player with the link as caption |
| `src/modules/courses/components/lesson-view.tsx` | `<Markdown videos>` for lesson content |
| `src/modules/studio/components/lesson-editor.tsx` | `<Markdown videos>` for the lesson preview |

Embedding is **off by default**. Chat answers from Pip, AI rewrites and coding hints keep
plain links, so a link the AI writes never turns into a player. Raw HTML is still not rendered.

## The "How Software Gets Built" course

Five lessons instead of four, about 115 minutes. English in `scripts/seed/course-basics.ts`,
Chinese in `src/i18n/content/zh/course-basics.ts` (same structure, line for line).

| Lesson | Video | New |
|---|---|---|
| 1 From idea to app | *SDLC Part 1*, K-State Computational Core (10 min, CC BY-NC-SA 4.0) | Quiz *Where do they go next?* (3 scenarios) |
| 2 Requirements | *What Is a User Story in Agile?*, Mountain Goat Software (9 min) | "From vague to testable" table; sort *Testable or too vague?* |
| 3 Your first client | *Requirements Elicitation – What Questions to Ask*, Bridging the Gap (9 min) | Warm-up sort *Open or closed question?* before the role-play |
| 4 Agile | *What Is Scrum in Under 7 Minutes*, Joshua Partogi (8 min) | Scrum roles; sequence *Order a sprint* |
| 5 Testing and release (new) | *Software Testing Explained in 100 Seconds*, Fireship (2 min); *What is Continuous Integration?*, IBM Technology (6 min) | Definition of Done, test levels, CI, safe release; sort *Which test would catch this?*; quiz *Done or not done?*; link to the Sprint Zero scenario |

All videos were checked to exist and to allow embedding. In lesson 4, the line saying our own
board lives in GitHub Projects was changed to a general statement, because our team does not use
GitHub Projects. New quiz answers are spread over A–D.

## Narrated slides: speed control and a playback fix

Applies to every narrated-slides activity in every course (`src/modules/activities/slides/player.tsx`).

- **Faster default pace.** Browser voices read slowly at their default rate, so 1× now means rate
  1.1 in English and 1.2 in Chinese (was 1.02). The pause between slides in autoplay is 250 ms
  (was 500 ms).
- **Speed button** next to *Play narration*: 0.75× / 1× / 1.25× / 1.5×. Changing it mid-sentence
  restarts the current slide at the new speed. The choice is remembered in the browser
  (`localStorage`, with an in-memory fallback). New strings: `activities.slides.speed` in the
  English and Chinese locale files.
- **Fix:** stopping speech (pause, next slide, speed change) made the browser fire a late "ended"
  event for the old narration. That flipped the button back to *Play* and could skip a slide, and
  in Chrome the new narration was sometimes dropped, so *Play* then did nothing. Each narration now
  has a number and events from stopped narrations are ignored; a new narration starts about 60 ms
  after the old one is cancelled.

## Narrated decks with diagrams that follow Pip

Every lesson of "How Software Gets Built" now opens with a short narrated deck (lessons 2–5 are
new; lesson 1 got a diagram). Ten new word-free diagrams live in
`src/modules/activities/slides/visuals.tsx`, next to the three from the People course.

| Lesson | Deck | Diagrams |
|---|---|---|
| 1 | *Pip explains the software loop* (existing) | `software-loop` |
| 2 | *Pip explains user stories* (4 slides) | `user-story`, `vague-to-testable` |
| 3 | *Pip's tips for a first client meeting* (4 slides) | `why-ladder`, `open-closed` |
| 4 | *Pip walks through one sprint* (4 slides) | `sprint-cycle`, `task-board` |
| 5 | *Pip on testing and release* (5 slides) | `done-checklist`, `test-pyramid`, `ci-pipeline`, `safe-release` |

- **The diagram follows the narration.** The player now passes the bullet being read to the
  diagram (`active`). The matching part lights up and the rest fades; the Definition of Done
  ticks its boxes one by one. With nothing playing, the whole diagram is shown.
- **Numbers line up.** Step diagrams number their parts, and on those slides the bullets show
  the same numbers instead of dots (`isNumberedVisual`). The People course diagrams are unchanged.
- **Writing narration for a step diagram:** one sentence per bullet, or one opening sentence
  plus one per bullet. The player spreads sentences over bullets evenly, so either shape keeps
  the highlight on the right part. Avoid a full stop inside a sentence (`Mrs.`, `e.g.`), because
  it ends the sentence early.
- Diagrams use theme tokens only, scale to phone width, and respect reduced motion.

## Mrs. Lau answers what you asked (offline)

Without an AI key (or when the daily AI limit is reached, or the provider fails), a role-play
character used to read its canned replies in order, whatever the learner said: asking "nice to
meet you" could reveal the budget. Role-plays can now carry `mockRules`:

```ts
mockRules: [
  { keywords: ['budget', 'cost', 'how much', '预算', '多少钱'], reply: 'Maybe thirty thousand dollars.' },
],
```

- The first rule whose keywords appear in the learner's latest message answers it, and a reply
  is not repeated (`src/modules/activities/roleplay/mock-reply.ts`, with tests). When nothing
  matches, the character stays vague with the plain `mockReplies`.
- Keywords list both languages and are never translated (`keywords` is an identifier key in
  `src/i18n/content/index.ts`). English keywords match the start of a word ("cost" matches
  "costs", "api" does not match "rapid").
- Mrs. Lau has seven rules: jargon confuses her, a summary gets "yes, that is it", and "why",
  customers, budget, deadline and feature questions each reveal one detail. With an AI key the
  real model is used as before. Other role-plays keep working unchanged (`mockRules` defaults to `[]`).

## Preset sync keeps attempts with the right activity

`syncPresetCourses()` (in `scripts/seed/run.ts`) matched activity rows by position only. Adding
a deck at the start of a lesson would have turned the existing sort row into the deck, and the
quiz row into the sort, so learners' attempts and Review cards would have pointed at the wrong
activity. `matchActivityRows()` now pairs activities by type and title first, then by position
when only the title changed, and updates each row's position. New activities get new rows.

## Getting the new course onto the live site

`scripts/seed/run.ts` now **refreshes the preset courses in place** on every
`npm run db:seed`, even when the demo accounts already exist. Vercel runs that seed as part of
`vercel-build`, so richer preset content reaches the live demo database without a manual
reset. Course, lesson and activity IDs stay stable by position; accounts, history and the
extra demo courses are untouched. See `ADDED-course-agents-deep-dive.md` for details.

`npm run db:reset` remains the clean-slate option for local development.

## Testing

- `npm run check` passes: 21 test files, 134 tests (incl. `video-embed.test.ts`, the agents
  course and student-edition tests, and the content localisation tests).
- In the browser after `npm run db:reset`: every lesson shows its player and caption at 16:9;
  the new quiz and sort activities score on the server (100% and +24 XP when all right); in
  Chinese every new heading, activity and caption is translated and the videos stay.
