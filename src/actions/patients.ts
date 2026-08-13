"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { patientTierUpdateSchema } from "@/lib/validations";
import { tierLabel } from "@/lib/vip/identity";
import { phoneIdentity } from "@/lib/vip/phone";

export interface ActionResult {
  success: boolean;
  message: string;
}

/**
 * Promotes or demotes a patient's recognition tier.
 *
 * Marking is a one-time act with lasting effect: the tier lives on the patient
 * record, so every future booking — WhatsApp, website, or reception — is
 * recognized automatically without anyone re-flagging them.
 */
export async function setPatientTier(formData: FormData): Promise<ActionResult> {
  const admin = await requireRole(["admin"]);

  const parsed = patientTierUpdateSchema.safeParse({
    patientId: formData.get("patientId")?.toString() ?? "",
    tier: formData.get("tier")?.toString() ?? "",
    vipNotes: formData.get("vipNotes")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid VIP update." };
  }

  try {
    const [patient] = await db
      .select()
      .from(users)
      .where(eq(users.id, parsed.data.patientId))
      .limit(1);

    if (!patient) {
      return { success: false, message: "Patient not found." };
    }

    if (patient.role !== "patient") {
      return { success: false, message: "Only patient records can be marked as VIP." };
    }

    const isPromotion = patient.tier === "standard" && parsed.data.tier !== "standard";
    const isDemotion = parsed.data.tier === "standard";

    await db
      .update(users)
      .set({
        tier: parsed.data.tier,
        vipNotes: parsed.data.tier === "standard" ? "" : parsed.data.vipNotes,
        vipSince: isDemotion ? null : (patient.vipSince ?? new Date()),
        vipUpdatedBy: admin.id,
        vipUpdatedAt: new Date(),
        // Backfill identity keys for records created before phone matching
        // existed, so recognition works on their next visit.
        ...(patient.phoneKey ? {} : phoneIdentity(patient.phone)),
      })
      .where(eq(users.id, patient.id));

    revalidatePath("/admin");
    revalidatePath("/admin/patients");
    revalidatePath("/admin/vip-desk");

    if (isDemotion) {
      return { success: true, message: `${patient.name} is back to standard.` };
    }

    return {
      success: true,
      message: isPromotion
        ? `${patient.name} is now marked as ${tierLabel(parsed.data.tier)}.`
        : `${patient.name}'s ${tierLabel(parsed.data.tier)} details were updated.`,
    };
  } catch (error) {
    console.error("[actions/patients] setPatientTier failed:", error);
    return { success: false, message: "Could not update the patient. Please try again." };
  }
}
