import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ai_dev_hub",
  password: "root",
  port: 5432,
});