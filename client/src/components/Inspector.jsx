import { useState } from 'react';
import { api } from '../api.js';

function AddBinForm({ location, user, onDone }) {
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lot, setLot] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!sku.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.createItem({ sku: sku.trim(), quantity: Number(quantity) || 0, lot: lot.trim() || null, locationId: location.id, user });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="add-bin-form" onSubmit={submit}>
      <h4>Add bin at {location.label}</h4>
      <label>SKU<input value={sku} onChange={(e) => setSku(e.target.value)} required /></label>
      <label>Quantity<input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>
      <label>Lot (optional)<input value={lot} onChange={(e) => setLot(e.target.value)} /></label>
      {error && <div className="error-text">{error}</div>}
      <button type="submit" disabled={busy}>{busy ? 'Adding...' : 'Add Bin'}</button>
    </form>
  );
}

function BinActions({ item, locations, user, onDone }) {
  const [moveTarget, setMoveTarget] = useState('');
  const [mergeSource, setMergeSource] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const freeLocations = locations.filter((l) => l.free_slots > 0 && l.id !== item.location_id);
  const sameSkuElsewhere = locations
    .flatMap((l) => l.occupants.map((o) => ({ ...o, locationLabel: l.label })))
    .filter((o) => o.sku === item.sku && o.id !== item.id);

  async function doMove() {
    if (!moveTarget) return;
    setBusy(true);
    setError(null);
    try {
      await api.moveItem({ itemId: item.id, toLocationId: moveTarget, user });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function doConsolidate() {
    if (!mergeSource) return;
    setBusy(true);
    setError(null);
    try {
      await api.consolidate({ sourceItemIds: [mergeSource], targetItemId: item.id, user });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bin-actions">
      <div className="bin-summary">
        <strong>{item.id}</strong> — {item.sku} × {item.quantity}
        {item.lot && <span className="muted"> (lot {item.lot})</span>}
      </div>

      <div className="action-block">
        <label>Move to
          <select value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)}>
            <option value="">Select destination...</option>
            {freeLocations.map((l) => (
              <option key={l.id} value={l.id}>{l.label} ({l.free_slots} free)</option>
            ))}
          </select>
        </label>
        <button onClick={doMove} disabled={!moveTarget || busy}>Move</button>
      </div>

      <div className="action-block">
        <label>Consolidate in a bin
          <select value={mergeSource} onChange={(e) => setMergeSource(e.target.value)}>
            <option value="">Select bin to merge into this one...</option>
            {sameSkuElsewhere.map((o) => (
              <option key={o.id} value={o.id}>{o.id} × {o.quantity} @ {o.locationLabel}</option>
            ))}
          </select>
        </label>
        <button onClick={doConsolidate} disabled={!mergeSource || busy}>Consolidate</button>
        {sameSkuElsewhere.length === 0 && <div className="muted small">No other bins with this SKU to consolidate.</div>}
      </div>

      {error && <div className="error-text">{error}</div>}
    </div>
  );
}

export default function Inspector({ location, locations, user, onChanged }) {
  if (!location) {
    return (
      <div className="inspector inspector-empty">
        <p>Select a pallet space or flow rack lane to view details, move a bin, or consolidate.</p>
      </div>
    );
  }

  return (
    <div className="inspector">
      <div className="inspector-header">
        <h3>{location.label}</h3>
        <span className="muted">{location.occupants.length}/{location.depth} occupied</span>
      </div>

      {location.occupants.map((item) => (
        <BinActions key={item.id} item={item} locations={locations} user={user} onDone={onChanged} />
      ))}

      {location.free_slots > 0 && <AddBinForm location={location} user={user} onDone={onChanged} />}
    </div>
  );
}
