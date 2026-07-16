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
import { prisma } from "@getyourboat/database";
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

export async function sendBoatApprovalEmail(opts: {
  to: string;
  boatTitle: string;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;

  try {
    await t.sendMail({
      from: env.SMTP_FROM,
      to: opts.to,
      subject: "İlanınız Onaylandı – GetYourBoat",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">İlanınız Yayında! 🎉</h2>
          <p>Sayın kaptan,</p>
          <p><strong>${opts.boatTitle}</strong> adlı ilanınız admin ekibi tarafından incelenmiş ve onaylanmıştır.</p>
          <div style="background:#f0fff4;border-left:4px solid #38a169;padding:12px 16px;margin:16px 0;border-radius:4px;">
            İlanınız artık platformda yayında ve misafirler tarafından rezervasyon yapılabilir.
          </div>
          <p style="margin-top:24px;color:#666;font-size:13px;">GetYourBoat Ekibi</p>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}

// Triggered by POST /admin/users/guests/:id/reset-password.
// The captain app must handle /reset-password?token=xxx to complete the flow.
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  token: string;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;

  const resetUrl = `${env.CAPTAIN_APP_URL}/reset-password?token=${opts.token}`;

  try {
    await t.sendMail({
      from: env.SMTP_FROM,
      to: opts.to,
      subject: "Şifre Sıfırlama – GetYourBoat",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">Şifre Sıfırlama</h2>
          <p>Merhaba ${opts.name},</p>
          <p>Hesabınız için bir şifre sıfırlama talebi alındı. Aşağıdaki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${resetUrl}" style="background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
              Şifremi Sıfırla
            </a>
          </div>
          <p style="color:#666;font-size:13px;">Bu bağlantı 24 saat geçerlidir. Eğer bu talebi siz yapmadıysanız bu e-postayı dikkate almayınız.</p>
          <p style="margin-top:24px;color:#666;font-size:13px;">GetYourBoat Ekibi</p>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}

// Sends notification to all active admin users when a boat is submitted for review.
// Queries admin emails from DB so no env var config needed — all active admins are notified.
export async function sendModeratorNewListingEmail(opts: {
  boatId: string;
  boatTitle: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;

  try {
    const admins = await prisma.adminUser.findMany({
      where: { isActive: true },
      select: { email: true },
    });
    if (admins.length === 0) return false;

    const to = admins.map((a) => a.email).join(", ");
    await t.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: "Yeni İlan İnceleme Bekliyor – GetYourBoat",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">Yeni İlan: İnceleme Gerekiyor</h2>
          <p>Aşağıdaki ilan inceleme için gönderilmiştir.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:6px 0;color:#666;width:130px;">İlan Başlığı</td><td style="padding:6px 0;font-weight:600;">${opts.boatTitle ?? "(isimsiz)"}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Kaptan</td><td style="padding:6px 0;">${opts.ownerName ?? "—"} (${opts.ownerEmail ?? "—"})</td></tr>
            <tr><td style="padding:6px 0;color:#666;">İlan ID</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${opts.boatId}</td></tr>
          </table>
          <p style="margin-top:24px;color:#666;font-size:13px;">GetYourBoat Admin Paneli</p>
        </div>
      `,
    });
    return true;
  } catch {
    return false;
  }
}
