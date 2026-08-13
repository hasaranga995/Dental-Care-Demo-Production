import "server-only";
import { db } from "@/db";
import { categoryImages } from "@/db/schema";
import { getCached, setCached } from "@/lib/redis";
import { SERVICE_CATEGORY_VALUES } from "@/lib/validations";

const CATEGORY_IMAGE_MAP_CACHE_KEY = "category-images:map";

export type CategoryImageMap = Partial<Record<(typeof SERVICE_CATEGORY_VALUES)[number], string>>;

/**
 * A `{ category: imageUrl }` lookup for the homepage's service-category
 * tiles. Categories without an uploaded photo are simply absent from the
 * map, so callers can fall back to the default icon-only tile design.
 */
export async function getCategoryImageMap(): Promise<CategoryImageMap> {
  const cached = await getCached<CategoryImageMap>(CATEGORY_IMAGE_MAP_CACHE_KEY);
  if (cached) return cached;

  try {
    const rows = await db.select().from(categoryImages);
    const map: CategoryImageMap = {};
    for (const row of rows) {
      map[row.category] = row.imageUrl;
    }
    await setCached(CATEGORY_IMAGE_MAP_CACHE_KEY, map, 300);
    return map;
  } catch (error) {
    console.warn("[data/category-images] getCategoryImageMap failed, returning empty map:", error);
    return {};
  }
}

export interface CategoryImageRow {
  category: (typeof SERVICE_CATEGORY_VALUES)[number];
  imageUrl: string | null;
  imagePublicId: string | null;
}

/**
 * All five categories, each paired with its current image (or `null` if
 * none has been uploaded yet) — for the admin management screen.
 * Intentionally uncached so admins always see the latest state.
 */
export async function getAllCategoryImagesForAdmin(): Promise<CategoryImageRow[]> {
  try {
    const rows = await db.select().from(categoryImages);
    const byCategory = new Map(rows.map((row) => [row.category, row]));

    return SERVICE_CATEGORY_VALUES.map((category) => {
      const existing = byCategory.get(category);
      return {
        category,
        imageUrl: existing?.imageUrl ?? null,
        imagePublicId: existing?.imagePublicId ?? null,
      };
    });
  } catch (error) {
    console.warn(
      "[data/category-images] getAllCategoryImagesForAdmin failed, returning empty rows:",
      error
    );
    return SERVICE_CATEGORY_VALUES.map((category) => ({
      category,
      imageUrl: null,
      imagePublicId: null,
    }));
  }
}
