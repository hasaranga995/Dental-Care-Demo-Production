import "server-only";
import { Resend } from "resend";
import { CLINIC } from "./clinic-config";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes("xxxxxxxx")) return null;
  resendClient = new Resend(apiKey);
  return resendClient;
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? `${CLINIC.name} <onboarding@resend.dev>`;
}

function emailShell(bodyHtml: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${CLINIC.name}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f4f7f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,42,67,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#0D4F5C,#5EC8C0);padding:28px 32px;">
                <p style="margin:0;color:#5EC8C0;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">${CLINIC.name}</p>
                <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:600;">${CLINIC.tagline}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1E293B;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f4f7f9;border-top:1px solid #e5eaee;">
                <p style="margin:0;color:#5a6472;font-size:12px;">${CLINIC.legalName} · ${CLINIC.address.line1}, ${CLINIC.address.city}</p>
                <p style="margin:4px 0 0;color:#5a6472;font-size:12px;">Emergency line: ${CLINIC.emergencyPhone} · ${CLINIC.email}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export interface AppointmentConfirmationEmailData {
  patientName: string;
  patientEmail: string;
  serviceName: string;
  doctorName: string;
  appointmentDate: Date;
  status: string;
  notes?: string;
}

export async function sendAppointmentConfirmationEmail(
  data: AppointmentConfirmationEmailData
): Promise<{ sent: boolean; id?: string }> {
  const client = getResendClient();

  const formattedDate = data.appointmentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = data.appointmentDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#0D4F5C;">Hi ${escapeHtml(data.patientName)}, your appointment is ${escapeHtml(data.status)}! 🦷</p>
    <p style="margin:0 0 20px;">Thank you for booking with ${CLINIC.name}. Here are your appointment details:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f6fa;border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;"><strong>Service:</strong> ${escapeHtml(data.serviceName)}</p>
        <p style="margin:0 0 8px;"><strong>Doctor:</strong> ${escapeHtml(data.doctorName)}</p>
        <p style="margin:0 0 8px;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin:0;"><strong>Time:</strong> ${formattedTime}</p>
      </td></tr>
    </table>
    ${data.notes ? `<p style="margin:20px 0 0;color:#5a6472;"><strong>Notes:</strong> ${escapeHtml(data.notes)}</p>` : ""}
    <p style="margin:24px 0 0;">Please arrive 10 minutes early. If you need to reschedule or cancel, you can manage your appointment anytime from your patient dashboard.</p>
    <p style="margin:20px 0 0;">Questions? Call our front desk at <a href="tel:${CLINIC.phoneRaw}" style="color:#5EC8C0;font-weight:600;">${CLINIC.phone}</a>.</p>
  `;

  const html = emailShell(bodyHtml, `Your appointment for ${data.serviceName} is ${data.status}.`);

  if (!client) {
    console.warn(
      `[resend] RESEND_API_KEY not configured — skipping email send for ${data.patientEmail}.`
    );
    return { sent: false };
  }

  const { data: result, error } = await client.emails.send({
    from: getFromAddress(),
    to: data.patientEmail,
    subject: `${CLINIC.name} · Appointment ${data.status} for ${formattedDate}`,
    html,
  });

  if (error) {
    console.error("[resend] Failed to send appointment email:", error);
    return { sent: false };
  }

  return { sent: true, id: result?.id };
}

export interface ContactFormEmailData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  preferredChannel?: string;
}

export async function sendContactFormNotification(
  data: ContactFormEmailData
): Promise<{ sent: boolean; id?: string }> {
  const client = getResendClient();
  const notifyEmail = process.env.CLINIC_NOTIFICATION_EMAIL ?? CLINIC.email;

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#0D4F5C;">New contact form submission</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f6fa;border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        <p style="margin:0 0 8px;"><strong>Preferred reply:</strong> ${escapeHtml(data.preferredChannel ?? "email")}</p>
        <p style="margin:0;"><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
  `;

  const html = emailShell(bodyHtml, `New message from ${data.name}: ${data.subject}`);

  if (!client) {
    console.warn("[resend] RESEND_API_KEY not configured — skipping contact form email.");
    return { sent: false };
  }

  const { data: result, error } = await client.emails.send({
    from: getFromAddress(),
    to: notifyEmail,
    replyTo: data.email,
    subject: `[Contact Form] ${data.subject}`,
    html,
  });

  if (error) {
    console.error("[resend] Failed to send contact form email:", error);
    return { sent: false };
  }

  return { sent: true, id: result?.id };
}

export interface SupportTicketEmailData {
  reference: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  reporterName: string;
  reporterEmail: string;
  responseSla: string;
  resolutionSla: string;
  hoursNote: string;
  ticketUrl: string;
}

/**
 * Notifies the vendor / support inbox when a clinic admin raises a ticket.
 * Uses SUPPORT_NOTIFICATION_EMAIL when set, otherwise CLINIC_NOTIFICATION_EMAIL.
 */
export async function sendSupportTicketNotification(
  data: SupportTicketEmailData
): Promise<{ sent: boolean; id?: string }> {
  const client = getResendClient();
  const notifyEmail =
    process.env.SUPPORT_NOTIFICATION_EMAIL?.trim() ||
    process.env.CLINIC_NOTIFICATION_EMAIL?.trim() ||
    CLINIC.email;

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#0D4F5C;">
      New support ticket ${escapeHtml(data.reference)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f6fa;border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;"><strong>Priority:</strong> ${escapeHtml(data.priority)}</p>
        <p style="margin:0 0 8px;"><strong>Area:</strong> ${escapeHtml(data.category)}</p>
        <p style="margin:0 0 8px;"><strong>Title:</strong> ${escapeHtml(data.title)}</p>
        <p style="margin:0 0 8px;"><strong>Reporter:</strong> ${escapeHtml(data.reporterName)} &lt;${escapeHtml(data.reporterEmail)}&gt;</p>
        <p style="margin:0 0 8px;"><strong>Initial response SLA:</strong> ${escapeHtml(data.responseSla)} (${escapeHtml(data.hoursNote)})</p>
        <p style="margin:0;"><strong>Target resolution SLA:</strong> ${escapeHtml(data.resolutionSla)}</p>
      </td></tr>
    </table>
    <p style="margin:20px 0 0;white-space:pre-wrap;">${escapeHtml(data.description)}</p>
    <p style="margin:24px 0 0;">
      <a href="${escapeHtml(data.ticketUrl)}" style="display:inline-block;background:#0D4F5C;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">
        Open ticket
      </a>
    </p>
  `;

  const html = emailShell(bodyHtml, `${data.priority} ticket ${data.reference}: ${data.title}`);

  if (!client) {
    console.warn("[resend] RESEND_API_KEY not configured — skipping support ticket email.");
    return { sent: false };
  }

  const { data: result, error } = await client.emails.send({
    from: getFromAddress(),
    to: notifyEmail,
    replyTo: data.reporterEmail || undefined,
    subject: `[${data.priority}] ${data.reference} — ${data.title}`,
    html,
  });

  if (error) {
    console.error("[resend] Failed to send support ticket email:", error);
    return { sent: false };
  }

  return { sent: true, id: result?.id };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
