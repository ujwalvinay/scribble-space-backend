import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import documentRoutes from "./routes/documentRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { pool } from "./config/postgres.js";

dotenv.config();

const app = express();

// ✅ VERY IMPORTANT: CORS FIRST
app.use(
  cors({
    origin: "https://scribble-space-frontend-8nbl.vercel.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Handle preflight explicitly
app.options("*", cors());

app.use(express.json());

connectDB();

// ✅ Routes AFTER CORS
app.use("/api/documents", documentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) console.error("Postgres error:", err);
  else console.log("Postgres connected:", res.rows[0]);
});