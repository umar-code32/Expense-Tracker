import MailComposer from "nodemailer/lib/mail-composer";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// The Gmail API (REST, scoped to `gmail.send`) is used directly here rather
// than nodemailer's SMTP transport: smtp.gmail.com's AUTH XOAUTH2 requires
// the broader `https://mail.google.com/` scope, which would grant full
// mailbox access — defeating the point of a narrowly-scoped OAuth token.
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN must all be set to send verification emails."
    );
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to refresh Gmail access token (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    // Refresh a minute early so we never send with an about-to-expire token.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.accessToken;
}

function buildRawMessage(options: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    new MailComposer({
      from: `"Expense Tracker" <${options.from}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })
      .compile()
      .build((err: Error | null, message: Buffer) => {
        if (err) return reject(err);
        resolve(
          message
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "")
        );
      });
  });
}

function otpEmailHtml(otp: string): string {
  const digitCells = otp
    .split("")
    .map(
      (digit, i) =>
        (i > 0 ? '<td style="width:8px;"></td>' : "") +
        `<td style="width:40px;height:48px;text-align:center;vertical-align:middle;` +
        `font-size:24px;font-weight:700;font-family:'Courier New',monospace;color:#111827;` +
        `border:1px solid #d1d5db;border-radius:6px;">${digit}</td>`
    )
    .join("");

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
  <h1 style="color:#4f46e5;font-size:22px;margin:0 0 16px;">Expense Tracker</h1>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />
  <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 24px;">
    Please verify your email address so we know it's really you and can start tracking your expenses.
  </p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
    <tr>${digitCells}</tr>
  </table>
  <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0 0 24px;">
    This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
  </p>
  <p style="color:#374151;font-size:15px;margin:0;">Thanks,<br />Expense Tracker</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 12px;" />
  <p style="color:#9ca3af;font-size:12px;margin:0;">This is an automated message — please don't reply.</p>
</div>`.trim();
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const from = process.env.GMAIL_USER;
  if (!from) {
    throw new Error("GMAIL_USER must be set to send verification emails.");
  }

  const accessToken = await getAccessToken();
  const raw = await buildRawMessage({
    from,
    to,
    subject: "Verify your email address",
    text: `Expense Tracker\n\nPlease verify your email address so we know it's really you and can start tracking your expenses.\n\nYour verification code: ${otp}\n\nThis code expires in 10 minutes. If you didn't request this, you can safely ignore this email.\n\nThanks,\nExpense Tracker`,
    html: otpEmailHtml(otp),
  });

  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    throw new Error(`Gmail send failed (${res.status}): ${await res.text()}`);
  }
}
