import "server-only";

export const WHATSAPP_GRAPH_VERSION = "v23.0";
export const WHATSAPP_WEBHOOK_PATH = "/api/webhooks/whatsapp";
export const DEFAULT_WHATSAPP_VERIFY_TOKEN = "dental-care-whatsapp-verify";

export function isWhatsAppCloudConfigured(): boolean {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "";
  return Boolean(token && phoneNumberId && !token.includes("xxxxxxxx"));
}

export function getWhatsAppVerifyToken(): string {
  return process.env.WHATSAPP_VERIFY_TOKEN?.trim() || DEFAULT_WHATSAPP_VERIFY_TOKEN;
}

export const DEFAULT_STAFF_JOIN_CODE = "VIPDESK";

/**
 * Back-office alert channel. Production clinics run this on a second WhatsApp
 * number under the same WABA so patients can never reach the staff bot. When
 * no dedicated number is configured we fall back to the patient number and
 * route by command keyword instead, which keeps the whole flow demoable on a
 * single Meta test number.
 */
export function getStaffChannelConfig() {
  const phoneNumberId = process.env.WHATSAPP_STAFF_PHONE_NUMBER_ID?.trim() ?? "";
  const accessToken = process.env.WHATSAPP_STAFF_ACCESS_TOKEN?.trim() ?? "";
  const templateName = process.env.WHATSAPP_STAFF_TEMPLATE_NAME?.trim() ?? "";

  const hasDedicatedNumber = Boolean(phoneNumberId && !phoneNumberId.includes("xxxxxxxx"));

  return {
    /** Dedicated staff sender, or `null` to share the patient number. */
    phoneNumberId: hasDedicatedNumber ? phoneNumberId : null,
    accessToken: accessToken && !accessToken.includes("xxxxxxxx") ? accessToken : null,
    hasDedicatedNumber,
    /**
     * Approved Utility template used to reach staff outside the 24-hour
     * customer service window. Without it, alerts only land for staff who
     * messaged the bot in the last 24 hours.
     */
    templateName: templateName || null,
    templateLanguage: process.env.WHATSAPP_STAFF_TEMPLATE_LANG?.trim() || "en",
    joinCode: (process.env.STAFF_ALERT_JOIN_CODE?.trim() || DEFAULT_STAFF_JOIN_CODE).toUpperCase(),
  };
}

export function getStaffChannelStatus() {
  const staff = getStaffChannelConfig();
  return {
    hasDedicatedNumber: staff.hasDedicatedNumber,
    sharesPatientNumber: !staff.hasDedicatedNumber,
    hasTemplate: Boolean(staff.templateName),
    templateName: staff.templateName,
    joinCode: staff.joinCode,
  };
}

export function getWhatsAppStatus() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "";
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim() ?? "";
  const businessNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER?.replace(/\D/g, "") || null;
  const publicBase = (
    process.env.WHATSAPP_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).replace(/\/$/, "");

  return {
    configured: isWhatsAppCloudConfigured(),
    hasAccessToken: Boolean(token && !token.includes("xxxxxxxx")),
    hasPhoneNumberId: Boolean(phoneNumberId && !phoneNumberId.includes("xxxxxxxx")),
    hasAppSecret: Boolean(appSecret && !appSecret.includes("xxxxxxxx")),
    hasBusinessNumber: Boolean(businessNumber),
    businessNumber,
    verifyToken: getWhatsAppVerifyToken(),
    webhookPath: WHATSAPP_WEBHOOK_PATH,
    graphVersion: WHATSAPP_GRAPH_VERSION,
    callbackUrl: publicBase ? `${publicBase}${WHATSAPP_WEBHOOK_PATH}` : null,
  };
}
