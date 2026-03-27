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
      password VARCHAR(255) NOT NULL,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      signup_otp_hash VARCHAR(255),
      signup_otp_expires_at TIMESTAMPTZ
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

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_otp_hash VARCHAR(255);
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_otp_expires_at TIMESTAMPTZ;
  `);
  // Legacy rows (created before OTP columns): no pending OTP → treat as already verified.
  await pool.query(`
    UPDATE users
    SET email_verified = TRUE
    WHERE signup_otp_hash IS NULL
      AND signup_otp_expires_at IS NULL
      AND email_verified = FALSE
      AND password IS NOT NULL;
  `);
}
