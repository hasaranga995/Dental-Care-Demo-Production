"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_PLAN_COOKIE, isDemoPlanId, type DemoPlanId } from "@/lib/demo-plan";

export async function selectDemoPlan(plan: DemoPlanId) {
  if (!isDemoPlanId(plan)) {
    redirect("/plans");
  }

  const jar = await cookies();
  jar.set(DEMO_PLAN_COOKIE, plan, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
    httpOnly: true,
  });

  redirect("/");
}
