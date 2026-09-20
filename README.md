# Warehouse Storage Layout

An adjustable warehouse storage layout tool: 8 zones of 8 pallet spaces each,
plus 4 flow racks (4 lanes each, 3-deep), where bins can be moved and
consolidated as the floor plan changes throughout the day. It tracks every
move/consolidation/task for accountability and completion reporting, and
archives a snapshot each week with flagged improvement suggestions.

## Stack

- **Server**: Node.js + Express + SQLite (`better-sqlite3`), no build step.
- **Client**: React + Vite SPA that talks to the server's JSON API.

## Setup

```bash
npm install        # installs both workspaces (server, client)
npm run seed        # creates the SQLite DB, seeds the 8-zone/4-rack layout + demo data
```

## Running

```bash
npm run dev:server   # http://localhost:4000 (JSON API)
npm run dev:client   # http://localhost:5173 (UI, proxies /api to the server)
```

Open http://localhost:5173. Click any pallet space or flow rack lane to:
- **Add a bin** (SKU, quantity, lot) if the slot has room.
- **Move** an existing bin to any other slot with free capacity.
- **Consolidate** another bin with the same SKU into the selected one (source
  bin is closed out and its slot freed).

The "Acting as" field in the header tags every action for the accountability
report — set it to whoever is on the floor.

## Tests

```bash
npm test   # node:test suite covering moves, consolidation, and report/insight logic
```

## Reports

The **Reports** tab shows the live current-period accountability report
(actions per user), completion report (tasks opened/completed by zone, moves,
consolidations), and a list of flagged possible improvements:

- high-churn bins (moved 3+ times in the period)
- underutilized or near-capacity zones
- side-by-side same-SKU bins that are candidates for consolidation
- stagnant stock (14+ days without a move)
- low task-completion rate / stale open tasks

Click **Archive Now** to snapshot the current period into `report_archives`
and start a fresh period (this also happens automatically every Sunday
23:55 via `node-cron`, unless `DISABLE_WEEKLY_CRON=true` is set). Archived
weeks are listed and expandable at the bottom of the Reports tab.

## Data model

See `server/src/db.js` for the schema: `locations` (the fixed 8x8 zones +
4 flow racks), `items` (bins, with `status` so consolidated-out bins stay in
history), `activity_log` (the accountability trail), `tasks`, and
`report_archives` (frozen weekly snapshots).

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | server port |
| `WAREHOUSE_DB_PATH` | `server/data/warehouse.sqlite` | SQLite file location |
| `WEEKLY_ARCHIVE_CRON` | `55 23 * * 0` | cron schedule for auto-archiving |
| `DISABLE_WEEKLY_CRON` | unset | set to `true` to disable the scheduled job |
| `WAREHOUSE_API_URL` | `http://localhost:4000` | client dev-server proxy target |
