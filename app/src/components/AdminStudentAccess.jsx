import { useEffect, useState } from 'react';
import { api } from '../api';
import { ALL_TEST_OPTIONS } from '../data/testsIndex';

const GROUPS = [
  { kind: 'sequential', label: 'Sequential Practice Tests' },
  { kind: 'section', label: 'Section-Focused Practice Exams' },
  { kind: 'final', label: 'Final Exam' },
];

function toIdSet(value) {
  return new Set(value === null ? ALL_TEST_OPTIONS.map((t) => t.id) : value);
}

export default function AdminStudentAccess({ studentId, allowedTests, onSaved }) {
  const [selectedIds, setSelectedIds] = useState(() => toIdSet(allowedTests));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setSelectedIds(toIdSet(allowedTests));
    setSavedNotice(false);
  }, [studentId, allowedTests]);

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save(nextValue) {
    setSaving(true);
    setError('');
    setSavedNotice(false);
    try {
      const result = await api.adminSetAccess(studentId, nextValue);
      onSaved(result.allowedTests);
      setSavedNotice(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isUnrestricted = allowedTests === null;
  const grantedCount = allowedTests === null ? ALL_TEST_OPTIONS.length : allowedTests.length;

  return (
    <div className="admin-access">
      <p className="progress-indicator">
        Current access:{' '}
        {isUnrestricted
          ? 'unrestricted — all tests'
          : `${grantedCount} of ${ALL_TEST_OPTIONS.length} tests`}
      </p>

      <div className="admin-access-quick-actions">
        <button className="secondary-button" disabled={saving} onClick={() => save(null)}>
          Grant all tests (incl. future ones)
        </button>
        <button className="secondary-button danger" disabled={saving} onClick={() => save([])}>
          Revoke all access
        </button>
      </div>

      <p className="portal-group-subtitle">Or choose individually:</p>

      {GROUPS.map((group) => {
        const options = ALL_TEST_OPTIONS.filter((t) => t.kind === group.kind);
        if (options.length === 0) return null;
        return (
          <div key={group.kind} className="admin-access-group">
            <h3 className="admin-access-group-title">{group.label}</h3>
            <div className="admin-access-checkbox-list">
              {options.map((t) => (
                <label key={t.id} className="admin-access-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(t.id)}
                    onChange={() => toggle(t.id)}
                  />
                  {t.title}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {error && <div className="login-error">{error}</div>}
      {savedNotice && !error && <div className="admin-access-saved">Access updated.</div>}

      <button
        className="primary-button"
        disabled={saving}
        onClick={() => save([...selectedIds])}
      >
        {saving ? 'Saving…' : 'Save selected tests'}
      </button>
    </div>
  );
}
