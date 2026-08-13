import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeDocuments, type KnowledgeDocument } from "@/db/schema";

/**
 * Latest active knowledge document for chat / WhatsApp prompts.
 * Kept out of `@/actions/knowledge` so pdf-parse is never loaded on those routes.
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
    console.warn("[data/knowledge] getActiveKnowledgeDoc failed:", error);
    return null;
  }
}
