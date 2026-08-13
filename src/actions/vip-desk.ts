"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getUpcomingVipAppointments } from "@/lib/data/appointments";
import { staffSubscriberIdSchema, staffSubscriberSchema } from "@/lib/validations";
import { processVipAlert } from "@/lib/vip/alerts";
import { formatPhoneDisplay } from "@/lib/vip/phone";
import {
  removeStaffSubscriber,
  setStaffSubscriberActive,
  subscribeStaffMember,
} from "@/lib/vip/subscribers";

export interface ActionResult {
  success: boolean;
  message: string;
}

function revalidateDesk() {
  revalidatePath("/admin/vip-desk");
  revalidatePath("/admin");
}

/**
 * Pre-approves a back-office phone on the VIP alert roster.
 *
 * The staff member must still text JOIN from that phone (Meta opt-in) before
 * alerts start — guessing the join code alone is not enough.
 */
export async function addStaffSubscriber(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const parsed = staffSubscriberSchema.safeParse({
    phone: formData.get("phone")?.toString() ?? "",
    name: formData.get("name")?.toString() ?? "",
    role: formData.get("role")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid subscriber." };
  }

  try {
    const result = await subscribeStaffMember({
      phone: parsed.data.phone,
      name: parsed.data.name,
      role: parsed.data.role || undefined,
      source: "admin",
    });

    revalidateDesk();

    const display = formatPhoneDisplay(result.subscriber.phone);
    if (result.created) {
      return {
        success: true,
        message: `${display} is pre-approved. They must send JOIN from that phone to start receiving alerts.`,
      };
    }
    return {
      success: true,
      message: result.reactivated
        ? `${display} was reactivated.`
        : `${display} is already on the staff list.`,
    };
  } catch (error) {
    console.error("[actions/vip-desk] addStaffSubscriber failed:", error);
    return {
      success: false,
      message:
        error instanceof Error && error.message.includes("valid phone")
          ? error.message
          : "Could not add that number. Please try again.",
    };
  }
}

export async function toggleStaffSubscriber(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const parsed = staffSubscriberIdSchema.safeParse({
    subscriberId: formData.get("subscriberId")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid subscriber." };
  }

  const isActive = formData.get("isActive")?.toString() === "true";

  try {
    await setStaffSubscriberActive(parsed.data.subscriberId, isActive);
    revalidateDesk();
    return { success: true, message: isActive ? "Alerts resumed." : "Alerts paused." };
  } catch (error) {
    console.error("[actions/vip-desk] toggleStaffSubscriber failed:", error);
    return { success: false, message: "Could not update that subscriber." };
  }
}

export async function deleteStaffSubscriber(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const parsed = staffSubscriberIdSchema.safeParse({
    subscriberId: formData.get("subscriberId")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid subscriber." };
  }

  try {
    await removeStaffSubscriber(parsed.data.subscriberId);
    revalidateDesk();
    return { success: true, message: "Subscriber removed." };
  } catch (error) {
    console.error("[actions/vip-desk] deleteStaffSubscriber failed:", error);
    return { success: false, message: "Could not remove that subscriber." };
  }
}

/**
 * Re-broadcasts the most recent upcoming VIP booking so an administrator can
 * prove the whole pipeline works without waiting for a real VIP to book.
 */
export async function sendTestVipAlert(): Promise<ActionResult> {
  await requireRole(["admin"]);

  try {
    const [appointment] = await getUpcomingVipAppointments(1);
    if (!appointment) {
      return {
        success: false,
        message: "No upcoming VIP appointment to test with. Mark a patient as VIP and book one.",
      };
    }

    const result = await processVipAlert(appointment.id);
    revalidateDesk();

    if (result.reason === "already_sent") {
      return {
        success: false,
        message: "That VIP booking was already broadcast. Book another to test again.",
      };
    }
    if (result.reason === "no_subscribers") {
      return { success: false, message: "No active back-office subscribers to alert yet." };
    }
    if (!result.dispatched) {
      return { success: false, message: `Alert failed for all ${result.failedCount} recipient(s).` };
    }

    return {
      success: true,
      message: `Alert sent to ${result.sentCount} of ${result.recipientCount} staff phone(s).`,
    };
  } catch (error) {
    console.error("[actions/vip-desk] sendTestVipAlert failed:", error);
    return { success: false, message: "Could not send the test alert." };
  }
}
