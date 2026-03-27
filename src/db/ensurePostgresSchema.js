import { pool } from "../config/postgres.js";

/**
 * Creates core tables if missing. Safe to run on every startup (IF NOT EXISTS).
 * Render (and similar) provision an empty database — without this, auth returns 500.
 */
export async function ensurePostgresSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      PRIMARY KEY (project_id, user_id)
    );
  `);
}
