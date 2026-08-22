import { useState } from 'react';
import { FINAL_EXAM_TEST_ID, FINAL_EXAM_PASS_PCT } from '../data/constants';

export default function Results({ result, onRetake, onBackToPortal }) {
  const [showReview, setShowReview] = useState(false);
  const isFinalExam = result.testId === FINAL_EXAM_TEST_ID;
  const pct = Math.round((result.score / result.total) * 100);
  const passed = pct >= FINAL_EXAM_PASS_PCT;

  return (
    <div className="results">
      <div className="results-summary-card">
        <h2>{result.title} — Results</h2>
        <div className={`score-badge ${passed ? 'score-pass' : 'score-fail'}`}>
          {result.score} / {result.total}
        </div>
        <div className="score-pct">{pct}%</div>
        <div className={`score-verdict ${passed ? 'score-pass-text' : 'score-fail-text'}`}>
          {isFinalExam
            ? passed
              ? `You're likely ready for the real exam (${FINAL_EXAM_PASS_PCT}%+ pass mark)`
              : `Keep practicing before the real exam (below ${FINAL_EXAM_PASS_PCT}% pass mark)`
            : passed
            ? `Passed (${FINAL_EXAM_PASS_PCT}% pass mark)`
            : `Not passed (${FINAL_EXAM_PASS_PCT}% pass mark)`}
        </div>
        <div className="results-actions">
          <button className="secondary-button" onClick={() => setShowReview((s) => !s)}>
            {showReview ? 'Hide review' : 'Review answers'}
          </button>
          <button className="secondary-button" onClick={onRetake}>
            Retake test
          </button>
          <button className="primary-button" onClick={onBackToPortal}>
            Back to portal
          </button>
        </div>
      </div>

      {showReview && (
        <div className="review-list">
          {result.detail.map((q, idx) => (
            <div
              key={q.id}
              className={`review-item ${q.correct ? 'review-correct' : 'review-incorrect'}`}
            >
              <div className="review-question">
                {idx + 1}. {q.question}
              </div>
              <div className="review-options">
                {Object.keys(q.options).map((letter) => {
                  const isCorrectAnswer = letter === q.answer;
                  const isChosen = letter === q.chosen;
                  let cls = 'review-option';
                  if (isCorrectAnswer) cls += ' review-option-correct';
                  if (isChosen && !isCorrectAnswer) cls += ' review-option-wrong';
                  return (
                    <div key={letter} className={cls}>
                      <span className="option-letter">{letter}</span>
                      <span className="option-text">{q.options[letter]}</span>
                      {isChosen && <span className="tag">Your answer</span>}
                      {isCorrectAnswer && <span className="tag tag-correct">Correct answer</span>}
                    </div>
                  );
                })}
              </div>
              {!q.chosen && <div className="review-note">Not answered</div>}
              {q.explanation && (
                <details className="explanation">
                  <summary>Explanation</summary>
                  <pre>{q.explanation}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
