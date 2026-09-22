import { toDate } from '../format.js';

function describe(entry) {
  const detail = entry.detail ? JSON.parse(entry.detail) : {};
  switch (entry.type) {
    case 'move':
      return `${entry.user} moved ${entry.item_id} from ${entry.from_location_id} to ${entry.to_location_id}${detail.reason ? ` (${detail.reason})` : ''}`;
    case 'consolidate':
      return `${entry.user} consolidated ${(detail.mergedFrom || []).map((m) => m.id).join(', ')} into ${entry.item_id} (now ${detail.resultingQuantity})`;
    case 'split':
      return `${entry.user} split ${detail.splitQty} of ${entry.item_id} (${detail.sku}) from ${entry.from_location_id} to ${entry.to_location_id}${detail.mergedIntoExisting ? ` (merged into ${detail.destinationItemId})` : ` (new bin ${detail.destinationItemId})`} — ${detail.remaining} left at source`;
    case 'create':
      return `${entry.user} added ${entry.item_id} (${detail.sku} x${detail.quantity}) at ${entry.to_location_id}`;
    case 'task_complete':
      return `${entry.user} completed task: ${detail.title}`;
    case 'archive':
      return `${entry.user} archived the weekly reports (#${detail.archiveId})`;
    default:
      return `${entry.user} — ${entry.type}`;
  }
}

export default function ActivityFeed({ activity }) {
  return (
    <div className="panel">
      <h3>Activity</h3>
      <ul className="activity-list">
        {activity.map((entry) => (
          <li key={entry.id} className="activity-entry">
            <span className="activity-time">{toDate(entry.created_at).toLocaleString()}</span>
            <span>{describe(entry)}</span>
          </li>
        ))}
        {activity.length === 0 && <li className="muted">No activity yet.</li>}
      </ul>
    </div>
  );
}
