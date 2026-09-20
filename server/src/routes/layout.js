import { Router } from 'express';
import { getLayout, createItem, WarehouseError } from '../lib/warehouse.js';

export const layoutRouter = Router();

layoutRouter.get('/layout', (req, res) => {
  res.json({ locations: getLayout() });
});

layoutRouter.post('/items', (req, res) => {
  const { sku, description, quantity, lot, locationId, user } = req.body || {};
  if (!sku || !locationId) {
    return res.status(400).json({ error: 'sku and locationId are required' });
  }
  try {
    const item = createItem({ sku, description, quantity, lot, locationId, user });
    res.status(201).json({ item });
  } catch (err) {
    if (err instanceof WarehouseError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});
