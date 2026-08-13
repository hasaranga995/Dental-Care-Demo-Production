import type { Metadata } from "next";
import { KnowledgeManager } from "@/components/admin/knowledge-manager";
import { getKnowledgeDocForAdmin } from "@/actions/knowledge";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const metadata: Metadata = {
  title: "AI Knowledge Base | Dental Care Admin",
};

export default async function AdminKnowledgePage() {
  const [activeDoc, cloudinaryConfigured] = await Promise.all([
    getKnowledgeDocForAdmin(),
    Promise.resolve(isCloudinaryConfigured()),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          AI Knowledge Base
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a hospital PDF (services, pricing, policies). Extracted text becomes the Live Chat
          assistant&apos;s official knowledge source powered by Gemini.
        </p>
      </div>

      <KnowledgeManager activeDoc={activeDoc} cloudinaryConfigured={cloudinaryConfigured} />
    </div>
  );
}
