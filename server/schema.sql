CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  allowed_tests INTEGER[]
);

-- NULL means unrestricted (every test id, including the Final Exam sentinel,
-- is allowed) -- this is the default so every existing student's access is
-- unchanged by this column's introduction. A non-null array is an explicit
-- allowlist; an empty array means the student has no tests assigned yet.
ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_tests INTEGER[];

CREATE TABLE IF NOT EXISTS test_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE test_results ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);
