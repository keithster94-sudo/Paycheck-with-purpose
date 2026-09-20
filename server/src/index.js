import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import './db.js';
import { layoutRouter } from './routes/layout.js';
import { movesRouter } from './routes/moves.js';
import { tasksRouter } from './routes/tasks.js';
import { reportsRouter } from './routes/reports.js';
import { archiveCurrentWeek } from './lib/reportGenerator.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', layoutRouter);
app.use('/api', movesRouter);
app.use('/api', tasksRouter);
app.use('/api', reportsRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

// Auto-archive every Sunday at 23:55 so a week's accountability/completion
// report + improvement flags always land even if nobody clicks "Archive Now".
const CRON_SCHEDULE = process.env.WEEKLY_ARCHIVE_CRON || '55 23 * * 0';
if (process.env.DISABLE_WEEKLY_CRON !== 'true') {
  cron.schedule(CRON_SCHEDULE, () => {
    try {
      const archive = archiveCurrentWeek({ user: 'scheduler' });
      console.log(`Weekly archive #${archive.id} generated (${archive.week_start} -> ${archive.week_end}).`);
    } catch (err) {
      console.error('Weekly archive job failed:', err);
    }
  });
}

app.listen(PORT, () => {
  console.log(`Warehouse server listening on http://localhost:${PORT}`);
});
