import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load server/.env explicitly (not cwd-relative) so `npm start` works whether
// launched from the repo root or the server/ directory. On Render, no .env
// file exists and env vars are already injected, so this is a no-op there.
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill in your Neon connection string.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function ensureSchema() {
  const sql = readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(sql);
}

export async function ensureAdminUser(hashPassword) {
  const { rows } = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (rows.length > 0) return;

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.warn(
      'No admin account exists yet, and ADMIN_USERNAME/ADMIN_PASSWORD are not set in .env. ' +
      'Set them and restart the server to create the first admin login.'
    );
    return;
  }

  const passwordHash = await hashPassword(password);
  await pool.query(
    "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin') ON CONFLICT (username) DO NOTHING",
    [username, passwordHash]
  );
  console.log(`Created initial admin account "${username}" from ADMIN_USERNAME/ADMIN_PASSWORD.`);
}
