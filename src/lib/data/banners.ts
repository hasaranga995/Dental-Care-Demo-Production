import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { banners, type Banner } from "@/db/schema";
import { getCached, setCached } from "@/lib/redis";

const ACTIVE_BANNERS_CACHE_KEY = "banners:active";

/**
 * Active promo banners for the public homepage/services slider, ordered by
 * `sortOrder`. Cached briefly so the slider doesn't hit Postgres on every
 * page view.
 */
export async function getActiveBanners(): Promise<Banner[]> {
  const cached = await getCached<Banner[]>(ACTIVE_BANNERS_CACHE_KEY);
  if (cached) return cached;

  try {
    const rows = await db.select().from(banners).orderBy(asc(banners.sortOrder));
    const active = rows.filter((banner) => banner.isActive);
    await setCached(ACTIVE_BANNERS_CACHE_KEY, active, 120);
    return active;
  } catch (error) {
    console.warn("[data/banners] getActiveBanners failed, returning empty list:", error);
    return [];
  }
}

/**
 * All banners (active and inactive), for the admin management screen.
 * Intentionally uncached so admins always see the latest state.
 */
export async function getAllBanners(): Promise<Banner[]> {
  try {
    return await db.select().from(banners).orderBy(asc(banners.sortOrder));
  } catch (error) {
    console.warn("[data/banners] getAllBanners failed, returning empty list:", error);
    return [];
  }
}
