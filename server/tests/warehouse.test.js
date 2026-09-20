import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshWarehouse } from './testUtils.js';

const { warehouse } = await freshWarehouse();
const { moveItem, consolidateItems, createItem, WarehouseError } = warehouse;

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
