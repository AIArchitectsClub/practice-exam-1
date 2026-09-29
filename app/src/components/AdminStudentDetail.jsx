import { useEffect, useState } from 'react';
import { api } from '../api';
import { tests } from '../data/testsIndex';
import { FINAL_EXAM_TEST_ID } from '../data/constants';
import AdminStudentInsights from './AdminStudentInsights';
import AdminStudentAccess from './AdminStudentAccess';

// The 7 sequential practice tests together partition the full 175-question bank, so any
// question id (including ones served in a final exam preset or a section-focused exam,
// which reuse the same ids) can be found here.
const questionsById = new Map(tests.flatMap((t) => t.questions).map((q) => [q.id, q]));

function testTitle(testId) {
  if (testId === FINAL_EXAM_TEST_ID) return 'Final Exam';
  return tests.find((t) => t.id === testId)?.title ?? `Test ${testId}`;
}

function findQuestion(questionId) {
  return questionsById.get(questionId);
}

export default function AdminStudentDetail({ studentId, onBack }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [tab, setTab] = useState(null); // 'insights' | 'attempts' | 'access'

  useEffect(() => {
    setLoading(true);
    api
      .adminGetStudent(studentId)
      .then(setStudent)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <p className="progress-indicator">Loading…</p>;
  if (error) return <p className="login-error">{error}</p>;
  if (!student) return null;

  const totalAttempts = student.attempts.length;
  const practiceAttempts = student.attempts.filter((a) => a.testId !== FINAL_EXAM_TEST_ID);
  const finalExamAttempts = student.attempts.filter((a) => a.testId === FINAL_EXAM_TEST_ID);
  const testsAttempted = new Set(practiceAttempts.map((a) => a.testId)).size;
  const avgPct = totalAttempts
    ? Math.round(
        (student.attempts.reduce((sum, a) => sum + a.score / a.total, 0) / totalAttempts) * 100
      )
    : 0;
  const lastFinalExam = finalExamAttempts[0]; // attempts are sorted newest-first
  const bestFinalExamScore = finalExamAttempts.length
    ? Math.max(...finalExamAttempts.map((a) => a.score))
    : null;
  const activeTab = tab ?? (totalAttempts === 0 ? 'access' : 'insights');

  return (
    <div className="admin-student-detail">
      <div className="test-runner-topbar">
        <button className="link-button" onClick={onBack}>
          ← Back to students
        </button>
        <div className="test-runner-title">{student.username}</div>
        <div className="progress-indicator">
          {totalAttempts} attempt{totalAttempts === 1 ? '' : 's'} · {testsAttempted}/{tests.length} tests tried
          {totalAttempts > 0 ? ` · avg ${avgPct}%` : ''}
        </div>
      </div>

      {lastFinalExam && (
        <div className="final-exam-summary">
          <strong>Final Exam:</strong> last {lastFinalExam.score}/{lastFinalExam.total} (
          {Math.round((lastFinalExam.score / lastFinalExam.total) * 100)}%)
          {bestFinalExamScore > lastFinalExam.score
            ? `, best ${bestFinalExamScore}/${lastFinalExam.total}`
            : ''}{' '}
          across {finalExamAttempts.length} attempt{finalExamAttempts.length === 1 ? '' : 's'}
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'insights' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('insights')}
        >
          Strengths &amp; Weaknesses
        </button>
        <button
          className={`admin-tab ${activeTab === 'attempts' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('attempts')}
        >
          Attempts
        </button>
        <button
          className={`admin-tab ${activeTab === 'access' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('access')}
        >
          Test Access
        </button>
      </div>

      {activeTab === 'insights' &&
        (totalAttempts > 0 ? (
          <AdminStudentInsights attempts={student.attempts} />
        ) : (
          <p className="progress-indicator">No attempts yet.</p>
        ))}

      {activeTab === 'access' && (
        <AdminStudentAccess
          studentId={student.id}
          allowedTests={student.allowedTests}
          onSaved={(allowedTests) => setStudent((s) => ({ ...s, allowedTests }))}
        />
      )}

      {activeTab === 'attempts' && totalAttempts === 0 && (
        <p className="progress-indicator">No attempts yet.</p>
      )}

      {activeTab === 'attempts' && totalAttempts > 0 && (
      <div className="attempt-list">
        {student.attempts.map((attempt) => {
          const pct = Math.round((attempt.score / attempt.total) * 100);
          const isOpen = expandedAttempt === attempt.id;
          return (
            <div key={attempt.id} className="attempt-card">
              <button
                className="attempt-summary-row"
                onClick={() => setExpandedAttempt(isOpen ? null : attempt.id)}
              >
                <span className="attempt-test-title">{testTitle(attempt.testId)}</span>
                <span className="attempt-score">
                  {attempt.score}/{attempt.total} ({pct}%)
                </span>
                <span className="attempt-date">{new Date(attempt.takenAt).toLocaleString()}</span>
                <span className="attempt-toggle">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="review-list attempt-review">
                  {attempt.answers.map((a, idx) => {
                    const q = findQuestion(a.id);
                    if (!q) return null;
                    return (
                      <div
                        key={a.id}
                        className={`review-item ${a.correct ? 'review-correct' : 'review-incorrect'}`}
                      >
                        <div className="review-question">
                          {idx + 1}. {q.question}
                        </div>
                        <div className="review-options">
                          {Object.keys(q.options).map((letter) => {
                            const isCorrectAnswer = letter === q.answer;
                            const isChosen = letter === a.chosen;
                            let cls = 'review-option';
                            if (isCorrectAnswer) cls += ' review-option-correct';
                            if (isChosen && !isCorrectAnswer) cls += ' review-option-wrong';
                            return (
                              <div key={letter} className={cls}>
                                <span className="option-letter">{letter}</span>
                                <span className="option-text">{q.options[letter]}</span>
                                {isChosen && <span className="tag">Student's answer</span>}
                                {isCorrectAnswer && <span className="tag tag-correct">Correct answer</span>}
                              </div>
                            );
                          })}
                        </div>
                        {!a.chosen && <div className="review-note">Not answered</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
