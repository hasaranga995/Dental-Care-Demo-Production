"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { PDFParse } from "pdf-parse";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { knowledgeDocuments, type KnowledgeDocument } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { isCloudinaryConfigured, uploadKnowledgePdf } from "@/lib/cloudinary";

export interface KnowledgeActionResult {
  success: boolean;
  message: string;
}

const MAX_KNOWLEDGE_PDF_BYTES = 20 * 1024 * 1024; // 20MB

function revalidateKnowledgePaths() {
  revalidatePath("/admin/knowledge");
  revalidatePath("/api/chat");
}

/**
 * Latest active knowledge document for the chatbot system prompt.
 * Safe to call from the chat API route — returns null when none is uploaded.
 */
export async function getActiveKnowledgeDoc(): Promise<KnowledgeDocument | null> {
  try {
    const [doc] = await db
      .select()
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.isActive, true))
      .orderBy(desc(knowledgeDocuments.createdAt))
      .limit(1);
    return doc ?? null;
  } catch (error) {
    console.warn("[actions/knowledge] getActiveKnowledgeDoc failed:", error);
    return null;
  }
}

/** Admin-only listing of the current active document (or null). */
export async function getKnowledgeDocForAdmin(): Promise<KnowledgeDocument | null> {
  await requireRole(["admin"]);
  return getActiveKnowledgeDoc();
}

/**
 * Uploads a PDF to Cloudinary, extracts plain text with pdf-parse, deactivates
 * previous knowledge docs, and inserts the new active version.
 */
export async function uploadAndSyncKnowledgePDF(
  formData: FormData
): Promise<KnowledgeActionResult> {
  const admin = await requireRole(["admin"]);
  const { userId } = await auth();

  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      message:
        "Cloudinary isn't configured yet. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.local.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Please choose a PDF file." };
  }

  const title =
    formData.get("title")?.toString().trim() ||
    file.name.replace(/\.pdf$/i, "") ||
    "Hospital Knowledge Pack";

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { success: false, message: "Only PDF files are supported." };
  }

  if (file.size > MAX_KNOWLEDGE_PDF_BYTES) {
    return { success: false, message: "PDF is too large. Please upload a file under 20MB." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy().catch(() => undefined);
    const extractedText = (parsed.text || "").replace(/\u0000/g, "").trim();

    if (extractedText.length < 40) {
      return {
        success: false,
        message:
          "Could not extract enough readable text from this PDF. Try a text-based PDF (not a scanned image-only file).",
      };
    }

    const { url } = await uploadKnowledgePdf(buffer, file.name);

    await db.update(knowledgeDocuments).set({ isActive: false, updatedAt: new Date() });

    await db.insert(knowledgeDocuments).values({
      title,
      cloudinaryUrl: url,
      extractedText,
      isActive: true,
      uploadedBy: userId ?? admin.clerkId,
    });

    revalidateKnowledgePaths();

    return {
      success: true,
      message: `Knowledge base updated from “${title}” (${extractedText.length.toLocaleString()} characters extracted).`,
    };
  } catch (error) {
    console.error("[actions/knowledge] uploadAndSyncKnowledgePDF failed:", error);
    return {
      success: false,
      message: "Something went wrong while uploading or parsing the PDF. Please try again.",
    };
  }
}
