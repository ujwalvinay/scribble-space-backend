import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import documentRoutes from "./routes/documentRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import { pool } from "./config/postgres.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// ✅ CORS FIX
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://scribble-space-frontend-8nbl.vercel.app/",
    ],
    credentials: true,
  })
);

app.use(express.json());

connectDB();

app.use("/api/documents", documentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Postgres error:", err);
  } else {
    console.log("Postgres connected:", res.rows[0]);
  }
});