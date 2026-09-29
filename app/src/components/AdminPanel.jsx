import { useEffect, useState } from 'react';
import { api } from '../api';
import AdminStudentDetail from './AdminStudentDetail';
import { ALL_TEST_OPTIONS } from '../data/testsIndex';

function accessSummary(allowedTests) {
  if (allowedTests === null) return 'All tests';
  if (allowedTests.length === 0) return 'None';
  return `${allowedTests.length}/${ALL_TEST_OPTIONS.length} tests`;
}

export default function AdminPanel({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  async function loadUsers() {
    setLoading(true);
    try {
      setUsers(await api.adminListUsers());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.adminCreateUser(username.trim(), password);
      setUsername('');
      setPassword('');
      await loadUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Remove student "${name}"? This deletes their saved scores too.`)) return;
    await api.adminDeleteUser(id);
    await loadUsers();
  }

  if (selectedStudentId) {
    return (
      <AdminStudentDetail studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />
    );
  }

  return (
    <div className="admin-panel">
      <div className="test-runner-topbar">
        <div className="test-runner-title">Admin — Manage Students</div>
        <button className="link-button" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <form className="admin-create-card" onSubmit={handleCreate}>
        <h2>Add a student</h2>
        <div className="admin-form-row">
          <label className="login-label">
            Username
            <input
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jsmith"
            />
          </label>
          <label className="login-label">
            Temporary password
            <input
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 6 characters"
            />
          </label>
        </div>
        {formError && <div className="login-error">{formError}</div>}
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add student'}
        </button>
      </form>

      <div className="admin-user-list">
        <h2>Students</h2>
        {loading && <p className="progress-indicator">Loading…</p>}
        {!loading && users.length === 0 && <p className="progress-indicator">No students yet.</p>}
        {!loading && users.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Attempts</th>
                <th>Access</th>
                <th>Created</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.attempts}</td>
                  <td>{accessSummary(u.allowedTests)}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="link-button" onClick={() => setSelectedStudentId(u.id)}>
                      View details
                    </button>
                  </td>
                  <td>
                    <button className="link-button danger" onClick={() => handleDelete(u.id, u.username)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
