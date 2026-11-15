# GenAI Learning Platform — Sprout

> **Course project for Software Engineering, October 2026**
>
> A platform for creating, sharing and taking mini-courses on any topic, with AI-assisted course
> generation, adaptive explanations, and live tutoring.

## What it does

Sprout helps learners discover and master new topics through short, interactive courses. Instructors
can create courses from scratch or have AI generate them from a topic, then publish to their class
or the public catalog. Learners get a personalized path from onboarding, adaptive lesson
explanations ("Explain it my way"), and an AI tutor (Pip) available any time.

**Key features:**

- **Self-paced mini-courses** with Markdown lessons and 6 types of interactive activities (quiz,
  sort, sequencing, coding, AI-narrated slides, role-play).
- **AI course generation**: instructors enter a topic, target learners and learning goals; the AI
  writes a draft course with lessons and activities in ~30 seconds.
- **Personalized onboarding**: learners answer 5 questions and get a track (Explorer / Builder),
  recommended courses, and a welcome note from Pip.
- **"Explain it my way"**: any lesson can be re-explained in the learner's style (Explorer:
  step-by-step with analogies; Builder: concise with code).
- **Pip, the AI tutor**: a floating assistant that answers questions with the current lesson as context.
- **XP, levels and leaderboards**: activity completions earn XP; learners level up from Seed to
  Forest and see their rank (opt-in, with nickname option).
- **Classes and engagement tracking**: instructors import students from CSV, assign courses, and see
  participation and XP trends over time.
- **Admin console**: manage users, approve courses for the public catalog, monitor AI usage.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router + Turbopack, React 19 Server Components |
| Language | TypeScript strict |
| Styling | Tailwind CSS v4, custom sticker-book theme (no component library) |
| Database (local) | PGlite (embedded Postgres, no install) |
| Database (production) | Neon serverless Postgres via Vercel Storage |
| ORM | Drizzle |
| Auth | Email + password, JWT session cookie (jose, bcryptjs) |
| AI | Any OpenAI-compatible API (default: DeepSeek), with built-in mock when no key |
| Hosting | Vercel (push to GitHub → deployed) |

Full stack and version pins: [docs/standards/TECH_STACK.md](docs/standards/TECH_STACK.md)

## Project structure

```
src/
├── app/                     Next.js routes (thin, delegate to modules)
├── core/                    Shared foundation (DB, auth, AI, XP, events)
├── components/ui/           Shared UI kit (Button, Card, Pip, Avatar...)
├── registry/                Module and activity type registries
├── shell/                   App frame (sidebar, top bar)
└── modules/<name>/          Feature modules, one folder each
    ├── manifest.ts          Nav items, home widgets, shell add-ons
    ├── schema.ts            Tables owned by this module
    ├── queries.ts           Read functions
    ├── actions.ts           'use server' mutations
    ├── components/          React components
    └── pages/               Full-page components
```

**Modules never import each other.** They share data through core tables and the `learning_events`
log. This keeps every feature self-contained and portable to other prototypes.

Architecture and module rules: [docs/standards/CODING_STANDARDS.md](docs/standards/CODING_STANDARDS.md)

## Quick start (local development)

**Requirements:** Node.js ≥ 22.12 (we use Node 24)

```bash
git clone <your-repo>
cd <repo-folder>
npm install
npm run setup     # Creates local DB tables and inserts demo data
npm run dev       # → http://localhost:3000
```

**Demo accounts** (use the buttons on the login page):

| Role | Email | What you can see |
|---|---|---|
| **Learner** | `alex@demo.test` | Catalog, assigned courses, personal XP and leaderboard |
| **New learner** | `jordan@demo.test` | Fresh account, starts at onboarding |
| **Instructor** | `sam@demo.test` | Course studio, class management, engagement dashboard |
| **Admin** | `admin@demo.test` | Everything + user management, course review queue, AI usage stats |

Password for all: `demo1234`

The demo database has 3 main courses (_GenAI for everyone_, _Intro to Python_, _Agile practices_),
3 shorter courses, 1 class (invite code `SPROUT`), and 16 simulated learners with 3 weeks of activity.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run check` | Type-check + lint + unit tests (run before every PR) |
| `npm run setup` | Create local DB + demo data (first time only) |
| `npm run db:reset` | Delete local DB and rebuild it with demo data |
| `npm run db:generate` | After editing a `schema.ts`: generate a new SQL migration |
| `npm run db:migrate` | Apply migrations |

PGlite allows **one process** at a time: stop `npm run dev` before running database commands.

## Environment variables

Copy `.env.example` to `.env.local`. The app works with no `.env.local` (uses PGlite + mocked AI).

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Production only | Set automatically by Vercel when you add Neon storage |
| `AUTH_SECRET` | Production | Long random string for signing session cookies |
| `AI_API_KEY` | No | Leave empty for mock AI. Add a DeepSeek key for real responses |
| `AI_BASE_URL` | No | Default `https://api.deepseek.com` |
| `AI_MODEL_FAST` / `AI_MODEL_SMART` | No | Model names for cheap vs. high-quality calls |
| `YOUTUBE_API_KEY` | No | Enables real YouTube video results in AI-tutor recommendations. Without it, the tutor shows a search link and curated links only |
| `NEXT_PUBLIC_APP_URL` | No | Public origin used in shared-course links. Usually inferred from the request host on Vercel |
| `CRON_SECRET` | Recommended | Protects `/api/cron/assignment-reminders`; Vercel sends `Authorization: Bearer <value>` |

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Import Project** and connect the repo.
3. **Storage → Create → Neon (Postgres)**, then connect it. This sets `DATABASE_URL`.
4. **Settings → Environment Variables**: add `AUTH_SECRET` (long random string), `AI_API_KEY`
   if you have one, and optionally `YOUTUBE_API_KEY`. Add `CRON_SECRET` to secure scheduled
   assignment reminders.
5. Build command is already set to `npm run vercel-build` (migrates, seeds if empty, then builds).
6. Deploy. The demo accounts work in production too.

## Documentation

- **For the team**: [docs/standards/](docs/standards/) — tech stack, architecture, data model,
  coding rules, UI guidelines (English + Chinese).
- **For AI agents**: `AGENTS.md` at the root points agents to the standards and describes the
  module system.
- **Process evidence**: `DEVLOG.md` records key decisions and how we worked with AI agents.

## Testing

- **Unit tests** (Vitest): 6 test files, 45 tests covering XP rules, scoring, ordering, CSV
  parsing, audience matching. Run with `npm run check`.
- **Manual testing**: click through every feature as learner, instructor and admin with the demo
  accounts. The smoke test script (`scripts/smoke.ts`) automates this for 37 routes.

## Built with AI agents

This prototype was built over October 2026 by three team members using AI coding agents (Claude
Code, primarily). The AI wrote most of the application code; we designed the architecture, module
boundaries, standards documents, and reviewed every file. `DEVLOG.md` describes what the AI did
well, where we had to step in, and what we learned about multi-agent collaboration.

## License

Course project, not licensed for reuse.
