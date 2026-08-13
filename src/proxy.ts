import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDbUserByClerkId } from "@/lib/auth";
import { DEMO_PLAN_COOKIE, isDemoPlanId, type DemoPlanId } from "@/lib/demo-plan";

/**
 * Route protection for Dental Care.
 *
 * NOTE: Next.js 16 renamed the `middleware.ts` file convention to
 * `proxy.ts` (functionally identical — see the framework's migration
 * guide). This file is the Next.js 16 equivalent of what the brief calls
 * `src/middleware.ts`.
 */

const isPublicRoute = createRouteMatcher([
  "/",
  "/plans",
  "/plans/(.*)",
  "/services",
  "/services/(.*)",
  "/about",
  "/team",
  "/contact",
  "/faq",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/webhooks/(.*)",
  "/api/chat",
  "/api/whatsapp/(.*)",
  "/whatsapp-lab",
]);

const isPatientRoute = createRouteMatcher(["/dashboard(.*)", "/book(.*)"]);
const isStaffRoute = createRouteMatcher(["/admin(.*)", "/doctor-portal(.*)"]);
const isPlansRoute = createRouteMatcher(["/plans", "/plans/(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks/(.*)"]);
const isExternalBotRoute = createRouteMatcher(["/api/whatsapp/(.*)"]);

const isPresenceBlocked = createRouteMatcher([
  "/services",
  "/services/(.*)",
  "/about",
  "/team",
  "/contact",
  "/faq",
  "/book(.*)",
  "/dashboard(.*)",
  "/admin(.*)",
  "/doctor-portal(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/whatsapp-lab",
  "/api/chat",
  "/api/whatsapp/(.*)",
]);

const isPracticeBlocked = createRouteMatcher([
  "/admin/patients",
  "/admin/patients/(.*)",
  "/admin/vip-desk",
  "/admin/vip-desk/(.*)",
  "/admin/banners",
  "/admin/banners/(.*)",
  "/admin/hero-video",
  "/admin/hero-video/(.*)",
  "/admin/category-images",
  "/admin/category-images/(.*)",
  "/admin/knowledge",
  "/admin/knowledge/(.*)",
  "/admin/support",
  "/admin/support/(.*)",
  "/whatsapp-lab",
  "/api/chat",
  "/api/whatsapp/(.*)",
]);

function readPlan(req: { cookies: { get: (name: string) => { value: string } | undefined } }): DemoPlanId | null {
  const value = req.cookies.get(DEMO_PLAN_COOKIE)?.value;
  return isDemoPlanId(value) ? value : null;
}

export default clerkMiddleware(async (auth, req) => {
  if (isPlansRoute(req) || isWebhookRoute(req) || isExternalBotRoute(req)) {
    return NextResponse.next();
  }

  const plan = readPlan(req);
  if (!plan) {
    const url = req.nextUrl.clone();
    url.pathname = "/plans";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (plan === "presence" && isPresenceBlocked(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (plan === "practice" && isPracticeBlocked(req)) {
    const dest = req.nextUrl.pathname.startsWith("/admin") ? "/admin" : "/";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (isStaffRoute(req)) {
    const { userId } = await auth.protect();
    const dbUser = await getDbUserByClerkId(userId);

    if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "doctor")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  if (isPatientRoute(req)) {
    await auth.protect();
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
    "/(api|trpc)(.*)",
  ],
};
