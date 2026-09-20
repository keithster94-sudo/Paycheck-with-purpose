import { db } from '../db.js';
import crypto from 'node:crypto';

export class WarehouseError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function getLocations() {
  return db.prepare('SELECT * FROM locations ORDER BY type, zone, position').all();
}

export function getActiveItems() {
  return db.prepare(`SELECT * FROM items WHERE status = 'active' ORDER BY location_id, slot_index`).all();
}

export function getLayout() {
  const locations = getLocations();
  const items = getActiveItems();
  const byLocation = new Map();
  for (const item of items) {
    if (!byLocation.has(item.location_id)) byLocation.set(item.location_id, []);
    byLocation.get(item.location_id).push(item);
  }
  return locations.map((loc) => {
    const occupants = (byLocation.get(loc.id) || []).sort((a, b) => a.slot_index - b.slot_index);
    return {
      ...loc,
      occupants,
      free_slots: loc.depth - occupants.length,
    };
  });
}

function getLocation(locationId) {
  const loc = db.prepare('SELECT * FROM locations WHERE id = ?').get(locationId);
  if (!loc) throw new WarehouseError(`Unknown location: ${locationId}`, 404);
  return loc;
}

function occupantCount(locationId) {
  return db
    .prepare(`SELECT COUNT(*) AS n FROM items WHERE location_id = ? AND status = 'active'`)
    .get(locationId).n;
}

function nextSlotIndex(locationId) {
  const row = db
    .prepare(`SELECT COALESCE(MAX(slot_index), -1) AS m FROM items WHERE location_id = ? AND status = 'active'`)
    .get(locationId);
  return row.m + 1;
}

function logActivity({ type, itemId, fromLocationId, toLocationId, user, detail }) {
  db.prepare(`
    INSERT INTO activity_log (type, item_id, from_location_id, to_location_id, user, detail)
    VALUES (@type, @itemId, @fromLocationId, @toLocationId, @user, @detail)
  `).run({
    type,
    itemId: itemId ?? null,
    fromLocationId: fromLocationId ?? null,
    toLocationId: toLocationId ?? null,
    user: user || 'unknown',
    detail: detail ? JSON.stringify(detail) : null,
  });
}

export function createItem({ sku, description, quantity, lot, locationId, user }) {
  const loc = getLocation(locationId);
  if (occupantCount(locationId) >= loc.depth) {
    throw new WarehouseError(`Location ${locationId} is full`, 409);
  }
  const id = `BIN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const slotIndex = nextSlotIndex(locationId);
  db.prepare(`
    INSERT INTO items (id, sku, description, quantity, lot, location_id, slot_index)
    VALUES (@id, @sku, @description, @quantity, @lot, @locationId, @slotIndex)
  `).run({ id, sku, description: description ?? null, quantity: quantity ?? 0, lot: lot ?? null, locationId, slotIndex });
  logActivity({ type: 'create', itemId: id, toLocationId: locationId, user, detail: { sku, quantity } });
  return db.prepare('SELECT * FROM items WHERE id = ?').get(id);
}

export function moveItem({ itemId, toLocationId, user, reason }) {
  const item = db.prepare(`SELECT * FROM items WHERE id = ? AND status = 'active'`).get(itemId);
  if (!item) throw new WarehouseError(`Unknown active item: ${itemId}`, 404);
  const destination = getLocation(toLocationId);
  if (destination.id === item.location_id) {
    throw new WarehouseError('Item is already at that location', 409);
  }
  if (occupantCount(toLocationId) >= destination.depth) {
    throw new WarehouseError(`Destination ${toLocationId} is full`, 409);
  }

  const fromLocationId = item.location_id;
  const slotIndex = nextSlotIndex(toLocationId);

  const run = db.transaction(() => {
    db.prepare(`
      UPDATE items
      SET location_id = @toLocationId, slot_index = @slotIndex, updated_at = datetime('now'),
          moves_this_week = moves_this_week + 1
      WHERE id = @itemId
    `).run({ toLocationId, slotIndex, itemId });

    logActivity({
      type: 'move',
      itemId,
      fromLocationId,
      toLocationId,
      user,
      detail: { reason: reason || null },
    });
  });
  run();

  return db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
}

/**
 * Consolidate several source bins into a target bin: quantities are summed onto
 * the target, source bins are closed out (freeing their slots), and the merge is logged
 * for accountability. All items must share the same SKU.
 */
export function consolidateItems({ sourceItemIds, targetItemId, user, note }) {
  if (!Array.isArray(sourceItemIds) || sourceItemIds.length === 0) {
    throw new WarehouseError('sourceItemIds must be a non-empty array', 400);
  }
  const target = db.prepare(`SELECT * FROM items WHERE id = ? AND status = 'active'`).get(targetItemId);
  if (!target) throw new WarehouseError(`Unknown active target item: ${targetItemId}`, 404);
  if (sourceItemIds.includes(targetItemId)) {
    throw new WarehouseError('Target item cannot also be a source item', 400);
  }

  const sources = sourceItemIds.map((id) => {
    const item = db.prepare(`SELECT * FROM items WHERE id = ? AND status = 'active'`).get(id);
    if (!item) throw new WarehouseError(`Unknown active source item: ${id}`, 404);
    if (item.sku !== target.sku) {
      throw new WarehouseError(`Item ${id} (${item.sku}) does not match target SKU ${target.sku}`, 409);
    }
    return item;
  });

  const addedQuantity = sources.reduce((sum, s) => sum + s.quantity, 0);
  const newQuantity = target.quantity + addedQuantity;

  const run = db.transaction(() => {
    db.prepare(`
      UPDATE items SET quantity = @newQuantity, updated_at = datetime('now') WHERE id = @targetId
    `).run({ newQuantity, targetId: targetItemId });

    for (const source of sources) {
      db.prepare(`
        UPDATE items SET status = 'consolidated_out', updated_at = datetime('now') WHERE id = @id
      `).run({ id: source.id });
    }

    logActivity({
      type: 'consolidate',
      itemId: targetItemId,
      fromLocationId: sources[0]?.location_id,
      toLocationId: target.location_id,
      user,
      detail: {
        sku: target.sku,
        mergedFrom: sources.map((s) => ({ id: s.id, quantity: s.quantity, locationId: s.location_id })),
        addedQuantity,
        resultingQuantity: newQuantity,
        note: note || null,
      },
    });
  });
  run();

  return db.prepare('SELECT * FROM items WHERE id = ?').get(targetItemId);
}

export function listActivity({ since, until, limit = 200 } = {}) {
  let query = 'SELECT * FROM activity_log WHERE 1=1';
  const params = {};
  if (since) {
    query += ' AND created_at >= @since';
    params.since = since;
  }
  if (until) {
    query += ' AND created_at <= @until';
    params.until = until;
  }
  query += ' ORDER BY created_at DESC LIMIT @limit';
  params.limit = limit;
  return db.prepare(query).all(params);
}

export function listTasks() {
  return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
}

export function createTask({ title, zone, assignedTo }) {
  const info = db.prepare(`
    INSERT INTO tasks (title, zone, assigned_to) VALUES (@title, @zone, @assignedTo)
  `).run({ title, zone: zone ?? null, assignedTo: assignedTo ?? null });
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
}

export function updateTaskStatus({ id, status, user }) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) throw new WarehouseError(`Unknown task: ${id}`, 404);
  const completedAt = status === 'done' ? new Date().toISOString() : null;
  db.prepare(`
    UPDATE tasks SET status = @status, completed_at = @completedAt WHERE id = @id
  `).run({ id, status, completedAt });
  if (status === 'done') {
    logActivity({ type: 'task_complete', itemId: null, user, detail: { taskId: id, title: task.title, zone: task.zone } });
  }
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}
