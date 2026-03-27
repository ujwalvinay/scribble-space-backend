import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendSignupOtpEmail(to, otp) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
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

  await transport.sendMail({
    from,
    to,
    subject: "Verify your email",
    text,
    html,
  });

  return { sent: true };
}
