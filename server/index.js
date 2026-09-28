import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, ensureSchema, ensureAdminUser } from './db.js';
import { hashPassword, verifyPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = path.join(__dirname, '..', 'app', 'dist');

const app = express();
const PORT = process.env.PORT || 5174;
const COOKIE_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const USERNAME_RE = /^[a-zA-Z0-9_-]{2,32}$/;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// Must match FINAL_EXAM_TEST_ID in app/src/data/constants.js
const FINAL_EXAM_TEST_ID = 999;

app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));

function getUserId(req) {
  const raw = req.signedCookies.uid;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

async function requireAuth(req, res, next) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  const { rows } = await pool.query('SELECT id, username, role FROM users WHERE id = $1', [userId]);
  if (!rows[0]) return res.status(401).json({ error: 'Not logged in' });
  req.user = rows[0];
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

function setSessionCookie(res, userId) {
  res.cookie('uid', String(userId), {
    signed: true,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: THIRTY_DAYS_MS,
  });
}

app.post('/api/login', async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const { rows } = await pool.query('SELECT id, username, password_hash, role FROM users WHERE username = $1', [
    username,
  ]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

  setSessionCookie(res, user.id);
  res.json({ username: user.username, role: user.role });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('uid');
  res.json({ ok: true });
});

app.get('/api/me', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.json({ username: null, role: null });
  const { rows } = await pool.query('SELECT username, role FROM users WHERE id = $1', [userId]);
  if (!rows[0]) return res.json({ username: null, role: null });
  res.json({ username: rows[0].username, role: rows[0].role });
});

app.get('/api/scores', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (test_id) test_id, score, total,
       MAX(score) OVER (PARTITION BY test_id) AS best_score
     FROM test_results
     WHERE user_id = $1
     ORDER BY test_id, taken_at DESC`,
    [req.user.id]
  );
  const scores = {};
  for (const row of rows) {
    scores[row.test_id] = {
      score: row.score,
      total: row.total,
      best: row.best_score,
    };
  }
  res.json(scores);
});

app.post('/api/scores', requireAuth, async (req, res) => {
  const testId = Number(req.body?.testId);
  const score = Number(req.body?.score);
  const total = Number(req.body?.total);
  const answersInput = req.body?.answers;
  // 1-7: sequential practice tests. 8-12: section-focused practice exams.
  const isValidTestId = (testId >= 1 && testId <= 12) || testId === FINAL_EXAM_TEST_ID;
  if (
    !isValidTestId ||
    !Number.isInteger(score) || score < 0 ||
    !Number.isInteger(total) || total <= 0 ||
    score > total ||
    !Array.isArray(answersInput)
  ) {
    return res.status(400).json({ error: 'Invalid score payload' });
  }
  const answers = answersInput
    .filter((a) => a && Number.isInteger(a.id))
    .map((a) => ({
      id: a.id,
      chosen: typeof a.chosen === 'string' ? a.chosen : null,
      correct: Boolean(a.correct),
    }));
  await pool.query(
    'INSERT INTO test_results (user_id, test_id, score, total, answers) VALUES ($1, $2, $3, $4, $5)',
    [req.user.id, testId, score, total, JSON.stringify(answers)]
  );
  res.json({ ok: true });
});

// --- Admin: manage student accounts ---

app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.role, u.created_at,
       COALESCE(COUNT(t.id), 0)::int AS attempts
     FROM users u
     LEFT JOIN test_results t ON t.user_id = u.id
     WHERE u.role = 'student'
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  res.json(rows);
});

app.post('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({
      error: 'Username must be 2-32 characters: letters, numbers, underscore, hyphen only.',
    });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'student') RETURNING id, username, role, created_at",
    [username, passwordHash]
  );
  res.status(201).json(rows[0]);
});

app.get('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user id' });

  const userRes = await pool.query(
    "SELECT id, username, created_at FROM users WHERE id = $1 AND role = 'student'",
    [id]
  );
  const student = userRes.rows[0];
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const attemptsRes = await pool.query(
    `SELECT id, test_id, score, total, answers, taken_at
     FROM test_results
     WHERE user_id = $1
     ORDER BY taken_at DESC`,
    [id]
  );

  res.json({
    id: student.id,
    username: student.username,
    createdAt: student.created_at,
    attempts: attemptsRes.rows.map((r) => ({
      id: r.id,
      testId: r.test_id,
      score: r.score,
      total: r.total,
      answers: r.answers,
      takenAt: r.taken_at,
    })),
  });
});

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user id' });
  await pool.query("DELETE FROM users WHERE id = $1 AND role = 'student'", [id]);
  res.json({ ok: true });
});

// Serve the built React app (app/dist) in production. Any non-API route falls
// back to index.html so client-side state (login, portal, test, results) renders.
app.use(express.static(STATIC_DIR));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

ensureSchema()
  .then(() => ensureAdminUser(hashPassword))
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
