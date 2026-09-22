const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request to ${path} failed (${res.status})`);
  }
  return body;
}

export const api = {
  getLayout: () => request('/layout'),
  createItem: (payload) => request('/items', { method: 'POST', body: JSON.stringify(payload) }),
  moveItem: (payload) => request('/moves', { method: 'POST', body: JSON.stringify(payload) }),
  consolidate: (payload) => request('/consolidate', { method: 'POST', body: JSON.stringify(payload) }),
  splitItem: (payload) => request('/split', { method: 'POST', body: JSON.stringify(payload) }),
  getActivity: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/activity${qs ? `?${qs}` : ''}`);
  },
  getTasks: () => request('/tasks'),
  createTask: (payload) => request('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  updateTaskStatus: (id, payload) => request(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getCurrentReports: () => request('/reports/current'),
  getArchives: () => request('/reports/archives'),
  getArchive: (id) => request(`/reports/archives/${id}`),
  archiveNow: (payload) => request('/reports/archive', { method: 'POST', body: JSON.stringify(payload) }),
};
