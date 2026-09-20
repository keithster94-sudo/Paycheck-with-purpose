import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshWarehouse } from './testUtils.js';

const { warehouse, reportGenerator, insights } = await freshWarehouse();
const { moveItem, createItem, createTask, updateTaskStatus } = warehouse;
const { archiveCurrentWeek, getCurrentWeekWindow, buildAccountabilityReport } = reportGenerator;
const { buildInsights } = insights;

test('buildInsights flags side-by-side same-SKU bins as a consolidation opportunity', () => {
  const window = getCurrentWeekWindow();
  const flags = buildInsights(window);
  const found = flags.find((f) => f.category === 'consolidation_opportunity' && f.refs.locationId === 'FR1-L1');
  assert.ok(found, 'expected a consolidation_opportunity flag for the seeded FR1-L1 bins');
});

test('buildInsights flags a bin moved repeatedly in the period as high churn', () => {
  const item = createItem({ sku: 'SKU-CHURN', quantity: 1, locationId: 'Z8-P1', user: 'erin' });
  moveItem({ itemId: item.id, toLocationId: 'Z8-P2', user: 'erin' });
  moveItem({ itemId: item.id, toLocationId: 'Z8-P3', user: 'erin' });
  moveItem({ itemId: item.id, toLocationId: 'Z8-P4', user: 'erin' });

  const window = getCurrentWeekWindow();
  const flags = buildInsights(window);
  const found = flags.find((f) => f.category === 'high_churn' && f.refs.itemId === item.id);
  assert.ok(found, 'expected a high_churn flag for a bin moved 3+ times');
});

test('accountability report tallies actions per user', () => {
  const window = getCurrentWeekWindow();
  const report = buildAccountabilityReport(window);
  const erin = report.byUser.find((u) => u.user === 'erin');
  assert.ok(erin);
  assert.equal(erin.moves, 3);
  assert.ok(report.totals.total_actions >= 3);
});

test('archiveCurrentWeek snapshots reports, resets weekly move counters, and starts a new window', () => {
  createTask({ title: 'Test task', zone: 'Z1' });
  const tasks = warehouse.listTasks();
  updateTaskStatus({ id: tasks[0].id, status: 'done', user: 'frank' });

  const archive = archiveCurrentWeek({ user: 'frank' });
  assert.ok(archive.id);
  assert.equal(typeof archive.accountability.totals.total_actions, 'number');
  assert.ok(Array.isArray(archive.insights));

  const nextWindow = getCurrentWeekWindow();
  assert.equal(nextWindow.since, archive.week_end);

  const item = createItem({ sku: 'SKU-POSTARCHIVE', quantity: 1, locationId: 'Z8-P5', user: 'frank' });
  assert.equal(item.moves_this_week, 0);
});
