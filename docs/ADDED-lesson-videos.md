# Videos in lessons, and the richer "How Software Gets Built" course

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

Five lessons instead of four, about 100 minutes. English in `scripts/seed/course-basics.ts`,
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

## Getting the new course onto the live site

The seed script skips a database that already has demo data, so **merging this does not change
the course on the live site**. The deployed database keeps the old four lessons until someone
either resets it (demo data starts over) or the team adds a way to update seeded courses in place.
This needs a team decision.

## Testing

- `npm run check` passes: 11 test files, 78 tests (incl. `video-embed.test.ts` and the content
  localisation tests).
- In the browser after `npm run db:reset`: every lesson shows its player and caption at 16:9;
  the new quiz and sort activities score on the server (100% and +24 XP when all right); in
  Chinese every new heading, activity and caption is translated and the videos stay.
