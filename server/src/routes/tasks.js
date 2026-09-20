import { Router } from 'express';
import { listTasks, createTask, updateTaskStatus, WarehouseError } from '../lib/warehouse.js';

export const tasksRouter = Router();

tasksRouter.get('/tasks', (req, res) => {
  res.json({ tasks: listTasks() });
});

tasksRouter.post('/tasks', (req, res) => {
  const { title, zone, assignedTo } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  res.status(201).json({ task: createTask({ title, zone, assignedTo }) });
});

tasksRouter.patch('/tasks/:id/status', (req, res) => {
  const { status, user } = req.body || {};
  if (!['open', 'in_progress', 'done'].includes(status)) {
    return res.status(400).json({ error: 'status must be open, in_progress, or done' });
  }
  try {
    const task = updateTaskStatus({ id: Number(req.params.id), status, user });
    res.json({ task });
  } catch (err) {
    if (err instanceof WarehouseError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});
