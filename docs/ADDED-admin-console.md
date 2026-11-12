# Admin console: scenario and badge views, taking things offline, and an audit log

The console had five pages: an overview, users and roles, the course review queue, AI usage,
and a modules page that only listed what the build shipped. Two things an admin actually
needs — what the scenarios are doing and which badges anybody holds — had no page at all, and
published courses could not be taken down.

## What is new

| Page | What it does |
|---|---|
| `/admin/scenarios` | Runs, learners, finishes, average best score and last played per scenario. Scenarios with no runs are listed too, because that is usually the answer |
| `/admin/badges` | How many learners hold each badge, plus the two signals worth acting on: badges nobody has and badges everybody has |
| `/admin/activity` | Role changes, course decisions and scenario toggles, newest first |

- **Courses can go offline.** A published course can be archived and an archived one restored.
  Restoring returns it to `draft`, not `published`, so a course taken down on purpose cannot
  reappear without somebody looking at it again. Enrollments and progress are untouched; only
  the catalog entry goes away.
- **Scenarios can be closed.** A closed scenario stays in the catalogue with a "Closed" badge,
  learners get a notice instead of the runner, and admins can still open it to check the
  content. The seven interview formats answer to one switch.
- **Every admin action is logged** to `admin_audit` through `recordAudit()` in `src/core/audit.ts`.

## Why scenarios and badges cannot be edited

Scenario content is TypeScript source (`src/modules/scenarios/content/*.ts`) compiled into the
bundle, and a badge is a predicate over a snapshot of the learner's numbers — nothing about
either is stored. Letting an admin edit them would mean turning both into tables with an editor
and a validator, and it would break the reason badges can never drift from the event log.

So the console is read-only for both, with one exception: closing a scenario writes a single
row to `scenario_settings`. That table has **no row per scenario** on purpose — a scenario is
open unless a row says otherwise, so a fresh database is empty and adding a scenario never
needs a matching insert.

## Where the panels live

A module may not import another module. The two panels therefore live in the modules that own
the data — `src/modules/scenarios/admin/` and `src/modules/achievements/admin/` — and the
routes compose the admin header and navigation around them.

`/admin/modules` was a page of read-only cards an admin could not act on. It moved to the
bottom of the overview and lost its navigation slot.

## Agent Dungeon reporting

The dungeon runs entirely in the browser, so nothing reached the database and its badges could
never be earned. A won run now calls `recordDungeonRun()` once: the score is recomputed on the
server from the reported stats rather than trusted from the client, and a `scenario_runs` row
is written so the console can see it. XP stays at 0 because the dungeon never awarded XP.

`scenario.completed` is now recorded on **every** finish, not only on a new best, so run counts
are real. XP still only moves when the score improves.

## Tests

`npm run check` passes: 153 tests. The new ones cover the scenario row merge, the interview
group key rule, the badge snapshot totals, and the interview switch semantics.

`mergeScenarioRows`, `scenarioCheckKeys` and `scenarioTotals` are exported pure functions, so
those rules are tested without a database.
