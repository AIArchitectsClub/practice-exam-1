import { tests } from '../data/testsIndex';
import { FINAL_EXAM_TEST_ID, FINAL_EXAM_PASS_PCT } from '../data/constants';

function TestGrid({ list, onSelectTest, results }) {
  return (
    <div className="test-grid">
      {list.map((t) => {
        const prevResult = results[t.id];
        return (
          <button
            key={t.id}
            className="test-button"
            onClick={() => onSelectTest(t.id)}
          >
            <span className="test-button-title">{t.title}</span>
            <span className="test-button-meta">{t.questions.length} questions</span>
            {prevResult && (
              <span className="test-button-score">
                Last score: {prevResult.score}/{prevResult.total}
                {prevResult.best > prevResult.score ? ` (best: ${prevResult.best})` : ''}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function Portal({ onSelectTest, onStartFinalExam, results, username, onLogout }) {
  const finalExamResult = results[FINAL_EXAM_TEST_ID];
  const sequentialTests = tests.filter((t) => t.kind === 'sequential');
  const sectionTests = tests.filter((t) => t.kind === 'section');

  return (
    <div className="portal">
      <div className="portal-topbar">
        <span>Signed in as <strong>{username}</strong></span>
        <button className="link-button" onClick={onLogout}>
          Sign out
        </button>
      </div>
      <header className="portal-header">
        <h1>Claude Certified Architect — Practice Exams</h1>
        <p>Choose a practice test to begin.</p>
      </header>

      <h2 className="portal-group-title">Sequential Practice Tests</h2>
      <p className="portal-group-subtitle">
        25 questions each, drawn in original source order across the full question bank.
      </p>
      <TestGrid list={sequentialTests} onSelectTest={onSelectTest} results={results} />

      <h2 className="portal-group-title">Section-Focused Practice Exams</h2>
      <p className="portal-group-subtitle">
        One exam per exam-blueprint section, covering only that section's questions.
      </p>
      <TestGrid list={sectionTests} onSelectTest={onSelectTest} results={results} />

      <div className="final-exam-card">
        <div className="final-exam-info">
          <h2>Final Exam</h2>
          <p>
            60 questions drawn from the full question bank, simulating the real exam. Score{' '}
            {FINAL_EXAM_PASS_PCT}%+ to be considered ready to sit the real thing. A different
            question set is served each time you launch it.
          </p>
          {finalExamResult && (
            <p className="final-exam-last-score">
              Last attempt: {finalExamResult.score}/{finalExamResult.total}
              {finalExamResult.best > finalExamResult.score ? ` (best: ${finalExamResult.best})` : ''}
            </p>
          )}
        </div>
        <button className="primary-button final-exam-button" onClick={onStartFinalExam}>
          Start Final Exam
        </button>
      </div>
    </div>
  );
}
