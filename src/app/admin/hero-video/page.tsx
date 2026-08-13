import type { Metadata } from "next";
import { HeroVideoCurrent, HeroVideoUploadForm } from "@/components/admin/hero-video-manager";
import { getHeroVideoForAdmin } from "@/lib/data/hero-video";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const metadata: Metadata = {
  title: "Hero Video | Dental Care Admin",
};

export default async function AdminHeroVideoPage() {
  const [video, cloudinaryConfigured] = await Promise.all([
    getHeroVideoForAdmin(),
    Promise.resolve(isCloudinaryConfigured()),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Homepage Hero Video</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a short, looping background video for the top of the homepage. It plays muted
          and repeats continuously — hide or remove it any time without losing your default
          homepage design.
        </p>
      </div>

      {video && <HeroVideoCurrent video={video} />}
      <HeroVideoUploadForm cloudinaryConfigured={cloudinaryConfigured} hasExistingVideo={Boolean(video)} />
    </div>
  );
}
