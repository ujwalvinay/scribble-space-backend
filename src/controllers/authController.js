import { pool } from "../config/postgres.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendSignupOtpEmail } from "../services/emailService.js";

const OTP_EXPIRY_MS = 15 * 60 * 1000;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function assignSignupOtp(email, plainOtp) {
  const otpHash = await bcrypt.hash(plainOtp, 8);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  await pool.query(
    `UPDATE users
     SET signup_otp_hash = $1, signup_otp_expires_at = $2
     WHERE email = $3`,
    [otpHash, expiresAt, email]
  );
  await sendSignupOtpEmail(email, plainOtp);
}

// Signup — creates unverified user and emails OTP
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const plainOtp = generateOtp();

    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      trimmedEmail,
    ]);

    if (existing.rows.length > 0) {
      const ex = existing.rows[0];
      if (ex.email_verified) {
        return res.status(409).json({ error: "Email already registered" });
      }
      await pool.query(
        `UPDATE users SET password = $1 WHERE id = $2`,
        [hashedPassword, ex.id]
      );
      await assignSignupOtp(trimmedEmail, plainOtp);
      return res.status(200).json({
        message: "Verification code sent",
        email: trimmedEmail,
      });
    }

    const otpHash = await bcrypt.hash(plainOtp, 8);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await pool.query(
      `INSERT INTO users (email, password, email_verified, signup_otp_hash, signup_otp_expires_at)
       VALUES ($1, $2, FALSE, $3, $4)`,
      [trimmedEmail, hashedPassword, otpHash, expiresAt]
    );

    await sendSignupOtpEmail(trimmedEmail, plainOtp);

    return res.status(201).json({
      message: "Verification code sent",
      email: trimmedEmail,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and code required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      trimmedEmail,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: "Already verified" });
    }

    if (!user.signup_otp_hash || !user.signup_otp_expires_at) {
      return res.status(400).json({ error: "No verification pending" });
    }

    if (new Date() > new Date(user.signup_otp_expires_at)) {
      return res.status(400).json({ error: "Code expired" });
    }

    const match = await bcrypt.compare(String(otp).trim(), user.signup_otp_hash);
    if (!match) {
      return res.status(400).json({ error: "Invalid code" });
    }

    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           signup_otp_hash = NULL,
           signup_otp_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      message: "Verification successful",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      trimmedEmail,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    if (user.email_verified) {
      return res.status(400).json({ error: "Already verified" });
    }

    const plainOtp = generateOtp();
    await assignSignupOtp(trimmedEmail, plainOtp);

    res.json({ message: "Verification code sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: "Please verify your email first",
        needsVerification: true,
        email: user.email,
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
