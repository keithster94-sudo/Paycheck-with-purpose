import { db } from '../db.js';

const HIGH_CHURN_MOVE_THRESHOLD = 3;
const UNDERUTILIZED_OCCUPANCY = 0.25;
const NEAR_CAPACITY_OCCUPANCY = 0.9;
const STAGNANT_DAYS = 14;
const LOW_COMPLETION_RATE = 0.7;

/**
 * Heuristic "flag possible improvements" engine. Runs against the current
 * live state plus the activity that happened in [since, until), and returns
 * a flat list of { severity, category, message, refs } findings that get
 * embedded in accountability/completion reports and weekly archives.
 */
export function buildInsights({ since, until }) {
  const flags = [];

  const moveCounts = db.prepare(`
    SELECT item_id, COUNT(*) AS moves
    FROM activity_log
    WHERE type = 'move' AND created_at >= @since AND created_at < @until AND item_id IS NOT NULL
    GROUP BY item_id
    HAVING moves >= @threshold
    ORDER BY moves DESC
  `).all({ since, until, threshold: HIGH_CHURN_MOVE_THRESHOLD });

  for (const row of moveCounts) {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(row.item_id);
    flags.push({
      severity: 'warning',
      category: 'high_churn',
      message: `Bin ${row.item_id}${item ? ` (${item.sku})` : ''} was moved ${row.moves} times this period — consider a more stable home slot or reviewing pick-path routing.`,
      refs: { itemId: row.item_id, moves: row.moves },
    });
  }

  const zoneStats = db.prepare(`
    SELECT l.zone AS zone, l.type AS type, SUM(l.depth) AS capacity, COUNT(i.id) AS occupied
    FROM locations l
    LEFT JOIN items i ON i.location_id = l.id AND i.status = 'active'
    GROUP BY l.zone, l.type
  `).all();

  for (const zone of zoneStats) {
    const occupancy = zone.capacity > 0 ? zone.occupied / zone.capacity : 0;
    if (occupancy <= UNDERUTILIZED_OCCUPANCY) {
      flags.push({
        severity: 'info',
        category: 'underutilized_zone',
        message: `${zone.zone} is only ${(occupancy * 100).toFixed(0)}% occupied (${zone.occupied}/${zone.capacity}) — a candidate for reslotting or freeing up for another zone.`,
        refs: { zone: zone.zone, occupancy },
      });
    } else if (occupancy >= NEAR_CAPACITY_OCCUPANCY) {
      flags.push({
        severity: 'warning',
        category: 'near_capacity_zone',
        message: `${zone.zone} is at ${(occupancy * 100).toFixed(0)}% capacity (${zone.occupied}/${zone.capacity}) — at risk of bottlenecking put-away.`,
        refs: { zone: zone.zone, occupancy },
      });
    }
  }

  const consolidationCandidates = db.prepare(`
    SELECT sku, location_id, COUNT(*) AS bins, GROUP_CONCAT(id) AS item_ids, SUM(quantity) AS total_qty
    FROM items
    WHERE status = 'active'
    GROUP BY sku, location_id
    HAVING bins > 1
  `).all();

  for (const c of consolidationCandidates) {
    flags.push({
      severity: 'info',
      category: 'consolidation_opportunity',
      message: `${c.bins} bins of ${c.sku} sit side by side at ${c.location_id} (${c.total_qty} units total) — consolidating frees ${c.bins - 1} pallet space(s).`,
      refs: { sku: c.sku, locationId: c.location_id, itemIds: c.item_ids.split(',') },
    });
  }

  const stagnant = db.prepare(`
    SELECT * FROM items
    WHERE status = 'active' AND julianday('now') - julianday(updated_at) >= @days
  `).all({ days: STAGNANT_DAYS });

  for (const item of stagnant) {
    flags.push({
      severity: 'info',
      category: 'stagnant_stock',
      message: `Bin ${item.id} (${item.sku}) at ${item.location_id} hasn't moved in ${STAGNANT_DAYS}+ days — verify it isn't dead stock or mis-slotted.`,
      refs: { itemId: item.id, locationId: item.location_id },
    });
  }

  const taskStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'done' AND completed_at >= @since AND completed_at < @until THEN 1 ELSE 0 END) AS completed_in_period,
      SUM(CASE WHEN status != 'done' AND created_at < @staleCutoff THEN 1 ELSE 0 END) AS stale_open
    FROM tasks
    WHERE created_at < @until
  `).get({ since, until, staleCutoff: since });

  if (taskStats.total > 0) {
    const opened = db.prepare(`SELECT COUNT(*) AS n FROM tasks WHERE created_at >= @since AND created_at < @until`).get({ since, until }).n;
    const completed = taskStats.completed_in_period || 0;
    if (opened > 0) {
      const completionRate = completed / opened;
      if (completionRate < LOW_COMPLETION_RATE) {
        flags.push({
          severity: 'warning',
          category: 'low_task_completion',
          message: `Only ${(completionRate * 100).toFixed(0)}% of tasks opened this period were completed (${completed}/${opened}) — review staffing or task sizing.`,
          refs: { opened, completed },
        });
      }
    }
    if (taskStats.stale_open > 0) {
      flags.push({
        severity: 'warning',
        category: 'stale_tasks',
        message: `${taskStats.stale_open} task(s) opened before this period are still not done — follow up before they roll into next week.`,
        refs: { count: taskStats.stale_open },
      });
    }
  }

  return flags;
}
