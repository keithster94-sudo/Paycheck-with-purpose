function occupancyClass(loc) {
  if (loc.occupants.length === 0) return 'slot-empty';
  if (loc.free_slots <= 0) return 'slot-full';
  return 'slot-partial';
}

function Slot({ loc, isSelected, onSelect }) {
  return (
    <button
      className={`slot ${occupancyClass(loc)} ${isSelected ? 'slot-selected' : ''}`}
      onClick={() => onSelect(loc)}
      title={loc.label}
    >
      <div className="slot-label">{loc.type === 'pallet' ? `P${loc.position}` : `L${loc.position}`}</div>
      {loc.occupants.length === 0 ? (
        <div className="slot-empty-text">empty</div>
      ) : (
        <div className="slot-items">
          {loc.occupants.map((item) => (
            <div key={item.id} className="slot-item">
              <span className="slot-item-sku">{item.sku}</span>
              <span className="slot-item-qty">x{item.quantity}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

function ZoneCard({ zone, locations, selectedLocationId, onSelect }) {
  const sorted = [...locations].sort((a, b) => a.position - b.position);
  const totalCapacity = sorted.reduce((s, l) => s + l.depth, 0);
  const occupied = sorted.reduce((s, l) => s + l.occupants.length, 0);
  return (
    <div className="zone-card">
      <div className="zone-header">
        <span>Zone {zone.replace('Z', '')}</span>
        <span className="zone-occupancy">{occupied}/{totalCapacity}</span>
      </div>
      <div className="zone-slots">
        {sorted.map((loc) => (
          <Slot key={loc.id} loc={loc} isSelected={loc.id === selectedLocationId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function FlowRackCard({ rack, locations, selectedLocationId, onSelect }) {
  const sorted = [...locations].sort((a, b) => a.position - b.position);
  return (
    <div className="rack-card">
      <div className="zone-header">
        <span>Flow Rack {rack.replace('FR', '')}</span>
      </div>
      <div className="rack-lanes">
        {sorted.map((loc) => (
          <Slot key={loc.id} loc={loc} isSelected={loc.id === selectedLocationId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

export default function WarehouseGrid({ locations, selectedLocationId, onSelect }) {
  const zones = {};
  const racks = {};
  for (const loc of locations) {
    if (loc.type === 'pallet') {
      (zones[loc.zone] ||= []).push(loc);
    } else {
      (racks[loc.zone] ||= []).push(loc);
    }
  }

  return (
    <div className="warehouse-grid">
      <div className="zones-grid">
        {Object.keys(zones)
          .sort()
          .map((zone) => (
            <ZoneCard key={zone} zone={zone} locations={zones[zone]} selectedLocationId={selectedLocationId} onSelect={onSelect} />
          ))}
      </div>
      <div className="racks-grid">
        {Object.keys(racks)
          .sort()
          .map((rack) => (
            <FlowRackCard key={rack} rack={rack} locations={racks[rack]} selectedLocationId={selectedLocationId} onSelect={onSelect} />
          ))}
      </div>
    </div>
  );
}
