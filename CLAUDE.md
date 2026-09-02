# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Paycheck with Purpose** is a personal finance / budgeting app built around envelope (zero-based) budgeting: log paychecks as income, allocate that income across "purposes" (budget categories), then log transactions against those purposes and track what's left.

## Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Start dev server | `npm run dev` |
| Lint | `npm run lint` |
| Build for production | `npm run build` |
| Preview production build | `npm run preview` |

There is no test suite yet.

## Architecture

- **Stack:** Vite + React 19 + TypeScript, React Router (client-side routing), Zustand (state + `persist` middleware for `localStorage`), Tailwind CSS v4 (via `@tailwindcss/vite`).
- **No backend.** All data lives client-side in `localStorage` under the key `paycheck-with-purpose`. There is no API layer or server.
- **Data model** (`src/types.ts`): `Paycheck` (income entries), `Category` (a "purpose"/envelope with a name, an allocated amount, and an optional `goal` savings target), `Transaction` (a spend against a `Category`), `ArchivedReport` (a locked-in expense report for one calendar month — see below).
- **Store** (`src/store.ts`): a single Zustand store (`useBudgetStore`) holding `paychecks`, `categories`, `transactions`, `archivedReports` plus CRUD actions. Derived totals (`selectTotalIncome`, `selectTotalAllocated`, `selectTotalSpent`) are plain selector functions safe to pass directly to `useBudgetStore`.
  - `computeSpentByCategory` is **not** a store selector — it builds a `Map` and must be called from a component wrapped in `useMemo` (keyed on the `transactions` and `categories` arrays). Passing it directly to `useBudgetStore` returns a new object reference every render and breaks `useSyncExternalStore`'s snapshot caching, causing an infinite render loop (this happened once during scaffolding — see `Dashboard.tsx` / `Purposes.tsx` for the correct pattern). It takes `categories` so it can scope spending to the current calendar month for any category with `resetsMonthly` set — everything else accumulates all-time.
- **Pages** (`src/pages/`): `Dashboard` (zero-based budgeting summary + per-purpose progress bars), `Paychecks`, `Purposes` (create/manage envelopes), `Transactions` (log spend against a purpose), `Reports` (archive a month's spending for `resetsMonthly` purposes into a client-reviewable expense report; see below).
- **Routing/layout**: `src/App.tsx` defines routes, `src/components/Layout.tsx` renders the header/nav shared across pages.
- **UI primitives**: `src/components/ui.tsx` (`Card`, `Stat`, `Input`, `Button`, `IconButton`, `EmptyState`) — reuse these rather than reimplementing styled inputs/buttons.
- **Formatting helpers**: `src/lib/format.ts` (`formatCurrency`, `formatDate`, `todayIso`).

## Key Conventions

- Money amounts are plain `number`s (dollars, not cents). Format for display with `formatCurrency`.
- Dates are stored as ISO date strings (`YYYY-MM-DD`); format for display with `formatDate`.
- New Zustand selectors that need to derive a new object/array/Map should follow the `computeSpentByCategory` pattern (plain function + `useMemo` in the component) rather than being passed directly as a store selector, to avoid the snapshot-caching infinite-loop trap above.
- Styling is Tailwind utility classes; the custom `purpose-*` color scale is defined in `src/index.css` via `@theme`.
- A `Category.goal` is an optional savings target (e.g. "Emergency fund: save up to $2,000"), separate from `allocated` (the per-envelope funding amount). Its progress tracker on the Purposes page always uses `computeAllTimeSpentByCategory` (never `computeSpentByCategory`) to derive the envelope's running balance (`allocated - all-time spent`) as "amount saved so far" — deliberately independent of `resetsMonthly`, so a monthly reset never resets goal progress, only the Spent/Remaining columns.
- A `Category.resetsMonthly` flag opts a purpose into month-scoped spending: `computeSpentByCategory` only counts that category's transactions dated in the current calendar month, so `allocated` dollars become available again each month automatically — no manual reset action exists or is needed. Toggle it via the "Monthly" pill in the Purposes table (`Purposes.tsx`). Unset (the default) keeps the classic envelope-carryover behavior where spending accumulates all-time. This scoping is intentionally local to the Spent/Remaining columns — see the `Category.goal` note above for why goal progress is computed separately.
- Transactions are never deleted when a month rolls over — `resetsMonthly` only changes what's *displayed* (via the date filtering above), so a purpose's full history always remains in `transactions`. `useBudgetStore().archiveMonth(period)` (Reports.tsx) generates an `ArchivedReport` for a "YYYY-MM" period by filtering that same `transactions` array, one report per `resetsMonthly` category, and snapshotting each category's name/allocated amount plus its transactions for that month so the report stays accurate even if the category is later renamed, re-budgeted, or deleted. Archiving the same period again replaces (upserts by `period`) rather than duplicates.
