/**
 * Client-safe service category constants.
 *
 * This file must never import `@/db` (or anything that does), so that
 * client components can safely pull in `SERVICE_CATEGORIES` without
 * accidentally bundling server-only database code — and its secrets —
 * into the browser.
 */
export const SERVICE_CATEGORIES = [
  "All",
  "Cosmetic",
  "Surgery",
  "Orthodontics",
  "General",
  "Pediatric",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type NamedServiceCategory = Exclude<ServiceCategory, "All">;

/**
 * Colour + fallback photography for each clinical category. Used on the
 * services grid tags and as atmospheric backgrounds on the detail page.
 */
export const CATEGORY_VISUALS: Record<
  NamedServiceCategory,
  {
    tag: string;
    chip: string;
    fallbackImage: string;
    imageAlt: string;
  }
> = {
  Cosmetic: {
    tag: "border-rose-200 bg-rose-50 text-rose-800",
    chip: "bg-rose-500 text-white",
    fallbackImage:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Cosmetic dentistry treatment",
  },
  Surgery: {
    tag: "border-slate-300 bg-slate-100 text-slate-800",
    chip: "bg-slate-700 text-white",
    fallbackImage:
      "https://images.unsplash.com/photo-1551076804-c556fe22cd54?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Surgical dental suite",
  },
  Orthodontics: {
    tag: "border-violet-200 bg-violet-50 text-violet-800",
    chip: "bg-violet-600 text-white",
    fallbackImage:
      "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Confident smile after orthodontic care",
  },
  General: {
    tag: "border-teal-200 bg-teal-50 text-teal-900",
    chip: "bg-[#0D4F5C] text-white",
    fallbackImage:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Modern dental clinic interior",
  },
  Pediatric: {
    tag: "border-amber-200 bg-amber-50 text-amber-900",
    chip: "bg-amber-500 text-white",
    fallbackImage:
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Gentle pediatric dental visit",
  },
};

export function getCategoryVisual(category: string) {
  return CATEGORY_VISUALS[category as NamedServiceCategory] ?? CATEGORY_VISUALS.General;
}
