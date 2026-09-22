import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshWarehouse } from './testUtils.js';

const { warehouse } = await freshWarehouse();
const { moveItem, consolidateItems, splitItem, createItem, WarehouseError } = warehouse;

test('moveItem relocates a bin to a free slot and logs it as a move', () => {
  const before = createItem({ sku: 'SKU-TEST', quantity: 5, locationId: 'Z2-P1', user: 'alice' });
  const after = moveItem({ itemId: before.id, toLocationId: 'Z2-P2', user: 'alice', reason: 'reslot' });
  assert.equal(after.location_id, 'Z2-P2');
  assert.equal(after.moves_this_week, 1);
});

test('moveItem rejects a destination that is already full', () => {
  const a = createItem({ sku: 'SKU-FULL', quantity: 1, locationId: 'Z4-P1', user: 'bob' });
  createItem({ sku: 'SKU-FULL', quantity: 1, locationId: 'Z4-P2', user: 'bob' });
  assert.throws(
    () => moveItem({ itemId: a.id, toLocationId: 'Z4-P2', user: 'bob' }),
    WarehouseError
  );
});

test('moveItem rejects an unknown item id', () => {
  assert.throws(
    () => moveItem({ itemId: 'BIN-DOES-NOT-EXIST', toLocationId: 'Z5-P1', user: 'bob' }),
    WarehouseError
  );
});

test('consolidateItems merges quantities into the target and frees source slots', () => {
  const target = createItem({ sku: 'SKU-CONS', quantity: 10, locationId: 'Z6-P1', user: 'carol' });
  const sourceA = createItem({ sku: 'SKU-CONS', quantity: 4, locationId: 'Z6-P2', user: 'carol' });
  const sourceB = createItem({ sku: 'SKU-CONS', quantity: 6, locationId: 'Z6-P3', user: 'carol' });

  const merged = consolidateItems({
    sourceItemIds: [sourceA.id, sourceB.id],
    targetItemId: target.id,
    user: 'carol',
    note: 'end of shift cleanup',
  });

  assert.equal(merged.quantity, 20);

  // Source bins are closed out, freeing Z6-P2 / Z6-P3 for reuse.
  const reused = createItem({ sku: 'SKU-NEW', quantity: 1, locationId: 'Z6-P2', user: 'carol' });
  assert.equal(reused.location_id, 'Z6-P2');
});

test('consolidateItems refuses to merge mismatched SKUs', () => {
  const target = createItem({ sku: 'SKU-A', quantity: 10, locationId: 'Z7-P1', user: 'dan' });
  const source = createItem({ sku: 'SKU-B', quantity: 4, locationId: 'Z7-P2', user: 'dan' });
  assert.throws(
    () => consolidateItems({ sourceItemIds: [source.id], targetItemId: target.id, user: 'dan' }),
    WarehouseError
  );
});

test('splitItem peels off part of a bin into a new bin at the destination, leaving the remainder', () => {
  const pallet = createItem({ sku: 'SKU-SPLIT', quantity: 42, locationId: 'Z8-P1', user: 'erin' });
  const { source, destination } = splitItem({ itemId: pallet.id, quantity: 10, toLocationId: 'FR2-L1', user: 'erin' });

  assert.equal(source.quantity, 32);
  assert.equal(source.location_id, 'Z8-P1');
  assert.equal(destination.quantity, 10);
  assert.equal(destination.location_id, 'FR2-L1');
  assert.notEqual(destination.id, source.id);
});

test('splitItem merges into an existing same-SKU bin at the destination instead of creating a new one', () => {
  const pallet = createItem({ sku: 'SKU-SPLIT2', quantity: 20, locationId: 'Z8-P2', user: 'erin' });
  const flowRackBin = createItem({ sku: 'SKU-SPLIT2', quantity: 5, locationId: 'FR2-L2', user: 'erin' });

  const { source, destination } = splitItem({ itemId: pallet.id, quantity: 8, toLocationId: 'FR2-L2', user: 'erin' });

  assert.equal(source.quantity, 12);
  assert.equal(destination.id, flowRackBin.id);
  assert.equal(destination.quantity, 13);
});

test('splitItem closes out the source bin when the full quantity is split away', () => {
  const pallet = createItem({ sku: 'SKU-SPLIT3', quantity: 6, locationId: 'Z8-P3', user: 'erin' });
  const { source } = splitItem({ itemId: pallet.id, quantity: 6, toLocationId: 'FR2-L3', user: 'erin' });

  assert.equal(source.status, 'consolidated_out');

  // Z8-P3 is freed up for reuse now that the bin fully moved out.
  const reused = createItem({ sku: 'SKU-NEW', quantity: 1, locationId: 'Z8-P3', user: 'erin' });
  assert.equal(reused.location_id, 'Z8-P3');
});

test('splitItem rejects splitting more than the bin currently holds', () => {
  const pallet = createItem({ sku: 'SKU-SPLIT4', quantity: 3, locationId: 'Z8-P4', user: 'erin' });
  assert.throws(
    () => splitItem({ itemId: pallet.id, quantity: 4, toLocationId: 'FR2-L4', user: 'erin' }),
    WarehouseError
  );
});

test('splitItem rejects the same location as source and destination', () => {
  const pallet = createItem({ sku: 'SKU-SPLIT5', quantity: 3, locationId: 'Z8-P5', user: 'erin' });
  assert.throws(
    () => splitItem({ itemId: pallet.id, quantity: 1, toLocationId: 'Z8-P5', user: 'erin' }),
    WarehouseError
  );
});
