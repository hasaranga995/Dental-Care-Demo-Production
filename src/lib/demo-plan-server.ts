import "server-only";
import { cookies } from "next/headers";
import { DEMO_PLAN_COOKIE, isDemoPlanId, type DemoPlanId } from "@/lib/demo-plan";

export async function getDemoPlan(): Promise<DemoPlanId | null> {
  try {
    const jar = await cookies();
    const value = jar.get(DEMO_PLAN_COOKIE)?.value;
    return isDemoPlanId(value) ? value : null;
  } catch {
    // Route handlers like WhatsApp webhooks have no browser cookie jar.
    return null;
  }
}
