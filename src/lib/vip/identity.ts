import "server-only";

import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { appointments, doctors, users, type PatientTier, type User } from "@/db/schema";
import { phoneMatchKey } from "@/lib/vip/phone";

/**
 * How confident we are that the person we're talking to really is the patient
 * on file. Concierge treatment is only unlocked at `verified`:
 *
 * - `verified`  — WhatsApp sender number (Meta-verified device) or Clerk session
 * - `probable`  — matched on a self-declared email/phone during a chat
 * - `none`      — anonymous visitor
 *
 * This distinction matters: without it, anyone who guesses a VIP's phone
 * number could unlock their preferences and history.
 */
export type IdentityConfidence = "verified" | "probable" | "none";

export type IdentityMatch = "clerk" | "phone" | "email" | null;

export interface PatientHistory {
  /** Appointments actually attended (in the past and not cancelled). */
  visitCount: number;
  /** All live bookings, including ones still in the future. */
  bookingCount: number;
  lastVisit: Date | null;
  preferredDoctorName: string | null;
}

export interface VipContext {
  patientId: string | null;
  name: string | null;
  firstName: string | null;
  tier: PatientTier;
  isVip: boolean;
  /** True only when VIP status is confirmed against a verified identity. */
  recognized: boolean;
  confidence: IdentityConfidence;
  matchedBy: IdentityMatch;
  vipSince: Date | null;
  notes: string;
  history: PatientHistory;
}

export const ANONYMOUS_VIP_CONTEXT: VipContext = {
  patientId: null,
  name: null,
  firstName: null,
  tier: "standard",
  isVip: false,
  recognized: false,
  confidence: "none",
  matchedBy: null,
  vipSince: null,
  notes: "",
  history: { visitCount: 0, bookingCount: 0, lastVisit: null, preferredDoctorName: null },
};

function firstNameOf(name: string | null): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first || null;
}

export async function findPatientByPhone(phone: string): Promise<User | null> {
  const key = phoneMatchKey(phone);
  if (!key) return null;

  try {
    const [row] = await db
      .select()
      .from(users)
      .where(and(eq(users.phoneKey, key), ne(users.role, "doctor")))
      .orderBy(desc(users.tier), desc(users.createdAt))
      .limit(1);
    return row ?? null;
  } catch (error) {
    console.warn("[vip/identity] findPatientByPhone failed:", error);
    return null;
  }
}

export async function findPatientByEmail(email: string): Promise<User | null> {
  const clean = email.trim().toLowerCase();
  if (!clean) return null;

  try {
    const [row] = await db.select().from(users).where(eq(users.email, clean)).limit(1);
    return row ?? null;
  } catch (error) {
    console.warn("[vip/identity] findPatientByEmail failed:", error);
    return null;
  }
}

/**
 * Lightweight "context graph": how often they've visited, when they were last
 * here, and which doctor they keep coming back to. This is what lets the front
 * desk open with "shall I put you with Dr. Nimali again?" instead of starting
 * from scratch every time.
 */
export async function getPatientHistory(patientId: string): Promise<PatientHistory> {
  try {
    const rows = await db
      .select({
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
        doctorName: users.name,
      })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.appointmentDate));

    const now = Date.now();
    const live = rows.filter((row) => row.status !== "cancelled");
    const attended = live.filter((row) => row.appointmentDate.getTime() <= now);

    const doctorCounts = new Map<string, number>();
    for (const row of live) {
      doctorCounts.set(row.doctorName, (doctorCounts.get(row.doctorName) ?? 0) + 1);
    }

    const preferredDoctorName =
      [...doctorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      visitCount: attended.length,
      bookingCount: live.length,
      lastVisit: attended[0]?.appointmentDate ?? null,
      preferredDoctorName,
    };
  } catch (error) {
    console.warn("[vip/identity] getPatientHistory failed:", error);
    return { visitCount: 0, bookingCount: 0, lastVisit: null, preferredDoctorName: null };
  }
}

async function buildContext(
  user: User,
  matchedBy: IdentityMatch,
  confidence: IdentityConfidence
): Promise<VipContext> {
  const isVip = user.tier !== "standard";
  const history = isVip
    ? await getPatientHistory(user.id)
    : { visitCount: 0, bookingCount: 0, lastVisit: null, preferredDoctorName: null };

  return {
    patientId: user.id,
    name: user.name,
    firstName: firstNameOf(user.name),
    tier: user.tier,
    isVip,
    recognized: isVip && confidence === "verified",
    confidence,
    matchedBy,
    vipSince: user.vipSince,
    notes: user.vipNotes ?? "",
    history,
  };
}

/**
 * Resolves who we're talking to. WhatsApp senders and Clerk sessions are
 * treated as verified identities; a phone or email typed into a public chat
 * box is only `probable` and never unlocks VIP handling.
 */
export async function resolvePatientIdentity(input: {
  clerkId?: string | null;
  phone?: string | null;
  email?: string | null;
  /** Set when the phone comes from the WhatsApp sender field, not user input. */
  phoneIsVerified?: boolean;
}): Promise<VipContext> {
  try {
    if (input.clerkId) {
      const [row] = await db.select().from(users).where(eq(users.clerkId, input.clerkId)).limit(1);
      if (row) return buildContext(row, "clerk", "verified");
    }

    if (input.phone) {
      const row = await findPatientByPhone(input.phone);
      if (row) {
        return buildContext(row, "phone", input.phoneIsVerified ? "verified" : "probable");
      }
    }

    if (input.email) {
      const row = await findPatientByEmail(input.email);
      if (row) return buildContext(row, "email", "probable");
    }
  } catch (error) {
    console.warn("[vip/identity] resolvePatientIdentity failed:", error);
  }

  return ANONYMOUS_VIP_CONTEXT;
}

/** WhatsApp sender numbers are verified by Meta, so this is a trusted match. */
export function resolveWhatsAppIdentity(phone: string): Promise<VipContext> {
  return resolvePatientIdentity({ phone, phoneIsVerified: true });
}

export function tierLabel(tier: PatientTier): string {
  if (tier === "vvip") return "VVIP";
  if (tier === "vip") return "VIP";
  return "Standard";
}

export async function countVipPatients(): Promise<number> {
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(ne(users.tier, "standard"));
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}
