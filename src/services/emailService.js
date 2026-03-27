import nodemailer from "nodemailer";

function envTrim(key) {
  const v = process.env[key];
  return v != null ? String(v).trim() : "";
}

function createTransport() {
  const host = envTrim("SMTP_HOST");
  const user = envTrim("SMTP_USER");
  const pass = envTrim("SMTP_PASS");

  if (!host || !user || !pass) {
    return null;
  }

  const portRaw = envTrim("SMTP_PORT") || "587";
  let port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    port = 587;
  }

  const secure = envTrim("SMTP_SECURE").toLowerCase() === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: !secure && port === 587,
  });
}

export async function sendSignupOtpEmail(to, otp) {
  const from = envTrim("EMAIL_FROM") || envTrim("SMTP_USER");
  const transport = createTransport();

  const text = `Your verification code is: ${otp}\n\nIt expires in 15 minutes. If you didn't sign up, ignore this email.`;
  const html = `
    <p>Your verification code is:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${otp}</p>
    <p style="color:#666;">It expires in 15 minutes. If you didn't sign up, ignore this email.</p>
  `;

  if (!transport) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[email disabled] OTP for ${to}: ${otp}`);
    }
    return { sent: false };
  }

  try {
    await transport.sendMail({
      from,
      to,
      subject: "Verify your email",
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("[SMTP] sendMail failed:", err?.message || err);
    if (err?.response) {
      console.error("[SMTP] server response:", err.response);
    }
    throw err;
  }
}
