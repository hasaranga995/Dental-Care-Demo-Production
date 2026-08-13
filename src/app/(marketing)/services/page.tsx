import type { Metadata } from "next";
import { ServicesFilterGrid } from "@/components/services/services-filter-grid";
import { ServicesHeroSlideshow } from "@/components/services/services-hero-slideshow";
import { ServicesHeroTitle } from "@/components/services/services-hero-title";
import { getAllServices } from "@/lib/data/services";
import { getCategoryImageMap } from "@/lib/data/category-images";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore Dental Care's full range of cosmetic, surgical, orthodontic, general, and pediatric dentistry services.",
};

interface ServicesPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const { category } = await searchParams;
  const [services, categoryImages] = await Promise.all([
    getAllServices(),
    getCategoryImageMap(),
  ]);

  return (
    <div>
      <ServicesHeroSlideshow>
        <span className="mb-4 inline-flex items-center rounded-full border border-white/25 bg-white/20 px-4 py-1.5 text-sm font-semibold tracking-wide text-white uppercase [text-shadow:0_1px_12px_rgba(7,24,32,0.4)] sm:text-base">
          Our Services
        </span>
        <ServicesHeroTitle />
        <p className="mx-auto mt-3 max-w-2xl text-white/90 [text-shadow:0_1px_16px_rgba(7,24,32,0.45)]">
          Filter by category to find the right treatment, or browse everything we offer —
          every procedure is backed by board-certified specialists and modern technology.
        </p>
      </ServicesHeroSlideshow>

      <div className="page-container py-10 sm:py-12">
        <ServicesFilterGrid
          services={services}
          initialCategory={category}
          categoryImages={categoryImages}
        />
      </div>
    </div>
  );
}
