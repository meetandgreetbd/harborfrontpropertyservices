import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP mailer (any provider: cPanel/hosting mailbox, Gmail/Workspace app password, Outlook, Zoho, Mailgun SMTP…).
 * Configure SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM in .env.
 * If SMTP_HOST is empty, emails are logged to the console instead (handy in development).
 */
let transporter: Transporter | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587 (STARTTLS)
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

/** Returns "sent" when delivered to the SMTP server, "logged" when SMTP isn't configured. Throws on SMTP errors. */
export async function sendMail(msg: { to: string; subject: string; text: string; replyTo?: string }): Promise<"sent" | "logged"> {
  const t = getTransporter();
  if (!t) {
    console.info(`[email] SMTP_HOST not set — would send to ${msg.to}: "${msg.subject}"\n${msg.text}`);
    return "logged";
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    ...msg,
  });
  return "sent";
}

export const smtpConfigured = () => Boolean(process.env.SMTP_HOST);
