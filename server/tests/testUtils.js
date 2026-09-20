import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Points WAREHOUSE_DB_PATH at a fresh temp sqlite file before dynamically
 * importing the app modules, so each test file gets an isolated database
 * (db.js opens its connection once, at import time).
 */
export async function freshWarehouse() {
  const tmpDir = path.join(__dirname, '.tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  process.env.WAREHOUSE_DB_PATH = path.join(tmpDir, `test-${crypto.randomUUID()}.sqlite`);

  await import('../src/db.js');
  const seedModule = await import('../src/seed.js?t=' + Date.now());
  const warehouse = await import('../src/lib/warehouse.js');
  const reportGenerator = await import('../src/lib/reportGenerator.js');
  const insights = await import('../src/lib/insights.js');

  return { warehouse, reportGenerator, insights, seedModule };
}
