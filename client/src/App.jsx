import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import WarehouseGrid from './components/WarehouseGrid.jsx';
import Inspector from './components/Inspector.jsx';
import TasksPanel from './components/TasksPanel.jsx';
import ActivityFeed from './components/ActivityFeed.jsx';
import ReportsPanel from './components/ReportsPanel.jsx';

function useUser() {
  const [user, setUser] = useState(() => localStorage.getItem('warehouse.user') || 'Floor User');
  useEffect(() => {
    localStorage.setItem('warehouse.user', user);
  }, [user]);
  return [user, setUser];
}

export default function App() {
  const [tab, setTab] = useState('layout');
  const [user, setUser] = useUser();
  const [locations, setLocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [layoutRes, tasksRes, activityRes] = await Promise.all([
        api.getLayout(),
        api.getTasks(),
        api.getActivity({ limit: 50 }),
      ]);
      setLocations(layoutRes.locations);
      setTasks(tasksRes.tasks);
      setActivity(activityRes.activity);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId) || null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Warehouse Storage Layout</h1>
        <div className="header-controls">
          <label>Acting as
            <input value={user} onChange={(e) => setUser(e.target.value)} />
          </label>
          <nav className="tabs">
            <button className={tab === 'layout' ? 'active' : ''} onClick={() => setTab('layout')}>Layout</button>
            <button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>Reports</button>
          </nav>
        </div>
      </header>

      {loadError && <div className="error-banner">Could not reach the server: {loadError}</div>}

      {tab === 'layout' ? (
        <div className="layout-view">
          <WarehouseGrid locations={locations} selectedLocationId={selectedLocationId} onSelect={(loc) => setSelectedLocationId(loc.id)} />
          <div className="sidebar">
            <Inspector location={selectedLocation} locations={locations} user={user} onChanged={refresh} />
            <TasksPanel tasks={tasks} user={user} onChanged={refresh} />
            <ActivityFeed activity={activity} />
          </div>
        </div>
      ) : (
        <ReportsPanel user={user} />
      )}
    </div>
  );
}
