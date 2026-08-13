import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Route indicator is development-only and never renders in production builds.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Banner images and the hero background video are uploaded straight
      // through Server Actions, so the default 1MB body limit needs to be
      // raised. Video uploads are base64-encoded in transit (~33% overhead
      // over the 40MB MAX_HERO_VIDEO_BYTES limit), hence the generous cap.
      bodySizeLimit: "60mb",
    },
  },
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
