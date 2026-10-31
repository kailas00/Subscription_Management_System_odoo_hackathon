import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;
if (env.smtp.host) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
}

// Never throws: email failure must not break a business action (log instead).
export async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.log(`\n📧 [EMAIL — console mode]\nTo: ${to}\nSubject: ${subject}\n${text || html}\n`);
    return { delivered: false, mode: 'console' };
  }
  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, html, text });
    return { delivered: true };
  } catch (err) {
    console.error('Email failed:', err.message);
    return { delivered: false, error: err.message };
  }
}

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^https?:\/\//.test(String(u)) ? esc(u) : '#');

const shell = (title, body) => `
<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#0f172a">
  <h2 style="margin:0 0 16px;color:#0f5f59">Brightloop</h2>
  <h3 style="margin:0 0 12px">${esc(title)}</h3>${body}
  <p style="color:#64748b;font-size:12px;margin-top:32px">Brightloop Software · Automated message</p>
</div>`;

export const templates = {
  resetPassword: (name, link) => ({
    subject: 'Reset your Brightloop password',
    html: shell('Reset your password', `<p>Hi ${esc(name)},</p><p>Click below to set a new password. This link expires in 30 minutes.</p>
      <p><a href="${safeUrl(link)}" style="background:#0f5f59;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>
      <p style="font-size:12px;color:#64748b">If you didn't request this, ignore this email.</p>`),
    text: `Reset your password: ${link} (expires in 30 minutes)`,
  }),
  invoice: (inv, link) => ({
    subject: `Invoice ${inv.number} from Brightloop Software`,
    html: shell(`Invoice ${inv.number}`, `<p>Amount due: <b>${esc(inv.total)}</b> by ${esc(new Date(inv.dueDate).toDateString())}.</p>
      <p><a href="${safeUrl(link)}">View invoice</a></p>`),
    text: `Invoice ${inv.number}: ${inv.total} due ${new Date(inv.dueDate).toDateString()} — ${link}`,
  }),
};
