"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categoryImages } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import {
  ACCEPTED_CATEGORY_IMAGE_TYPES,
  MAX_CATEGORY_IMAGE_BYTES,
  categoryImageIdentifierSchema,
} from "@/lib/validations";
import {
  deleteCategoryImage as deleteCategoryImageAsset,
  isCloudinaryConfigured,
  uploadCategoryImage as uploadCategoryImageAsset,
} from "@/lib/cloudinary";
import { invalidateCached } from "@/lib/redis";

export interface CategoryImageActionResult {
  success: boolean;
  message: string;
}

function revalidateCategoryImagePaths() {
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/admin/category-images");
}

async function invalidateCategoryImageCache() {
  await invalidateCached("category-images:map");
}

/**
 * Uploads (or replaces) the background photo for one service-category
 * tile. Since each category has at most one image, an existing image for
 * that category is deleted from Cloudinary and swapped for the new one.
 */
export async function uploadCategoryImage(formData: FormData): Promise<CategoryImageActionResult> {
  await requireRole(["admin"]);

  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      message:
        "Image uploads aren't configured yet. Add your Cloudinary credentials to .env.local first.",
    };
  }

  const parsedCategory = categoryImageIdentifierSchema.safeParse({
    category: formData.get("category")?.toString() ?? "",
  });
  if (!parsedCategory.success) {
    return { success: false, message: "Invalid category." };
  }
  const { category } = parsedCategory.data;

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Please choose an image." };
  }

  if (!ACCEPTED_CATEGORY_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_CATEGORY_IMAGE_TYPES)[number])) {
    return { success: false, message: "Please upload a JPG, PNG, WEBP, or GIF image." };
  }

  if (file.size > MAX_CATEGORY_IMAGE_BYTES) {
    return { success: false, message: "Image is too large. Please upload a file under 8MB." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = await uploadCategoryImageAsset(buffer, file.type);

    const [existing] = await db
      .select()
      .from(categoryImages)
      .where(eq(categoryImages.category, category))
      .limit(1);

    if (existing) {
      await deleteCategoryImageAsset(existing.imagePublicId);
      await db
        .update(categoryImages)
        .set({ imageUrl: url, imagePublicId: publicId, updatedAt: new Date() })
        .where(eq(categoryImages.category, category));
    } else {
      await db.insert(categoryImages).values({
        category,
        imageUrl: url,
        imagePublicId: publicId,
      });
    }

    await invalidateCategoryImageCache();
    revalidateCategoryImagePaths();

    return { success: true, message: `${category} tile image updated.` };
  } catch (error) {
    console.error("[actions/category-images] uploadCategoryImage failed:", error);
    return {
      success: false,
      message: "Something went wrong while uploading the image. Please try again.",
    };
  }
}

export async function removeCategoryImage(formData: FormData): Promise<CategoryImageActionResult> {
  await requireRole(["admin"]);

  const parsed = categoryImageIdentifierSchema.safeParse({
    category: formData.get("category")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { success: false, message: "Invalid category." };
  }
  const { category } = parsed.data;

  try {
    const [existing] = await db
      .select()
      .from(categoryImages)
      .where(eq(categoryImages.category, category))
      .limit(1);

    if (!existing) {
      return { success: true, message: "No image to remove." };
    }

    await deleteCategoryImageAsset(existing.imagePublicId);
    await db.delete(categoryImages).where(eq(categoryImages.category, category));

    await invalidateCategoryImageCache();
    revalidateCategoryImagePaths();

    return { success: true, message: `${category} tile image removed.` };
  } catch (error) {
    console.error("[actions/category-images] removeCategoryImage failed:", error);
    return { success: false, message: "Could not remove the image. Please try again." };
  }
}
