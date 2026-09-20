import { Router } from 'express';
import { getCurrentReports, listArchives, getArchive, archiveCurrentWeek } from '../lib/reportGenerator.js';

export const reportsRouter = Router();

reportsRouter.get('/reports/current', (req, res) => {
  res.json(getCurrentReports());
});

reportsRouter.get('/reports/archives', (req, res) => {
  res.json({ archives: listArchives() });
});

reportsRouter.get('/reports/archives/:id', (req, res) => {
  const archive = getArchive(Number(req.params.id));
  if (!archive) return res.status(404).json({ error: 'Archive not found' });
  res.json({ archive });
});

reportsRouter.post('/reports/archive', (req, res) => {
  const { user } = req.body || {};
  const archive = archiveCurrentWeek({ user });
  res.status(201).json({ archive });
});
