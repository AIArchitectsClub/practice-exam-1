import { useMemo } from 'react';
import topics from '../data/topics.json';
import { TOPICS, TOPIC_ORDER } from '../data/topicInfo';

const MIN_QUESTIONS_FOR_SIGNAL = 3;
const STRONG_THRESHOLD = 75;
const WEAK_THRESHOLD = 60;

function buildTopicMap() {
  const map = new Map();
  for (const t of topics) map.set(t.id, t.topic);
  return map;
}

export default function AdminStudentInsights({ attempts }) {
  const stats = useMemo(() => {
    const topicMap = buildTopicMap();
    const tally = {}; // topic -> { correct, total }
    let overallCorrect = 0;
    let overallTotal = 0;

    for (const attempt of attempts) {
      for (const a of attempt.answers) {
        const topic = topicMap.get(a.id);
        if (!topic) continue;
        if (!tally[topic]) tally[topic] = { correct: 0, total: 0 };
        tally[topic].total += 1;
        if (a.correct) tally[topic].correct += 1;
        overallTotal += 1;
        if (a.correct) overallCorrect += 1;
      }
    }

    const rows = TOPIC_ORDER.filter((topic) => tally[topic]).map((topic) => {
      const { correct, total } = tally[topic];
      return {
        topic,
        label: TOPICS[topic].label,
        correct,
        total,
        pct: Math.round((correct / total) * 100),
      };
    });

    const signal = rows.filter((r) => r.total >= MIN_QUESTIONS_FOR_SIGNAL);
    const strengths = signal.filter((r) => r.pct >= STRONG_THRESHOLD).sort((a, b) => b.pct - a.pct);
    const weaknesses = signal.filter((r) => r.pct < WEAK_THRESHOLD).sort((a, b) => a.pct - b.pct);

    return {
      overallPct: overallTotal ? Math.round((overallCorrect / overallTotal) * 100) : 0,
      overallTotal,
      rows,
      hasSignal: signal.length > 0,
      strengths,
      weaknesses,
    };
  }, [attempts]);

  if (stats.overallTotal === 0) {
    return <p className="progress-indicator">No answered questions yet — insights will appear after the student takes a test.</p>;
  }

  if (!stats.hasSignal) {
    return (
      <p className="progress-indicator">
        Not enough attempts yet for a reliable breakdown (need at least {MIN_QUESTIONS_FOR_SIGNAL}
        {' '}answered questions in a topic). Overall so far: {stats.overallPct}% across {stats.overallTotal} questions.
      </p>
    );
  }

  return (
    <div className="insights">
      <div className="insights-overall">
        Overall accuracy: <strong>{stats.overallPct}%</strong> across {stats.overallTotal} answered questions.
      </div>

      <div className="topic-bars">
        {stats.rows.map((r) => (
          <div key={r.topic} className="topic-bar-row">
            <span className="topic-bar-label">{r.label}</span>
            <div className="topic-bar-track">
              <div
                className={`topic-bar-fill ${r.pct >= STRONG_THRESHOLD ? 'topic-bar-strong' : r.pct < WEAK_THRESHOLD ? 'topic-bar-weak' : ''}`}
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <span className="topic-bar-pct">
              {r.pct}% ({r.correct}/{r.total})
            </span>
          </div>
        ))}
      </div>

      <div className="insights-columns">
        <div className="insights-col">
          <h3>Strengths</h3>
          {stats.strengths.length === 0 && <p className="progress-indicator">No topic yet above {STRONG_THRESHOLD}%.</p>}
          <ul className="insights-list">
            {stats.strengths.map((r) => (
              <li key={r.topic}>
                <strong>{r.label}</strong> — {r.pct}% ({r.correct}/{r.total})
              </li>
            ))}
          </ul>
        </div>

        <div className="insights-col">
          <h3>Weaknesses</h3>
          {stats.weaknesses.length === 0 && <p className="progress-indicator">No topic below {WEAK_THRESHOLD}% yet.</p>}
          <ul className="insights-list">
            {stats.weaknesses.map((r) => (
              <li key={r.topic}>
                <strong>{r.label}</strong> — {r.pct}% ({r.correct}/{r.total})
              </li>
            ))}
          </ul>
        </div>
      </div>

      {stats.weaknesses.length > 0 && (
        <div className="strategies">
          <h3>Suggested strategies to improve</h3>
          {stats.weaknesses.map((r) => (
            <div key={r.topic} className="strategy-block">
              <div className="strategy-topic">{r.label}</div>
              <ul>
                {TOPICS[r.topic].tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
