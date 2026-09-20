import { db } from '../db.js';
import { buildInsights } from './insights.js';

/**
 * The "current week" window runs from the end of the last archive up to now
 * (or the last 7 days if nothing has ever been archived). This lets the
 * warehouse floor generate/archive on whatever cadence it actually works in
 * (nominally weekly) instead of a rigid Mon-Sun calendar week.
 */
export function getCurrentWeekWindow() {
  const lastArchive = db.prepare('SELECT * FROM report_archives ORDER BY id DESC LIMIT 1').get();
  const until = new Date().toISOString();
  const since = lastArchive
    ? lastArchive.week_end
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return { since, until };
}

export function buildAccountabilityReport({ since, until }) {
  const byUser = db.prepare(`
    SELECT
      user,
      SUM(CASE WHEN type = 'move' THEN 1 ELSE 0 END) AS moves,
      SUM(CASE WHEN type = 'consolidate' THEN 1 ELSE 0 END) AS consolidations,
      SUM(CASE WHEN type = 'create' THEN 1 ELSE 0 END) AS bins_created,
      SUM(CASE WHEN type = 'task_complete' THEN 1 ELSE 0 END) AS tasks_completed,
      COUNT(*) AS total_actions
    FROM activity_log
    WHERE created_at >= @since AND created_at < @until
    GROUP BY user
    ORDER BY total_actions DESC
  `).all({ since, until });

  const totals = byUser.reduce(
    (acc, row) => {
      acc.moves += row.moves;
      acc.consolidations += row.consolidations;
      acc.bins_created += row.bins_created;
      acc.tasks_completed += row.tasks_completed;
      acc.total_actions += row.total_actions;
      return acc;
    },
    { moves: 0, consolidations: 0, bins_created: 0, tasks_completed: 0, total_actions: 0 }
  );

  const events = db.prepare(`
    SELECT * FROM activity_log WHERE created_at >= @since AND created_at < @until ORDER BY created_at ASC
  `).all({ since, until });

  return {
    period: { since, until },
    byUser,
    totals,
    eventCount: events.length,
    events,
  };
}

export function buildCompletionReport({ since, until }) {
  const opened = db.prepare(`
    SELECT * FROM tasks WHERE created_at >= @since AND created_at < @until
  `).all({ since, until });

  const completed = db.prepare(`
    SELECT * FROM tasks WHERE completed_at >= @since AND completed_at < @until
  `).all({ since, until });

  const stillOpen = db.prepare(`
    SELECT * FROM tasks WHERE status != 'done' AND created_at < @until
  `).all({ until });

  const byZone = db.prepare(`
    SELECT COALESCE(zone, 'unassigned') AS zone,
      SUM(CASE WHEN completed_at >= @since AND completed_at < @until THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status != 'done' AND created_at < @until THEN 1 ELSE 0 END) AS open
    FROM tasks
    GROUP BY zone
  `).all({ since, until });

  const consolidations = db.prepare(`
    SELECT COUNT(*) AS n FROM activity_log WHERE type = 'consolidate' AND created_at >= @since AND created_at < @until
  `).get({ since, until }).n;

  const movesCompleted = db.prepare(`
    SELECT COUNT(*) AS n FROM activity_log WHERE type = 'move' AND created_at >= @since AND created_at < @until
  `).get({ since, until }).n;

  const completionRate = opened.length > 0 ? completed.length / opened.length : null;

  return {
    period: { since, until },
    tasksOpened: opened.length,
    tasksCompleted: completed.length,
    tasksStillOpen: stillOpen.length,
    completionRate,
    byZone,
    warehouseWork: { moves: movesCompleted, consolidations },
    completedTasks: completed,
    stillOpenTasks: stillOpen,
  };
}

export function getCurrentReports() {
  const window = getCurrentWeekWindow();
  return {
    window,
    accountability: buildAccountabilityReport(window),
    completion: buildCompletionReport(window),
    insights: buildInsights(window),
  };
}

export function listArchives() {
  return db.prepare('SELECT id, week_start, week_end, generated_at FROM report_archives ORDER BY id DESC').all();
}

export function getArchive(id) {
  const row = db.prepare('SELECT * FROM report_archives WHERE id = ?').get(id);
  if (!row) return null;
  return {
    id: row.id,
    week_start: row.week_start,
    week_end: row.week_end,
    generated_at: row.generated_at,
    accountability: JSON.parse(row.accountability_json),
    completion: JSON.parse(row.completion_json),
    insights: JSON.parse(row.insights_json),
  };
}

/**
 * Snapshot the current window's accountability + completion reports and
 * insight flags into report_archives, then roll the per-item weekly move
 * counters back to zero so next period's churn numbers start fresh.
 */
export function archiveCurrentWeek({ user } = {}) {
  const window = getCurrentWeekWindow();
  const accountability = buildAccountabilityReport(window);
  const completion = buildCompletionReport(window);
  const insights = buildInsights(window);

  const run = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO report_archives (week_start, week_end, accountability_json, completion_json, insights_json)
      VALUES (@week_start, @week_end, @accountability_json, @completion_json, @insights_json)
    `).run({
      week_start: window.since,
      week_end: window.until,
      accountability_json: JSON.stringify(accountability),
      completion_json: JSON.stringify(completion),
      insights_json: JSON.stringify(insights),
    });
    db.prepare(`UPDATE items SET moves_this_week = 0`).run();
    db.prepare(`
      INSERT INTO activity_log (type, item_id, from_location_id, to_location_id, user, detail)
      VALUES ('archive', NULL, NULL, NULL, @user, @detail)
    `).run({ user: user || 'system', detail: JSON.stringify({ archiveId: info.lastInsertRowid, window }) });
    return info.lastInsertRowid;
  });

  const archiveId = run();
  return getArchive(archiveId);
}
