/**
 * Email sending utility — nodemailer with optional SMTP.
 *
 * WIRING STATUS (2026-07-16): infrastructure is in place but delivery is opt-in.
 *   - If SMTP_HOST is not set in env, all functions return false and log nothing.
 *   - To enable: add SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM to .env.
 *   - Currently only used by PATCH /admin/boats/:id/status (rejection notification).
 *
 * NOT YET WIRED:
 *   - Captain booking confirmations / cancellations
 *   - Admin broadcast delivery (POST /admin/notifications/broadcast only logs to AuditLog)
 *   - Password reset emails
 *
 * To add a new email type, add a function here following the sendBoatRejectionEmail pattern.
 */
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export async function sendBoatRejectionEmail(opts: {
  to: string;
  boatTitle: string;
  rejectionReason: string;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;

  try {
    await t.sendMail({
      from: env.SMTP_FROM,
      to: opts.to,
      subject: "İlanınız Reddedildi – GetYourBoat",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">İlanınız İncelendi</h2>
          <p>Sayın kaptan,</p>
          <p><strong>${opts.boatTitle}</strong> adlı ilanınız admin ekibi tarafından incelenmiş ve reddedilmiştir.</p>
          <div style="background:#fff3f3;border-left:4px solid #e53e3e;padding:12px 16px;margin:16px 0;border-radius:4px;">
            <strong>Red Gerekçesi:</strong><br/>
            ${opts.rejectionReason}
          </div>
          <p>İlanınızı bu gerekçe doğrultusunda düzenleyip tekrar incelemeye gönderebilirsiniz.</p>
          <p style="margin-top:24px;color:#666;font-size:13px;">GetYourBoat Ekibi</p>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}
