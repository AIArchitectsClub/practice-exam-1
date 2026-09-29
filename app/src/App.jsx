import { useEffect, useState } from 'react';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import AdminNav from './components/AdminNav';
import Portal from './components/Portal';
import TestRunner from './components/TestRunner';
import Results from './components/Results';
import { api } from './api';
import { tests } from './data/testsIndex';
import { pickFinalExam } from './data/finalExamsIndex';
import { FINAL_EXAM_TEST_ID } from './data/constants';
import './App.css';

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null); // { username, role }
  const [adminSection, setAdminSection] = useState('manage'); // 'manage' | 'exams'
  const [view, setView] = useState('portal'); // 'portal' | 'test' | 'results'
  const [activeTest, setActiveTest] = useState(null); // { id, title, questions }
  const [currentResult, setCurrentResult] = useState(null);
  const [results, setResults] = useState({}); // testId -> { score, total, best }

  useEffect(() => {
    api
      .me()
      .then(async (me) => {
        if (me.username) {
          setUser(me);
          const scores = await api.getScores();
          setResults(scores);
        }
      })
      .finally(() => setAuthLoading(false));
  }, []);

  async function handleLoggedIn(loggedInUser) {
    setUser(loggedInUser);
    const scores = await api.getScores();
    setResults(scores);
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setAdminSection('manage');
    setView('portal');
    setActiveTest(null);
    setCurrentResult(null);
    setResults({});
  }

  function handleSelectTest(testId) {
    setActiveTest(tests.find((t) => t.id === testId));
    setView('test');
  }

  function handleStartFinalExam() {
    setActiveTest(pickFinalExam());
    setView('test');
  }

  async function handleFinishTest(result) {
    setCurrentResult(result);
    setResults((prev) => {
      const existingBest = prev[result.testId]?.best ?? 0;
      return {
        ...prev,
        [result.testId]: {
          score: result.score,
          total: result.total,
          best: Math.max(existingBest, result.score),
        },
      };
    });
    setView('results');
  }

  function handleRetake() {
    const isFinalExam = currentResult.testId === FINAL_EXAM_TEST_ID;
    setActiveTest(isFinalExam ? pickFinalExam() : tests.find((t) => t.id === currentResult.testId));
    setCurrentResult(null);
    setView('test');
  }

  function handleBackToPortal() {
    setActiveTest(null);
    setCurrentResult(null);
    setView('portal');
  }

  if (authLoading) {
    return <div className="app-shell" />;
  }

  if (!user) {
    return (
      <div className="app-shell">
        <Login onLoggedIn={handleLoggedIn} />
      </div>
    );
  }

  const examFlow = (
    <>
      {view === 'portal' && (
        <Portal
          onSelectTest={handleSelectTest}
          onStartFinalExam={handleStartFinalExam}
          results={results}
          username={user.username}
          onLogout={handleLogout}
          allowedTests={user.allowedTests ?? null}
        />
      )}
      {view === 'test' && activeTest && (
        <TestRunner
          key={`${activeTest.id}-${activeTest.presetId ?? ''}`}
          test={activeTest}
          onFinish={handleFinishTest}
          onExit={handleBackToPortal}
        />
      )}
      {view === 'results' && currentResult && (
        <Results
          result={currentResult}
          onRetake={handleRetake}
          onBackToPortal={handleBackToPortal}
        />
      )}
    </>
  );

  if (user.role === 'admin') {
    return (
      <div className="app-shell">
        <AdminNav section={adminSection} onChange={setAdminSection} />
        {adminSection === 'manage' ? <AdminPanel onLogout={handleLogout} /> : examFlow}
      </div>
    );
  }

  return <div className="app-shell">{examFlow}</div>;
}
