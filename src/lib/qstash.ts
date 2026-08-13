import "server-only";
import { Client } from "@upstash/qstash";
import { processAppointmentConfirmation } from "@/lib/notifications";
import { processVipAlert } from "@/lib/vip/alerts";

let qstashClient: Client | null = null;

function getQstashClient(): Client | null {
  if (qstashClient) return qstashClient;

  const token = process.env.QSTASH_TOKEN;
  if (!token || token.includes("xxxxxxxx")) return null;

  qstashClient = new Client({ token });
  return qstashClient;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * QStash is a cloud service — it can never call back into a `localhost` /
 * loopback address, so publishing a job with such a destination always
 * fails with `endpoint resolves to a loopback address`. This detects that
 * case so local development can fall back to processing the job in-process
 * instead of round-tripping through QStash.
 */
function isLoopbackUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^\[|\]$/g, "");
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export type QstashJobType = "appointment_confirmation" | "vip_alert";

export interface AppointmentJobPayload {
  appointmentId: string;
  /** Omitted on legacy payloads, which are always confirmation emails. */
  type?: QstashJobType;
  /** Premier plan only. Defaults to true for legacy jobs. */
  sms?: boolean;
}

/**
 * Queues the "send appointment confirmation email" job via Upstash QStash,
 * which will later POST to our `/api/webhooks/qstash` route. When QStash
 * isn't configured, or the destination URL is unreachable from the public
 * internet (e.g. `localhost` during local development), the job runs
 * in-process immediately instead — so booking always works end-to-end
 * regardless of environment, and a notification hiccup never blocks the
 * appointment itself from being created.
 */
export async function enqueueAppointmentConfirmation(
  payload: AppointmentJobPayload
): Promise<{ queued: boolean; messageId?: string }> {
  const destinationUrl = `${getAppUrl()}/api/webhooks/qstash`;
  const client = getQstashClient();

  if (!client || isLoopbackUrl(destinationUrl)) {
    await processAppointmentConfirmation(payload.appointmentId, { sms: payload.sms }).catch((error) => {
      console.warn("[qstash] In-process confirmation fallback failed:", error);
    });
    return { queued: false };
  }

  const result = await client.publishJSON({
    url: destinationUrl,
    body: { ...payload, type: "appointment_confirmation" satisfies QstashJobType },
    retries: 3,
  });

  return { queued: true, messageId: result.messageId };
}

/**
 * Queues the back-office VIP broadcast. Runs on the same queue as the
 * confirmation email (and the same local in-process fallback) so a slow or
 * failing WhatsApp fan-out never delays the patient's booking response.
 */
export async function enqueueVipAlert(
  payload: AppointmentJobPayload
): Promise<{ queued: boolean; messageId?: string }> {
  const destinationUrl = `${getAppUrl()}/api/webhooks/qstash`;
  const client = getQstashClient();

  if (!client || isLoopbackUrl(destinationUrl)) {
    await processVipAlert(payload.appointmentId).catch((error) => {
      console.warn("[qstash] In-process VIP alert fallback failed:", error);
    });
    return { queued: false };
  }

  const result = await client.publishJSON({
    url: destinationUrl,
    body: { appointmentId: payload.appointmentId, type: "vip_alert" satisfies QstashJobType },
    retries: 3,
  });

  return { queued: true, messageId: result.messageId };
}
