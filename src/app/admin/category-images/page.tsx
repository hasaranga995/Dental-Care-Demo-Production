import type { Metadata } from "next";
import { CategoryImageManager } from "@/components/admin/category-image-manager";
import { getAllCategoryImagesForAdmin } from "@/lib/data/category-images";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const metadata: Metadata = {
  title: "Service Tile Images | Dental Care Admin",
};

export default async function AdminCategoryImagesPage() {
  const [rows, cloudinaryConfigured] = await Promise.all([
    getAllCategoryImagesForAdmin(),
    Promise.resolve(isCloudinaryConfigured()),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Service Tile Images</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a background photo for each service category tile shown in the homepage
          &quot;Comprehensive Care, Under One Roof&quot; section. Categories without a photo fall
          back to the default icon design.
        </p>
      </div>

      <CategoryImageManager rows={rows} cloudinaryConfigured={cloudinaryConfigured} />
    </div>
  );
}
