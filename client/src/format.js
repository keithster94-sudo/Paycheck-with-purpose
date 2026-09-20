/**
 * Timestamps come from two sources: SQLite's datetime('now') ("2026-09-20 23:53:19",
 * UTC, no zone marker) and JS Date#toISOString() (already has a trailing "Z").
 * Normalize both to a real UTC instant before handing them to Date/toLocale*.
 */
export function toDate(ts) {
  if (!ts) return null;
  return new Date(ts.endsWith('Z') ? ts : `${ts}Z`);
}
