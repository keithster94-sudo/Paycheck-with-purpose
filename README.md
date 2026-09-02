# Paycheck with Purpose

A personal budgeting app built around envelope (zero-based) budgeting: log paychecks as income, allocate that income across "purposes" (budget categories), then log transactions against those purposes and see what's left.

## Stack

- [Vite](https://vite.dev) + React 19 + TypeScript
- [React Router](https://reactrouter.com) for client-side routing
- [Zustand](https://zustand.docs.pmnd.rs) for state, persisted to `localStorage`
- [Tailwind CSS](https://tailwindcss.com) v4

All data lives in the browser (`localStorage`) — there is no backend or account system yet.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Other commands

| Task | Command |
|------|---------|
| Lint | `npm run lint` |
| Build for production | `npm run build` |
| Preview production build | `npm run preview` |

See `CLAUDE.md` for a deeper architecture overview.
