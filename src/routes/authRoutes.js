import express from "express";
import {
  signup,
  login,
  verifySignupOtp,
  resendSignupOtp,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getCurrentUser } from "../controllers/authController.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/verify-signup-otp", verifySignupOtp);
router.post("/resend-signup-otp", resendSignupOtp);
router.post("/login", login);
router.get("/me", verifyToken, getCurrentUser);

export default router;