"use server";

import { revalidatePath } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import {
  ACCEPTED_BANNER_IMAGE_TYPES,
  MAX_BANNER_IMAGE_BYTES,
  bannerIdSchema,
  bannerSchema,
} from "@/lib/validations";
import { deleteBannerImage, isCloudinaryConfigured, uploadBannerImage } from "@/lib/cloudinary";
import { invalidateCached } from "@/lib/redis";

export interface BannerActionResult {
  success: boolean;
  message: string;
  bannerId?: string;
}

function revalidateBannerPaths() {
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/admin/banners");
}

async function invalidateBannerCache() {
  await invalidateCached("banners:active");
}

export async function createBanner(formData: FormData): Promise<BannerActionResult> {
  await requireRole(["admin"]);

  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      message:
        "Image uploads aren't configured yet. Add your Cloudinary credentials to .env.local first.",
    };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Please choose a banner image." };
  }

  if (!ACCEPTED_BANNER_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_BANNER_IMAGE_TYPES)[number])) {
    return { success: false, message: "Please upload a JPG, PNG, WEBP, or GIF image." };
  }

  if (file.size > MAX_BANNER_IMAGE_BYTES) {
    return { success: false, message: "Image is too large. Please upload a file under 8MB." };
  }

  const parsed = bannerSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    subtitle: formData.get("subtitle")?.toString() ?? "",
    ctaLabel: formData.get("ctaLabel")?.toString() ?? "",
    ctaHref: formData.get("ctaHref")?.toString() ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please check the banner details.",
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = await uploadBannerImage(buffer, file.type);

    const [lastBanner] = await db
      .select({ sortOrder: banners.sortOrder })
      .from(banners)
      .orderBy(desc(banners.sortOrder))
      .limit(1);
    const nextSortOrder = (lastBanner?.sortOrder ?? -1) + 1;

    const [created] = await db
      .insert(banners)
      .values({
        imageUrl: url,
        imagePublicId: publicId,
        title: parsed.data.title ?? "",
        subtitle: parsed.data.subtitle ?? "",
        ctaLabel: parsed.data.ctaLabel ?? "",
        ctaHref: parsed.data.ctaHref ?? "",
        sortOrder: nextSortOrder,
        isActive: true,
      })
      .returning();

    await invalidateBannerCache();
    revalidateBannerPaths();

    return { success: true, message: "Banner uploaded and published.", bannerId: created?.id };
  } catch (error) {
    console.error("[actions/banners] createBanner failed:", error);
    return {
      success: false,
      message: "Something went wrong while uploading the banner. Please try again.",
    };
  }
}

export async function deleteBanner(formData: FormData): Promise<BannerActionResult> {
  await requireRole(["admin"]);

  const parsed = bannerIdSchema.safeParse({ bannerId: formData.get("bannerId")?.toString() ?? "" });
  if (!parsed.success) {
    return { success: false, message: "Invalid banner." };
  }

  try {
    const [banner] = await db
      .select()
      .from(banners)
      .where(eq(banners.id, parsed.data.bannerId))
      .limit(1);

    if (!banner) {
      return { success: false, message: "Banner not found." };
    }

    await deleteBannerImage(banner.imagePublicId);
    await db.delete(banners).where(eq(banners.id, parsed.data.bannerId));

    await invalidateBannerCache();
    revalidateBannerPaths();

    return { success: true, message: "Banner removed." };
  } catch (error) {
    console.error("[actions/banners] deleteBanner failed:", error);
    return { success: false, message: "Could not remove the banner. Please try again." };
  }
}

export async function setBannerActive(formData: FormData): Promise<BannerActionResult> {
  await requireRole(["admin"]);

  const parsed = bannerIdSchema.safeParse({ bannerId: formData.get("bannerId")?.toString() ?? "" });
  const isActive = formData.get("isActive")?.toString() === "true";
  if (!parsed.success) {
    return { success: false, message: "Invalid banner." };
  }

  try {
    await db.update(banners).set({ isActive }).where(eq(banners.id, parsed.data.bannerId));

    await invalidateBannerCache();
    revalidateBannerPaths();

    return {
      success: true,
      message: isActive ? "Banner is now live on the site." : "Banner hidden from the site.",
    };
  } catch (error) {
    console.error("[actions/banners] setBannerActive failed:", error);
    return { success: false, message: "Could not update the banner." };
  }
}

export async function moveBanner(
  formData: FormData
): Promise<BannerActionResult> {
  await requireRole(["admin"]);

  const parsed = bannerIdSchema.safeParse({ bannerId: formData.get("bannerId")?.toString() ?? "" });
  const direction = formData.get("direction")?.toString();
  if (!parsed.success || (direction !== "up" && direction !== "down")) {
    return { success: false, message: "Invalid request." };
  }

  try {
    const all = await db.select().from(banners).orderBy(asc(banners.sortOrder));
    const index = all.findIndex((banner) => banner.id === parsed.data.bannerId);
    if (index === -1) {
      return { success: false, message: "Banner not found." };
    }

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= all.length) {
      return { success: true, message: "Banner is already at the edge of the list." };
    }

    const current = all[index];
    const swapWith = all[swapIndex];

    await db.update(banners).set({ sortOrder: swapWith.sortOrder }).where(eq(banners.id, current.id));
    await db.update(banners).set({ sortOrder: current.sortOrder }).where(eq(banners.id, swapWith.id));

    await invalidateBannerCache();
    revalidateBannerPaths();

    return { success: true, message: "Banner order updated." };
  } catch (error) {
    console.error("[actions/banners] moveBanner failed:", error);
    return { success: false, message: "Could not reorder banners." };
  }
}
