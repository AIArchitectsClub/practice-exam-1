import { useState } from 'react';
import { api } from '../api';

export default function TestRunner({ test, onFinish, onExit }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const questions = test.questions;
  const q = questions[current];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isLast = current === total - 1;
  const optionLetters = Object.keys(q.options);

  function selectAnswer(letter) {
    setAnswers((prev) => ({ ...prev, [q.id]: letter }));
  }

  function goNext() {
    if (current < total - 1) setCurrent(current + 1);
  }

  function goPrev() {
    if (current > 0) setCurrent(current - 1);
  }

  async function submitTest() {
    let score = 0;
    const detail = questions.map((question) => {
      const chosen = answers[question.id];
      const correct = chosen === question.answer;
      if (correct) score += 1;
      return { ...question, chosen, correct };
    });
    setSubmitting(true);
    const answersPayload = detail.map((d) => ({ id: d.id, chosen: d.chosen ?? null, correct: d.correct }));
    try {
      await api.saveScore(test.id, score, total, answersPayload);
    } catch {
      // Saving is best-effort; still show the result even if the save failed.
    } finally {
      setSubmitting(false);
    }
    onFinish({ testId: test.id, title: test.title, score, total, detail });
  }

  return (
    <div className="test-runner">
      <div className="test-runner-topbar">
        <button className="link-button" onClick={onExit}>
          ← Back to portal
        </button>
        <div className="test-runner-title">{test.title}</div>
        <div className="progress-indicator">
          Question {current + 1} of {total} · Answered {answeredCount}/{total}
        </div>
      </div>

      <div className="question-nav">
        {questions.map((question, idx) => {
          const state =
            idx === current
              ? 'current'
              : answers[question.id]
              ? 'answered'
              : 'unanswered';
          return (
            <button
              key={question.id}
              className={`nav-dot nav-dot-${state}`}
              onClick={() => setCurrent(idx)}
              title={`Question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div className="question-card">
        <div className="question-text">
          {current + 1}. {q.question}
        </div>
        <div className="options-list">
          {optionLetters.map((letter) => {
            const selected = answers[q.id] === letter;
            return (
              <button
                key={letter}
                className={`option-item ${selected ? 'option-selected' : ''}`}
                onClick={() => selectAnswer(letter)}
              >
                <span className="option-letter">{letter}</span>
                <span className="option-text">{q.options[letter]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="test-runner-controls">
        <button className="secondary-button" onClick={goPrev} disabled={current === 0}>
          Previous
        </button>
        {!isLast && (
          <button className="secondary-button" onClick={goNext}>
            Next
          </button>
        )}
        <button className="primary-button" onClick={submitTest} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Test'}
        </button>
      </div>
    </div>
  );
}
