# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A practice-exam portal for the "Claude Certified Architect" certification: 7 fixed 25-question
practice tests, a 60-question Final Exam, and an admin panel for provisioning student accounts and
reviewing per-student strengths/weaknesses. React/Vite frontend (`app/`), Express/Postgres backend
(`server/`). Not a monorepo tool (no workspaces) — `app/` and `server/` are two independent npm
projects with their own `package-lock.json`/`node_modules`, orchestrated by scripts in the root
`package.json`.

## Commands

Backend needs `server/.env` first (copy from `server/.env.example`): `DATABASE_URL` (Neon Postgres,
SSL required), `SESSION_SECRET`, `ADMIN_USERNAME`/`ADMIN_PASSWORD`.

- `npm run dev:server` (or `cd server && npm run dev`) — Express with `--watch`, port 5174 (or `$PORT`).
- `npm run dev:app` (or `cd app && npm run dev`) — Vite dev server, port 5173, proxies `/api/*` to
  `localhost:5174` (see `app/vite.config.js`).
- `cd app && npm run lint` — oxlint. No lint config on the server side.
- `npm run build` (root) — builds the frontend and installs server deps; see gotcha below.
- `npm start` (root) — `node server/index.js`, serving both the API and the built frontend from one
  port. This is what Render runs; it's also how to reproduce a production build locally.
- **No test suite exists in this repo.** Neither `package.json` defines a real `test` script.

Local dev runs two servers (Vite + Express); production runs one (Express serves `app/dist`) — see
Architecture below for why the build command matters.

## Architecture

### Single-service production, two-service dev

`server/index.js` always serves the API under `/api/*`. In production it also serves the built
frontend via `express.static(app/dist)` with a regex SPA fallback (`GET /^(?!\/api\/).*/`) so
client-side routes resolve to `index.html`. In dev, the frontend runs separately under Vite (for HMR)
and reaches the API through the Vite proxy instead. Same-origin in both cases — this is deliberate,
since auth is a signed cookie and cross-origin cookies would need `SameSite=None`/CORS.

**Build gotcha**: Render sets `NODE_ENV=production` for the whole service, including the build step.
Plain `npm install` under `NODE_ENV=production` skips `devDependencies` — and Vite is a devDependency
of `app/`. That's why the root `build` script explicitly runs
`npm install --include=dev --prefix app`. Don't "simplify" that away.

### Auth: no self-signup, admin-provisioned only

Students never register themselves. `server/db.js`'s `ensureAdminUser()` runs on every boot and
creates exactly one admin from `ADMIN_USERNAME`/`ADMIN_PASSWORD` — but only if no `role = 'admin'` row
exists yet, so those env vars are safe to leave set permanently (no-op after the first admin exists).
Admins create student username/password pairs via `/api/admin/users`. Sessions are a single signed
httpOnly cookie (`uid`, via `cookie-parser` + `SESSION_SECRET`) holding the user id — no JWT, no
sessions table. Passwords are bcrypt (`server/auth.js`).

### Question data and the Final Exam preset system

The 175-question bank is split into 7 fixed practice tests (`app/src/data/test1.json`...`test7.json`,
25 questions each, in original source order). The Final Exam is *not* generated at request time:
`app/src/data/finalExams.json` holds 5 pre-built 60-question presets (random samples of the 175,
generated once offline). `finalExamsIndex.js`'s `pickFinalExam()` picks one preset at random per
attempt and shuffles its question order client-side — so "random every launch" only means preset
selection + ordering, not new question generation.

`FINAL_EXAM_TEST_ID = 999` (`app/src/data/constants.js`) is the sentinel `test_id` that lets Final
Exam attempts share the `test_results` table and `/api/scores` endpoints with practice tests
(1-7, plus 8-12 below) without a schema change. **This constant is duplicated in `server/index.js`**
(no shared module between client and server) — keep both in sync if it ever changes.

### Section-focused practice exams (test_id 8-12)

Alongside the 7 sequential practice tests, `app/src/data/testsIndex.js` also registers 5
section-focused exams (`test_id` 8-12, `kind: 'section'` vs. the sequential tests' `kind:
'sequential'`) — one per exam-blueprint section (Agentic Architecture & Orchestration, Tool Design
& MCP Integration, Claude Code Configuration & Workflows, Prompt Engineering & Structured Output,
Context Management & Reliability). Each draws only the questions belonging to that section from the
same 175-question bank, per `app/src/data/examSections.json` (`[{id, section}]`, one entry per
question id 1-175) — a second, independent classification of the same ids alongside the 10-topic
`topics.json` used for admin analytics; don't conflate the two. The per-section question files
(`sectionAgenticOrchestration.json` etc.) are not fixed-length like `test1-7.json` — they vary with
how many questions the source PDF assigned to each section. `Portal.jsx` renders sequential and
section exams as two separate grids using the `kind` field. `server/index.js`'s `isValidTestId`
check was widened from `1-7` to `1-12` to accept scores for these; there's no DB schema change since
`test_id` is a plain unconstrained integer column.

### Strengths/weaknesses aggregation crosses tests

`app/src/data/topics.json` maps every question id (1-175) to one of 10 fixed topic keys defined in
`topicInfo.js`. `AdminStudentInsights.jsx` aggregates a student's answers (stored as a JSONB array in
`test_results.answers`, shape `{id, chosen, correct}`) across *every* attempt — practice tests and
Final Exam alike — by topic, regardless of which test/preset a question came from. This is also why
`AdminStudentDetail.jsx` resolves a question by id via a flattened map built from all 7 practice
tests (`test1`-`test7` together cover ids 1-175) rather than by looking up the specific test/preset an
attempt used.

### One React app, two roles

`App.jsx` branches on `user.role`. Students go straight into the exam flow
(`Portal` → `TestRunner` → `Results`). Admins get an `AdminNav` switcher between "Manage Students"
(`AdminPanel` / `AdminStudentDetail` / `AdminStudentInsights`) and "Take Practice Exams" — the exact
same `Portal`/`TestRunner`/`Results` components, so an admin can take exams under their own account.
`GET /api/admin/users` filters to `role = 'student'`, so an admin's own attempts never appear in the
student roster.

### Database

No ORM, no migration tool. `server/db.js`'s `ensureSchema()` just runs `server/schema.sql`
(`CREATE TABLE IF NOT EXISTS` + an idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) on every
startup. `GET /api/scores` uses `DISTINCT ON` + a window function to return, per `test_id`, the most
recent attempt's score alongside the best score ever achieved for that `test_id`.

### Per-student test access control

`users.allowed_tests` (`INTEGER[]`, nullable) restricts which `test_id`s a student may see/attempt.
`NULL` means unrestricted (every current and future test id) — this is the default for every existing
row and every newly-created student, so introducing this column changed nobody's access. Admins are
always treated as unrestricted regardless of their own `allowed_tests` value
(`effectiveAllowedTests()` in `server/index.js`). `/api/login` and `/api/me` both return the caller's
effective `allowedTests`; `Portal.jsx` filters the test grids and the Final Exam card against it.
Enforcement isn't just cosmetic: `POST /api/scores` independently checks `canAccessTest()` server-side
and 403s a disallowed `test_id`, so hiding a button isn't the only thing stopping a revoked test from
being recorded. Note this does **not** hide question content itself — all question JSON ships in the
client bundle regardless of access (see "Question data" above), so access control governs what a
student can navigate to and get credit for, not what's technically downloadable from the bundle.
Admins manage this per-student from `AdminStudentDetail.jsx`'s "Test Access" tab
(`AdminStudentAccess.jsx`), via `PUT /api/admin/users/:id/access` (`{ allowedTests: null | number[] }`).

### Deployment

`render.yaml` defines a single Render web service (see the build gotcha above). Env vars needed:
`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NODE_ENV=production`.
