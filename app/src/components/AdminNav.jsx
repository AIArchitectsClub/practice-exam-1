export default function AdminNav({ section, onChange }) {
  return (
    <div className="admin-nav">
      <button
        className={`admin-nav-tab ${section === 'manage' ? 'admin-nav-tab-active' : ''}`}
        onClick={() => onChange('manage')}
      >
        Manage Students
      </button>
      <button
        className={`admin-nav-tab ${section === 'exams' ? 'admin-nav-tab-active' : ''}`}
        onClick={() => onChange('exams')}
      >
        Take Practice Exams
      </button>
    </div>
  );
}
