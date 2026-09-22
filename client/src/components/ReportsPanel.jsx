import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { toDate } from '../format.js';

function fmtPct(n) {
  return n == null ? '—' : `${Math.round(n * 100)}%`;
}

function InsightList({ insights }) {
  if (!insights || insights.length === 0) {
    return <p className="muted">No improvement flags for this period — layout looks healthy.</p>;
  }
  return (
    <ul className="insight-list">
      {insights.map((flag, i) => (
        <li key={i} className={`insight insight-${flag.severity}`}>
          <span className="insight-category">{flag.category.replace(/_/g, ' ')}</span>
          <span>{flag.message}</span>
        </li>
      ))}
    </ul>
  );
}

function AccountabilityTable({ report }) {
  return (
    <table className="report-table">
      <thead>
        <tr><th>User</th><th>Moves</th><th>Splits</th><th>Consolidations</th><th>Bins created</th><th>Tasks done</th><th>Total actions</th></tr>
      </thead>
      <tbody>
        {report.byUser.map((u) => (
          <tr key={u.user}>
            <td>{u.user}</td>
            <td>{u.moves}</td>
            <td>{u.splits}</td>
            <td>{u.consolidations}</td>
            <td>{u.bins_created}</td>
            <td>{u.tasks_completed}</td>
            <td>{u.total_actions}</td>
          </tr>
        ))}
        {report.byUser.length === 0 && <tr><td colSpan={7} className="muted">No activity in this period.</td></tr>}
      </tbody>
    </table>
  );
}

function CompletionSummary({ report }) {
  return (
    <div>
      <div className="stat-row">
        <div className="stat"><span className="stat-value">{report.tasksOpened}</span><span className="stat-label">Opened</span></div>
        <div className="stat"><span className="stat-value">{report.tasksCompleted}</span><span className="stat-label">Completed</span></div>
        <div className="stat"><span className="stat-value">{fmtPct(report.completionRate)}</span><span className="stat-label">Completion rate</span></div>
        <div className="stat"><span className="stat-value">{report.warehouseWork.moves}</span><span className="stat-label">Moves</span></div>
        <div className="stat"><span className="stat-value">{report.warehouseWork.consolidations}</span><span className="stat-label">Consolidations</span></div>
      </div>
      <table className="report-table">
        <thead><tr><th>Zone</th><th>Completed</th><th>Still open</th></tr></thead>
        <tbody>
          {report.byZone.map((z) => (
            <tr key={z.zone}><td>{z.zone}</td><td>{z.completed}</td><td>{z.open}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArchiveDetail({ archive }) {
  return (
    <div className="archive-detail">
      <h4>Accountability</h4>
      <AccountabilityTable report={archive.accountability} />
      <h4>Completion</h4>
      <CompletionSummary report={archive.completion} />
      <h4>Flagged improvements</h4>
      <InsightList insights={archive.insights} />
    </div>
  );
}

export default function ReportsPanel({ user }) {
  const [current, setCurrent] = useState(null);
  const [archives, setArchives] = useState([]);
  const [openArchiveId, setOpenArchiveId] = useState(null);
  const [openArchive, setOpenArchive] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function refresh() {
    const [c, a] = await Promise.all([api.getCurrentReports(), api.getArchives()]);
    setCurrent(c);
    setArchives(a.archives);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (openArchiveId == null) {
      setOpenArchive(null);
      return;
    }
    api.getArchive(openArchiveId).then((res) => setOpenArchive(res.archive));
  }, [openArchiveId]);

  async function archiveNow() {
    setBusy(true);
    setError(null);
    try {
      await api.archiveNow({ user });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!current) return <div className="panel">Loading reports...</div>;

  return (
    <div className="reports-view">
      <div className="panel">
        <div className="reports-header">
          <h3>Current period</h3>
          <span className="muted">{toDate(current.window.since).toLocaleString()} → now</span>
          <button onClick={archiveNow} disabled={busy}>{busy ? 'Archiving...' : 'Archive Now (end of week)'}</button>
        </div>
        {error && <div className="error-text">{error}</div>}
        <h4>Accountability</h4>
        <AccountabilityTable report={current.accountability} />
        <h4>Completion</h4>
        <CompletionSummary report={current.completion} />
        <h4>Flagged improvements</h4>
        <InsightList insights={current.insights} />
      </div>

      <div className="panel">
        <h3>Weekly archives</h3>
        <ul className="archive-list">
          {archives.map((a) => (
            <li key={a.id}>
              <button className="archive-toggle" onClick={() => setOpenArchiveId(openArchiveId === a.id ? null : a.id)}>
                Week {toDate(a.week_start).toLocaleDateString()} – {toDate(a.week_end).toLocaleDateString()}
              </button>
              {openArchiveId === a.id && openArchive && <ArchiveDetail archive={openArchive} />}
            </li>
          ))}
          {archives.length === 0 && <li className="muted">No archives yet — use "Archive Now" to snapshot the current period.</li>}
        </ul>
      </div>
    </div>
  );
}
