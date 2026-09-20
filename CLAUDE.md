# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository holds a **warehouse storage layout tool**: an adjustable floor
plan (8 zones × 8 pallet spaces, plus 4 flow racks of 4 lanes × 3-deep) where
bins can be moved and consolidated as the layout changes through the day.
Every move, consolidation, and task is logged for accountability, and a
weekly archive snapshots accountability + completion reports along with
flagged improvement suggestions (high-churn bins, underutilized/near-capacity
zones, consolidation opportunities, stagnant stock, low task completion).

Note: the repo is named "Paycheck with Purpose" from an earlier, unrelated
placeholder — the actual codebase here is the warehouse layout app described
above, not a budgeting app.

## Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm install` (root, npm workspaces for `server` + `client`) |
| Seed the database | `npm run seed` |
| Start API server | `npm run dev:server` (http://localhost:4000) |
| Start UI dev server | `npm run dev:client` (http://localhost:5173) |
| Run tests | `npm test` (Node's built-in `node:test`, server only) |
| Build client for production | `npm run build --workspace client` |

There is no separate lint step configured yet.

## Architecture

- `server/` — Express + `better-sqlite3` JSON API, no build step.
  - `src/db.js` — schema (`locations`, `items`, `activity_log`, `tasks`, `report_archives`).
  - `src/lib/warehouse.js` — core domain logic: move/consolidate/create items, tasks, activity log. All mutations go through here so accountability logging can't be bypassed.
  - `src/lib/reportGenerator.js` — builds accountability/completion reports for a time window and archives them weekly (`archiveCurrentWeek`).
  - `src/lib/insights.js` — heuristics that flag possible improvements (high churn, zone occupancy, consolidation candidates, stagnant stock, task completion rate).
  - `src/routes/*.js` — thin Express route handlers over the lib functions.
  - `src/seed.js` — idempotently creates the 8×8 zone + 4×4 flow-rack layout and demo data.
- `client/` — React + Vite SPA. `src/App.jsx` wires together the warehouse grid (`WarehouseGrid.jsx` + `Inspector.jsx`), tasks/activity side panels, and the `ReportsPanel.jsx` (live current period + archived weeks).

Data flow: UI calls the REST API (`client/src/api.js`) → route handlers →
`lib/warehouse.js` mutates SQLite and writes an `activity_log` row → UI
re-fetches layout/tasks/activity on every mutation (polled every 15s
otherwise). Reports are computed on read from `activity_log`/`items`/`tasks`
for the current window, and frozen into `report_archives` on manual
"Archive Now" or the weekly cron job in `src/index.js`.

## Key Conventions

- All warehouse mutations (create/move/consolidate/task status) must go
  through `server/src/lib/warehouse.js` so they're logged to `activity_log` —
  never update the `items`/`tasks` tables directly from a route.
- Domain errors use `WarehouseError` (has an HTTP `status`); routes catch it
  and return `{ error }` with that status instead of a generic 500.
- Consolidation always requires matching SKUs and merges source quantity
  into the target bin; sources are marked `status = 'consolidated_out'`
  rather than deleted, so history stays intact.
- Timestamps: SQLite stores UTC via `datetime('now')` with a space separator
  (no `Z`); the client's `toDate()` helper in `src/format.js` normalizes both
  that format and `Date#toISOString()` values before parsing — use it rather
  than `new Date(str)` directly in the UI.
