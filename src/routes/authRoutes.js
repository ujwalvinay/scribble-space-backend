import express from "express";
import { signup, login } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getCurrentUser } from "../controllers/authController.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", verifyToken, getCurrentUser);

export default router;