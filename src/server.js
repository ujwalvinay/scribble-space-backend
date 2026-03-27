import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import documentRoutes from "./routes/documentRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { pool } from "./config/postgres.js";
import { ensurePostgresSchema } from "./db/ensurePostgresSchema.js";

dotenv.config();

const app = express();

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://scribble-space-frontend-8nbl.vercel.app",
];

function getCorsOrigins() {
  const extra = process.env.FRONTEND_URL?.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (!extra?.length) return DEFAULT_CORS_ORIGINS;
  return [...new Set([...DEFAULT_CORS_ORIGINS, ...extra])];
}

app.use(
  cors({
    origin(origin, callback) {
      const allowed = getCorsOrigins();
      if (!origin) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

connectDB();

// ✅ Routes AFTER CORS
app.use("/api/documents", documentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

async function start() {
  try {
    console.log("Ensuring Postgres tables exist (create if missing)...");
    await ensurePostgresSchema();
    console.log("Postgres schema ready");
  } catch (err) {
    console.error("Postgres schema init failed:", err);
    process.exit(1);
  }

  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  pool.query("SELECT NOW()", (err, res) => {
    if (err) console.error("Postgres error:", err);
    else console.log("Postgres connected:", res.rows[0]);
  });
}

start();