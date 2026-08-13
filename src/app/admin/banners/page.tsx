import type { Metadata } from "next";
import { BannerList, BannerUploadForm } from "@/components/admin/banner-manager";
import { getAllBanners } from "@/lib/data/banners";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const metadata: Metadata = {
  title: "Banners & Promotions | Dental Care Admin",
};

export default async function AdminBannersPage() {
  const [banners, cloudinaryConfigured] = await Promise.all([
    getAllBanners(),
    Promise.resolve(isCloudinaryConfigured()),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Banners &amp; Promotions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage promo banners. Reorder with the arrows, hide a banner without
          deleting it, or remove it entirely.
        </p>
      </div>

      <BannerUploadForm cloudinaryConfigured={cloudinaryConfigured} />
      <BannerList banners={banners} />
    </div>
  );
}
