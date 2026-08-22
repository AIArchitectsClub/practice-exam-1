# Claude Certified Architect — Practice Exams

React + Vite frontend, Express + Neon Postgres backend. 7 practice tests of 25 questions
each, plus a 60-question Final Exam, sourced from `claude-certified-architect-full-175-qns.pdf`.

Accounts are provisioned by an admin — there is no public signup. Students sign in with a
username/password the admin gives them; their scores are saved per account.

## 1. Set up the database (Neon)

1. Create a free Postgres project at [neon.tech](https://neon.tech).
2. Copy the connection string from the Neon dashboard (starts with `postgresql://...`).

## 2. Configure and run the backend

```
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:
- `DATABASE_URL` — paste your Neon connection string.
- `SESSION_SECRET` — any long random string.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — credentials for the first admin login. These are
  only used once, to create the initial admin account on first startup.

```
npm run dev
```

The API listens on `http://localhost:5174` and creates the database tables (and the admin
account) automatically on startup.

## 3. Run the frontend

```
cd app
npm install
npm run dev
```

Open `http://localhost:5173`. Requests to `/api/*` are proxied to the backend.

## 4. Using it

- **Admin**: sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD` to reach the admin panel,
  where you can add or remove student accounts (username + temporary password).
- **Students**: sign in with the username/password the admin gave them, pick one of the 7
  practice tests, answer the 25 questions, and submit to see the score. Scores are saved to
  the database and shown on the portal the next time they sign in.
- **Final Exam**: a separate 60-question exam meant to simulate the real thing and gauge
  exam readiness (70%+ pass mark). There are 5 preset 60-question sets
  (`app/src/data/finalExams.json`, generated from the 175-question bank); each time a
  student starts the Final Exam, one preset is picked at random and its question order is
  shuffled, so the exam looks different each attempt without generating questions on the fly.
- **Strengths & Weaknesses**: on each student's admin detail page, answers from every
  attempt (practice tests and Final Exam alike) are aggregated by topic
  (`app/src/data/topics.json` / `topicInfo.js`) to surface strong/weak areas and suggested
  study strategies.
