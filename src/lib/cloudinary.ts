import "server-only";
import { v2 as cloudinary } from "cloudinary";

let configured = false;

/**
 * Whether real Cloudinary credentials are present. Every function in this
 * module degrades gracefully when they're not, so the rest of the app (and
 * local development) never hard-fails on missing third-party secrets.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function ensureConfigured(): boolean {
  if (!isCloudinaryConfigured()) return false;
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return true;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

const BANNER_FOLDER = "dental-care/banners";

/**
 * Uploads a raw image buffer (e.g. from a Server Action's `FormData`) to
 * Cloudinary and returns the CDN URL + public id needed later for deletion.
 * Cloudinary credentials are server-only secrets — the browser never talks
 * to Cloudinary directly.
 */
export async function uploadBannerImage(
  buffer: Buffer,
  mimeType: string
): Promise<CloudinaryUploadResult> {
  if (!ensureConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, " +
        "and CLOUDINARY_API_SECRET to .env.local (see .env.local.example)."
    );
  }

  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: BANNER_FOLDER,
    resource_type: "image",
    overwrite: false,
  });

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Deletes a banner image from Cloudinary. Best-effort: failures are logged
 * but never thrown, so a Cloudinary hiccup can never block removing the
 * banner row from the database.
 */
export async function deleteBannerImage(publicId: string): Promise<void> {
  if (!ensureConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.warn(`[cloudinary] Failed to delete image ${publicId}:`, error);
  }
}

const HERO_VIDEO_FOLDER = "dental-care/hero-video";

export interface CloudinaryVideoUploadResult extends CloudinaryUploadResult {
  posterUrl: string;
}

/**
 * Uploads a background video for the homepage hero to Cloudinary and derives
 * a poster frame (a JPG still of the first frame) so the browser has
 * something to paint before the video itself has buffered.
 */
export async function uploadHeroVideo(
  buffer: Buffer,
  mimeType: string
): Promise<CloudinaryVideoUploadResult> {
  if (!ensureConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, " +
        "and CLOUDINARY_API_SECRET to .env.local (see .env.local.example)."
    );
  }

  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: HERO_VIDEO_FOLDER,
    resource_type: "video",
    overwrite: false,
  });

  const posterUrl = cloudinary.url(result.public_id, {
    resource_type: "video",
    format: "jpg",
    transformation: [{ start_offset: "0" }],
  });

  return { url: result.secure_url, publicId: result.public_id, posterUrl };
}

/**
 * Deletes a hero video from Cloudinary. Best-effort: failures are logged
 * but never thrown, so a Cloudinary hiccup can never block removing the
 * video row from the database.
 */
export async function deleteHeroVideo(publicId: string): Promise<void> {
  if (!ensureConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  } catch (error) {
    console.warn(`[cloudinary] Failed to delete video ${publicId}:`, error);
  }
}

const CATEGORY_IMAGE_FOLDER = "dental-care/category-images";

/**
 * Uploads a background photo for one homepage service-category tile
 * (Cosmetic, Surgery, Orthodontics, General, or Pediatric).
 */
export async function uploadCategoryImage(
  buffer: Buffer,
  mimeType: string
): Promise<CloudinaryUploadResult> {
  if (!ensureConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, " +
        "and CLOUDINARY_API_SECRET to .env.local (see .env.local.example)."
    );
  }

  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: CATEGORY_IMAGE_FOLDER,
    resource_type: "image",
    overwrite: false,
  });

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Deletes a category tile image from Cloudinary. Best-effort: failures are
 * logged but never thrown, so a Cloudinary hiccup can never block removing
 * or replacing the row in the database.
 */
export async function deleteCategoryImage(publicId: string): Promise<void> {
  if (!ensureConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.warn(`[cloudinary] Failed to delete category image ${publicId}:`, error);
  }
}

const KNOWLEDGE_PDF_FOLDER = "dental_knowledge";

/**
 * Uploads a knowledge-base PDF to Cloudinary as a raw asset so admins can
 * open/download it later from the management UI.
 */
export async function uploadKnowledgePdf(
  buffer: Buffer,
  fileName: string
): Promise<CloudinaryUploadResult> {
  if (!ensureConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, " +
        "and CLOUDINARY_API_SECRET to .env.local (see .env.local.example)."
    );
  }

  const dataUri = `data:application/pdf;base64,${buffer.toString("base64")}`;
  const safeName = fileName.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 80);

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: KNOWLEDGE_PDF_FOLDER,
    resource_type: "raw",
    public_id: `${safeName}-${Date.now()}`,
    overwrite: false,
  });

  return { url: result.secure_url, publicId: result.public_id };
}

const SUPPORT_MEDIA_FOLDER = "dental-care/support-tickets";

export const MAX_SUPPORT_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
export const MAX_SUPPORT_VIDEO_BYTES = 40 * 1024 * 1024; // 40MB
export const ACCEPTED_SUPPORT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export const ACCEPTED_SUPPORT_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export type SupportMediaKind = "image" | "video";

/**
 * Uploads a screenshot or screen recording for a support ticket / comment.
 */
export async function uploadSupportMedia(
  buffer: Buffer,
  mimeType: string,
  kind: SupportMediaKind
): Promise<CloudinaryUploadResult> {
  if (!ensureConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, " +
        "and CLOUDINARY_API_SECRET to .env.local (see .env.local.example)."
    );
  }

  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: SUPPORT_MEDIA_FOLDER,
    resource_type: kind,
    overwrite: false,
  });

  return { url: result.secure_url, publicId: result.public_id };
}
