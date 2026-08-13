import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { heroVideos, type HeroVideo } from "@/db/schema";
import { getCached, setCached } from "@/lib/redis";

const ACTIVE_HERO_VIDEO_CACHE_KEY = "hero-video:active";

/**
 * The single active hero background video, if one has been uploaded. Cached
 * briefly since the homepage renders it on every visit.
 */
export async function getActiveHeroVideo(): Promise<HeroVideo | null> {
  const cached = await getCached<HeroVideo | null>(ACTIVE_HERO_VIDEO_CACHE_KEY);
  if (cached !== null) return cached;

  try {
    const [video] = await db
      .select()
      .from(heroVideos)
      .orderBy(desc(heroVideos.createdAt))
      .limit(1);

    const active = video?.isActive ? video : null;
    await setCached(ACTIVE_HERO_VIDEO_CACHE_KEY, active, 120);
    return active;
  } catch (error) {
    console.warn("[data/hero-video] getActiveHeroVideo failed, returning null:", error);
    return null;
  }
}

/**
 * The current hero video row (active or not), for the admin management
 * screen. Intentionally uncached so admins always see the latest state.
 */
export async function getHeroVideoForAdmin(): Promise<HeroVideo | null> {
  try {
    const [video] = await db
      .select()
      .from(heroVideos)
      .orderBy(desc(heroVideos.createdAt))
      .limit(1);
    return video ?? null;
  } catch (error) {
    console.warn("[data/hero-video] getHeroVideoForAdmin failed, returning null:", error);
    return null;
  }
}
