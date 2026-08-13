"use server";

import { revalidatePath } from "next/cache";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { heroVideos } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ACCEPTED_HERO_VIDEO_TYPES, MAX_HERO_VIDEO_BYTES } from "@/lib/validations";
import { deleteHeroVideo as deleteHeroVideoAsset, isCloudinaryConfigured, uploadHeroVideo as uploadHeroVideoAsset } from "@/lib/cloudinary";
import { invalidateCached } from "@/lib/redis";

export interface HeroVideoActionResult {
  success: boolean;
  message: string;
}

function revalidateHeroVideoPaths() {
  revalidatePath("/");
  revalidatePath("/admin/hero-video");
}

async function invalidateHeroVideoCache() {
  await invalidateCached("hero-video:active");
}

/** Removes any existing hero video row(s) and their Cloudinary assets. */
async function clearExistingHeroVideo() {
  const existing = await db.select().from(heroVideos).orderBy(desc(heroVideos.createdAt));
  for (const video of existing) {
    await deleteHeroVideoAsset(video.videoPublicId);
  }
  if (existing.length > 0) {
    await db.delete(heroVideos);
  }
}

/**
 * Uploads a new hero background video, replacing whatever video is
 * currently configured (there is only ever one active hero video at a
 * time — this isn't a list like banners).
 */
export async function uploadHeroVideo(formData: FormData): Promise<HeroVideoActionResult> {
  await requireRole(["admin"]);

  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      message:
        "Video uploads aren't configured yet. Add your Cloudinary credentials to .env.local first.",
    };
  }

  const file = formData.get("video");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Please choose a video file." };
  }

  if (!ACCEPTED_HERO_VIDEO_TYPES.includes(file.type as (typeof ACCEPTED_HERO_VIDEO_TYPES)[number])) {
    return { success: false, message: "Please upload an MP4, WEBM, or MOV video." };
  }

  if (file.size > MAX_HERO_VIDEO_BYTES) {
    return {
      success: false,
      message: "Video is too large. Please upload a compressed clip under 40MB.",
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId, posterUrl } = await uploadHeroVideoAsset(buffer, file.type);

    await clearExistingHeroVideo();

    await db.insert(heroVideos).values({
      videoUrl: url,
      videoPublicId: publicId,
      posterUrl,
      isActive: true,
    });

    await invalidateHeroVideoCache();
    revalidateHeroVideoPaths();

    return { success: true, message: "Hero video uploaded and published." };
  } catch (error) {
    console.error("[actions/hero-video] uploadHeroVideo failed:", error);
    return {
      success: false,
      message: "Something went wrong while uploading the video. Please try again.",
    };
  }
}

export async function removeHeroVideo(): Promise<HeroVideoActionResult> {
  await requireRole(["admin"]);

  try {
    await clearExistingHeroVideo();

    await invalidateHeroVideoCache();
    revalidateHeroVideoPaths();

    return { success: true, message: "Hero video removed." };
  } catch (error) {
    console.error("[actions/hero-video] removeHeroVideo failed:", error);
    return { success: false, message: "Could not remove the video. Please try again." };
  }
}

export async function setHeroVideoActive(
  formData: FormData
): Promise<HeroVideoActionResult> {
  await requireRole(["admin"]);

  const isActive = formData.get("isActive")?.toString() === "true";

  try {
    await db.update(heroVideos).set({ isActive });

    await invalidateHeroVideoCache();
    revalidateHeroVideoPaths();

    return {
      success: true,
      message: isActive ? "Hero video is now live on the site." : "Hero video hidden from the site.",
    };
  } catch (error) {
    console.error("[actions/hero-video] setHeroVideoActive failed:", error);
    return { success: false, message: "Could not update the video." };
  }
}
