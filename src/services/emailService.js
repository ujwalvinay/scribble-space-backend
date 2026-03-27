import { Resend } from "resend";

function envTrim(key) {
  const v = process.env[key];
  return v != null ? String(v).trim() : "";
}

let resendClient = null;
function getResend() {
  const key = envTrim("RESEND_API_KEY");
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

const DEFAULT_FROM = "Scribble Space <onboarding@resend.dev>";

/** Call once at startup so Render logs show whether mail env is actually loaded. */
export function logEmailConfigAtStartup() {
  if (envTrim("RESEND_API_KEY")) {
    const k = envTrim("RESEND_API_KEY");
    console.log(`[email] Resend: RESEND_API_KEY set (${k.length} characters)`);
    console.log(`[email] From: ${envTrim("EMAIL_FROM") || DEFAULT_FROM}`);
    return;
  }
  console.warn(
    "[email] Set RESEND_API_KEY in .env / Render — https://resend.com"
  );
}

export async function sendSignupOtpEmail(to, otp) {
  const resend = getResend();
  const from = envTrim("EMAIL_FROM") || DEFAULT_FROM;

  const text = `Your verification code is: ${otp}\n\nIt expires in 15 minutes. If you didn't sign up, ignore this email.`;
  const html = `
    <p>Your verification code is:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${otp}</p>
    <p style="color:#666;">It expires in 15 minutes. If you didn't sign up, ignore this email.</p>
  `;

  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[email disabled] OTP for ${to}: ${otp}`);
    }
    return { sent: false };
  }

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: "Verify your email",
    text,
    html,
  });
  if (error) {
    console.error("[Resend] API error:", error);
    throw new Error(error.message || JSON.stringify(error));
  }
  if (data?.id) {
    console.log("[Resend] email queued:", data.id);
  }
  return { sent: true };
}
