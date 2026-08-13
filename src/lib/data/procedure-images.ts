/**
 * Real clinical / procedure photos shown on service detail pages.
 * These are intentionally marked sensitive so visitors must opt in to view them.
 */
export interface ProcedureImage {
  src: string;
  alt: string;
  caption: string;
}

const SHARED_PROCEDURE_IMAGES: ProcedureImage[] = [
  {
    src: "/images/procedures/post-surgical-sutures.png",
    alt: "Post-surgical dental site with sutures after restorative treatment",
    caption: "Live clinical result — sutures after chairside restorative / surgical care",
  },
  {
    src: "/images/procedures/implant-surgery.png",
    alt: "Dental implant surgery with implant posts placed in the upper jaw",
    caption: "Live clinical result — implant placement during oral surgery",
  },
];

/** Procedure photos for every category — swap in category-specific sets as you add more. */
export const PROCEDURE_IMAGES_BY_CATEGORY: Record<string, ProcedureImage[]> = {
  Cosmetic: SHARED_PROCEDURE_IMAGES,
  Surgery: SHARED_PROCEDURE_IMAGES,
  Orthodontics: SHARED_PROCEDURE_IMAGES,
  General: SHARED_PROCEDURE_IMAGES,
  Pediatric: SHARED_PROCEDURE_IMAGES,
};

export function getProcedureImagesForCategory(category: string): ProcedureImage[] {
  return PROCEDURE_IMAGES_BY_CATEGORY[category] ?? SHARED_PROCEDURE_IMAGES;
}
