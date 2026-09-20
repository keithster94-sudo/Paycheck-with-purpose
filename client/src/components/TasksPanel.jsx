import { useState } from 'react';
import { api } from '../api.js';

const STATUS_LABEL = { open: 'Open', in_progress: 'In progress', done: 'Done' };

export default function TasksPanel({ tasks, user, onChanged }) {
  const [title, setTitle] = useState('');
  const [zone, setZone] = useState('');
  const [busy, setBusy] = useState(false);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await api.createTask({ title: title.trim(), zone: zone.trim() || null, assignedTo: user });
      setTitle('');
      setZone('');
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function cycleStatus(task) {
    const next = task.status === 'open' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'open';
    await api.updateTaskStatus(task.id, { status: next, user });
    onChanged();
  }

  return (
    <div className="panel">
      <h3>Tasks</h3>
      <form className="task-form" onSubmit={addTask}>
        <input placeholder="New task" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Zone (optional)" value={zone} onChange={(e) => setZone(e.target.value)} className="zone-input" />
        <button type="submit" disabled={busy}>Add</button>
      </form>
      <ul className="task-list">
        {tasks.map((t) => (
          <li key={t.id} className={`task task-${t.status}`}>
            <button className="task-status-btn" onClick={() => cycleStatus(t)} title="Click to advance status">
              {STATUS_LABEL[t.status]}
            </button>
            <span className="task-title">{t.title}</span>
            {t.zone && <span className="task-zone">{t.zone}</span>}
          </li>
        ))}
        {tasks.length === 0 && <li className="muted">No tasks yet.</li>}
      </ul>
    </div>
  );
}
