import { Router } from 'express';
import { moveItem, consolidateItems, splitItem, listActivity, WarehouseError } from '../lib/warehouse.js';

export const movesRouter = Router();

movesRouter.post('/moves', (req, res) => {
  const { itemId, toLocationId, user, reason } = req.body || {};
  if (!itemId || !toLocationId) {
    return res.status(400).json({ error: 'itemId and toLocationId are required' });
  }
  try {
    const item = moveItem({ itemId, toLocationId, user, reason });
    res.json({ item });
  } catch (err) {
    if (err instanceof WarehouseError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

movesRouter.post('/consolidate', (req, res) => {
  const { sourceItemIds, targetItemId, user, note } = req.body || {};
  if (!targetItemId) {
    return res.status(400).json({ error: 'targetItemId is required' });
  }
  try {
    const item = consolidateItems({ sourceItemIds, targetItemId, user, note });
    res.json({ item });
  } catch (err) {
    if (err instanceof WarehouseError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

movesRouter.post('/split', (req, res) => {
  const { itemId, quantity, toLocationId, user, note } = req.body || {};
  if (!itemId || !toLocationId || quantity == null) {
    return res.status(400).json({ error: 'itemId, quantity, and toLocationId are required' });
  }
  try {
    const result = splitItem({ itemId, quantity, toLocationId, user, note });
    res.json(result);
  } catch (err) {
    if (err instanceof WarehouseError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

movesRouter.get('/activity', (req, res) => {
  const { since, until, limit } = req.query;
  res.json({ activity: listActivity({ since, until, limit: limit ? Number(limit) : undefined }) });
});
