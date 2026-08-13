import "server-only";

import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { appointments, users, type PatientTier } from "@/db/schema";
import { phoneMatchKey } from "@/lib/vip/phone";

export interface PatientDirectoryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tier: PatientTier;
  vipSince: Date | null;
  vipNotes: string;
  createdAt: Date;
  appointmentCount: number;
  lastAppointmentAt: Date | null;
}

export interface PatientDirectoryFilters {
  /** Free-text match across name, email, and phone. */
  query?: string;
  tier?: PatientTier | "all" | "vip-only";
  limit?: number;
}

/**
 * Admin patient directory. Aggregates appointment counts so an administrator
 * can tell a one-off enquiry from a long-standing patient before promoting
 * anyone to VIP.
 */
export async function getPatientDirectory(
  filters: PatientDirectoryFilters = {}
): Promise<PatientDirectoryRow[]> {
  const { query, tier = "all", limit = 200 } = filters;

  const conditions = [eq(users.role, "patient")];

  const search = query?.trim();
  if (search) {
    const like = `%${search}%`;
    const digits = phoneMatchKey(search);
    const clauses = [ilike(users.name, like), ilike(users.email, like), ilike(users.phone, like)];
    if (digits) clauses.push(eq(users.phoneKey, digits));
    const matcher = or(...clauses);
    if (matcher) conditions.push(matcher);
  }

  if (tier === "vip-only") {
    conditions.push(ne(users.tier, "standard"));
  } else if (tier !== "all") {
    conditions.push(eq(users.tier, tier));
  }

  try {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        tier: users.tier,
        vipSince: users.vipSince,
        vipNotes: users.vipNotes,
        createdAt: users.createdAt,
        appointmentCount: sql<number>`count(${appointments.id})::int`,
        lastAppointmentAt: sql<Date | null>`max(${appointments.appointmentDate})`,
      })
      .from(users)
      .leftJoin(appointments, eq(appointments.patientId, users.id))
      .where(and(...conditions))
      .groupBy(users.id)
      .orderBy(desc(users.tier), desc(users.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      vipNotes: row.vipNotes ?? "",
      lastAppointmentAt: row.lastAppointmentAt ? new Date(row.lastAppointmentAt) : null,
    }));
  } catch (error) {
    console.warn("[data/patients] getPatientDirectory failed:", error);
    return [];
  }
}

export async function getPatientDirectoryStats(): Promise<{
  total: number;
  vip: number;
  vvip: number;
}> {
  try {
    const rows = await db
      .select({ tier: users.tier, count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, "patient"))
      .groupBy(users.tier);

    const byTier = new Map(rows.map((row) => [row.tier, row.count]));
    const standard = byTier.get("standard") ?? 0;
    const vip = byTier.get("vip") ?? 0;
    const vvip = byTier.get("vvip") ?? 0;

    return { total: standard + vip + vvip, vip, vvip };
  } catch (error) {
    console.warn("[data/patients] getPatientDirectoryStats failed:", error);
    return { total: 0, vip: 0, vvip: 0 };
  }
}
