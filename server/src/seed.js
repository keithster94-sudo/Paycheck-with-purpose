import { db } from './db.js';

const ZONES = 8;
const PALLET_SPACES_PER_ZONE = 8;
const FLOW_RACKS = 4;
const LANES_PER_RACK = 4;
const LANE_DEPTH = 3;

function seedLayout() {
  const insertLocation = db.prepare(`
    INSERT OR IGNORE INTO locations (id, type, zone, position, depth, label)
    VALUES (@id, @type, @zone, @position, @depth, @label)
  `);

  const insertMany = db.transaction((locations) => {
    for (const loc of locations) insertLocation.run(loc);
  });

  const locations = [];

  for (let z = 1; z <= ZONES; z++) {
    const zone = `Z${z}`;
    for (let p = 1; p <= PALLET_SPACES_PER_ZONE; p++) {
      locations.push({
        id: `${zone}-P${p}`,
        type: 'pallet',
        zone,
        position: p,
        depth: 1,
        label: `Zone ${z} / Pallet Space ${p}`,
      });
    }
  }

  for (let r = 1; r <= FLOW_RACKS; r++) {
    const zone = `FR${r}`;
    for (let l = 1; l <= LANES_PER_RACK; l++) {
      locations.push({
        id: `${zone}-L${l}`,
        type: 'flow_rack',
        zone,
        position: l,
        depth: LANE_DEPTH,
        label: `Flow Rack ${r} / Lane ${l}`,
      });
    }
  }

  insertMany(locations);
  return locations.length;
}

function seedDemoItems() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM items').get().n;
  if (count > 0) return 0;

  const insertItem = db.prepare(`
    INSERT INTO items (id, sku, description, quantity, lot, location_id, slot_index)
    VALUES (@id, @sku, @description, @quantity, @lot, @location_id, @slot_index)
  `);
  const logActivity = db.prepare(`
    INSERT INTO activity_log (type, item_id, from_location_id, to_location_id, user, detail)
    VALUES ('create', @item_id, NULL, @location_id, @user, @detail)
  `);

  const demo = [
    { id: 'BIN-0001', sku: 'SKU-1001', description: 'Canned Beans (case)', quantity: 42, lot: 'L2409A', location_id: 'Z1-P1', slot_index: 0 },
    { id: 'BIN-0002', sku: 'SKU-1001', description: 'Canned Beans (case)', quantity: 18, lot: 'L2409A', location_id: 'Z1-P2', slot_index: 0 },
    { id: 'BIN-0003', sku: 'SKU-2050', description: 'Bottled Water 24pk', quantity: 60, lot: 'L2408C', location_id: 'Z3-P4', slot_index: 0 },
    { id: 'BIN-0004', sku: 'SKU-3110', description: 'Paper Towels 12ct', quantity: 24, lot: 'L2409B', location_id: 'FR1-L1', slot_index: 0 },
    { id: 'BIN-0005', sku: 'SKU-3110', description: 'Paper Towels 12ct', quantity: 24, lot: 'L2409B', location_id: 'FR1-L1', slot_index: 1 },
  ];

  const insertAll = db.transaction((items) => {
    for (const item of items) {
      insertItem.run({ ...item, description: item.description ?? null, lot: item.lot ?? null });
      logActivity.run({
        item_id: item.id,
        location_id: item.location_id,
        user: 'seed',
        detail: JSON.stringify({ sku: item.sku, quantity: item.quantity }),
      });
    }
  });
  insertAll(demo);
  return demo.length;
}

function seedDemoTasks() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n;
  if (count > 0) return 0;
  const insertTask = db.prepare(`
    INSERT INTO tasks (title, zone, status, assigned_to) VALUES (@title, @zone, @status, @assigned_to)
  `);
  const demoTasks = [
    { title: 'Replenish flow rack FR1 lane 2', zone: 'FR1', status: 'open', assigned_to: null },
    { title: 'Cycle count Zone 3', zone: 'Z3', status: 'in_progress', assigned_to: 'M. Ortiz' },
    { title: 'Consolidate partial pallets in Zone 1', zone: 'Z1', status: 'open', assigned_to: null },
  ];
  const insertAll = db.transaction((tasks) => {
    for (const t of tasks) insertTask.run(t);
  });
  insertAll(demoTasks);
  return demoTasks.length;
}

const locCount = seedLayout();
const itemCount = seedDemoItems();
const taskCount = seedDemoTasks();

console.log(`Seeded ${locCount} locations (idempotent), ${itemCount} demo items, ${taskCount} demo tasks.`);
