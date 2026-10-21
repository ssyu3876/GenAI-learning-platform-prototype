<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sprout: rules for AI coding agents

Sprout is a GenAI learning platform (Next.js 16 + TypeScript + Tailwind 4 + Drizzle/Postgres).
Three people build it with different agents, so **consistency beats cleverness**. Read these
before writing code, in this order:

1. `docs/standards/CODING_STANDARDS.md` — architecture, module rules, naming, code style, git
2. `docs/standards/DATA_MODEL.md` — tables, fields and event names
3. `docs/standards/UI_GUIDELINES.md` — visual style, components, copy tone
4. `docs/standards/TECH_STACK.md` — pinned versions, env vars, commands

## Hard rules (do not break these)

- **Stay inside your module.** Feature code lives in `src/modules/<module>/`. A module must not
  import another module (ESLint enforces this). Share data through core tables, `recordEvent()`
  and the registries in `src/registry/`.
- **Do not edit `src/core/`, `src/components/ui/`, `src/registry/` or `src/shell/`** unless your
  task is explicitly about them. If you need a core change, stop and describe it.
- **Routes are thin.** `src/app/**/page.tsx` only checks auth, reads params and renders a
  component from a module. No business logic in `src/app/`.
- **No new dependencies** without asking. Use what is in `package.json`.
- **All LLM calls go through `src/core/ai/client.ts`** (`generateText`, `generateJson`,
  `streamText`) with a `feature` name and a `mock` fallback. Never call a provider directly and
  never read `AI_API_KEY` outside that file.
- **Use the UI kit** from `@/components/ui` and Tailwind theme tokens (`bg-coral`, `shadow-sticker`).
  No hard-coded hex colours, no new button/card styles inside modules.
- **Every server action and protected page calls `requireUser()`** (with roles when needed) and
  validates input with zod.
- **Database changes**: add tables in `src/modules/<module>/schema.ts` (or core if shared), then
  `npm run db:generate`. Never edit generated SQL in `drizzle/` by hand.
- **Migrations on a branch**: before opening a PR, merge the latest `main`, delete only the
  migrations this branch generated (SQL + snapshot + journal entries), and run
  `npm run db:generate` again so the new migration has the next number and a newer timestamp.
  See `docs/standards/CODING_STANDARDS.md` §9. Never run SQL against the production database.
- **User-facing text is English**, warm and plain. No "unlock your potential" style copy.
- Before finishing: `npm run typecheck` and `npm run lint` must pass for your files.
