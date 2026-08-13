import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { staffAlertSubscribers, type StaffAlertSubscriber } from "@/db/schema";
import { normalizePhone, phoneMatchKey } from "@/lib/vip/phone";

/**
 * The back-office alert roster.
 *
 * Security model:
 * 1. An admin pre-approves a phone under VIP Desk → Staff Numbers.
 * 2. That staff member texts `JOIN <code>` from the same phone (Meta opt-in).
 * 3. Only then do VIP alerts fan out to them.
 *
 * WhatsApp JOIN never creates a new roster row — guessing the join code alone
 * is not enough.
 */

export class StaffSubscribeError extends Error {
  readonly code: "invalid_phone" | "not_preapproved";

  constructor(code: "invalid_phone" | "not_preapproved", message: string) {
    super(message);
    this.name = "StaffSubscribeError";
    this.code = code;
  }
}

export async function listStaffSubscribers(): Promise<StaffAlertSubscriber[]> {
  try {
    return await db
      .select()
      .from(staffAlertSubscribers)
      .orderBy(desc(staffAlertSubscribers.isActive), desc(staffAlertSubscribers.optedInAt));
  } catch (error) {
    console.warn("[vip/subscribers] listStaffSubscribers failed:", error);
    return [];
  }
}

export async function listActiveStaffSubscribers(): Promise<StaffAlertSubscriber[]> {
  try {
    return await db
      .select()
      .from(staffAlertSubscribers)
      .where(eq(staffAlertSubscribers.isActive, true));
  } catch (error) {
    console.warn("[vip/subscribers] listActiveStaffSubscribers failed:", error);
    return [];
  }
}

export async function findStaffSubscriberByPhone(
  phone: string
): Promise<StaffAlertSubscriber | null> {
  const key = phoneMatchKey(phone);
  if (!key) return null;

  try {
    const [row] = await db
      .select()
      .from(staffAlertSubscribers)
      .where(eq(staffAlertSubscribers.phoneKey, key))
      .limit(1);
    return row ?? null;
  } catch (error) {
    console.warn("[vip/subscribers] findStaffSubscriberByPhone failed:", error);
    return null;
  }
}

export async function isActiveStaffSubscriber(phone: string): Promise<boolean> {
  const row = await findStaffSubscriberByPhone(phone);
  return Boolean(row?.isActive);
}

export async function isPreapprovedStaffPhone(phone: string): Promise<boolean> {
  return Boolean(await findStaffSubscriberByPhone(phone));
}

export interface SubscribeResult {
  subscriber: StaffAlertSubscriber;
  /** False when the number was already on the roster and simply reactivated. */
  created: boolean;
  reactivated: boolean;
}

export async function subscribeStaffMember(input: {
  phone: string;
  name?: string;
  role?: string;
  source?: "whatsapp" | "admin";
}): Promise<SubscribeResult> {
  const phone = normalizePhone(input.phone);
  const phoneKey = phoneMatchKey(input.phone);
  if (!phone || !phoneKey) {
    throw new StaffSubscribeError("invalid_phone", "A valid phone number is required.");
  }

  const source = input.source ?? "whatsapp";
  const existing = await findStaffSubscriberByPhone(phone);

  // WhatsApp JOIN is opt-in only — the number must already be on the admin
  // pre-approved list. Guessing `JOIN VIPDESK` from an unknown phone fails.
  if (source === "whatsapp" && !existing) {
    throw new StaffSubscribeError(
      "not_preapproved",
      "This number is not on the hospital staff list. Ask an administrator to add it under VIP Desk first."
    );
  }

  if (existing) {
    const [updated] = await db
      .update(staffAlertSubscribers)
      .set({
        phone,
        phoneKey,
        name: input.name?.trim() || existing.name,
        role: input.role?.trim() || existing.role,
        isActive: true,
        optedOutAt: null,
        // Fresh opt-in timestamp when they activate from WhatsApp.
        ...(existing.isActive && source !== "whatsapp"
          ? {}
          : { optedInAt: new Date(), source: source === "whatsapp" ? "whatsapp" : existing.source }),
      })
      .where(eq(staffAlertSubscribers.id, existing.id))
      .returning();

    return {
      subscriber: updated ?? existing,
      created: false,
      reactivated: !existing.isActive,
    };
  }

  // Admin pre-approval: create the roster row. Starts inactive so the staff
  // member still has to JOIN from their phone (Meta opt-in), unless the admin
  // toggles them on afterwards for testing.
  const [created] = await db
    .insert(staffAlertSubscribers)
    .values({
      phone,
      phoneKey,
      name: input.name?.trim() || "",
      role: input.role?.trim() || "Back office",
      source: "admin",
      isActive: false,
    })
    .returning();

  return { subscriber: created, created: true, reactivated: false };
}

export async function unsubscribeStaffMember(phone: string): Promise<boolean> {
  const existing = await findStaffSubscriberByPhone(phone);
  if (!existing || !existing.isActive) return false;

  await db
    .update(staffAlertSubscribers)
    .set({ isActive: false, optedOutAt: new Date() })
    .where(eq(staffAlertSubscribers.id, existing.id));

  return true;
}

export async function setStaffSubscriberActive(id: string, isActive: boolean): Promise<void> {
  await db
    .update(staffAlertSubscribers)
    .set({ isActive, optedOutAt: isActive ? null : new Date() })
    .where(eq(staffAlertSubscribers.id, id));
}

export async function removeStaffSubscriber(id: string): Promise<void> {
  await db.delete(staffAlertSubscribers).where(eq(staffAlertSubscribers.id, id));
}

export async function markStaffSubscriberNotified(id: string): Promise<void> {
  try {
    await db
      .update(staffAlertSubscribers)
      .set({ lastNotifiedAt: new Date() })
      .where(eq(staffAlertSubscribers.id, id));
  } catch {
    // Best-effort bookkeeping — never fail an alert over it.
  }
}
