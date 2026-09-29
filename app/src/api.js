async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  me: () => request('/api/me'),
  login: (username, password) =>
    request('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/api/logout', { method: 'POST' }),
  getScores: () => request('/api/scores'),
  saveScore: (testId, score, total, answers) =>
    request('/api/scores', { method: 'POST', body: JSON.stringify({ testId, score, total, answers }) }),
  adminListUsers: () => request('/api/admin/users'),
  adminCreateUser: (username, password) =>
    request('/api/admin/users', { method: 'POST', body: JSON.stringify({ username, password }) }),
  adminDeleteUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  adminGetStudent: (id) => request(`/api/admin/users/${id}`),
  adminSetAccess: (id, allowedTests) =>
    request(`/api/admin/users/${id}/access`, { method: 'PUT', body: JSON.stringify({ allowedTests }) }),
};
