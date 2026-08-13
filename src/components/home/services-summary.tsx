"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Baby,
  Braces,
  Scissors,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/fade-in";
import type { ServiceWithParsed } from "@/lib/data/services";
import type { CategoryImageMap } from "@/lib/data/category-images";
import { FeatureGate } from "@/components/demo/feature-gate";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Cosmetic: Sparkles,
  Surgery: Scissors,
  Orthodontics: Braces,
  General: Stethoscope,
  Pediatric: Baby,
};

const CATEGORY_META: Record<string, { blurb: string }> = {
  Cosmetic: { blurb: "Whitening, veneers & smile makeovers" },
  Surgery: { blurb: "Implants, extractions & oral surgery" },
  Orthodontics: { blurb: "Braces, aligners & bite correction" },
  General: { blurb: "Cleanings, fillings & checkups" },
  Pediatric: { blurb: "Gentle, kid-friendly dental care" },
};

interface ServicesSummaryProps {
  services: ServiceWithParsed[];
  categoryImages?: CategoryImageMap;
}

function ServiceCategoryCard({
  category,
  services,
  imageUrl,
  selected,
  onSelect,
}: {
  category: string;
  services: ServiceWithParsed[];
  imageUrl?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = CATEGORY_ICON[category] ?? Sparkles;
  const servicesInCategory = services.filter((service) => service.category === category);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "service-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-left outline-none",
        "transition-[border-color,box-shadow] duration-500 ease-out",
        "focus-visible:ring-3 focus-visible:ring-brand-teal/30 focus-visible:ring-offset-2",
        selected
          ? "border-brand-teal/45 shadow-[0_10px_28px_-18px_rgba(0,178,216,0.28)]"
          : "border-border shadow-sm hover:border-brand-teal/35 hover:shadow-[0_10px_28px_-18px_rgba(13,79,92,0.18)]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 z-20 h-0.5 origin-left scale-x-0 bg-brand-teal/80 transition-transform duration-500 ease-out",
          "group-hover:scale-x-100",
          selected && "scale-x-100"
        )}
      />

      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-brand-teal/[0.07] to-transparent opacity-0 transition-opacity duration-500 ease-out",
          "group-hover:opacity-100",
          selected && "opacity-100"
        )}
      />

      <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary/5">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={category}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <Icon
              className={cn(
                "size-12 text-primary/30 transition-colors duration-500 ease-out",
                "group-hover:text-brand-teal/45",
                selected && "text-brand-teal/45"
              )}
            />
          </div>
        )}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0",
            imageUrl
              ? "bg-gradient-to-t from-black/75 via-black/20 to-transparent"
              : "bg-gradient-to-t from-background/80 via-transparent to-transparent"
          )}
        />
        <div className="absolute bottom-3 left-3 z-[1] flex items-center gap-2.5">
          <div
            className={cn(
              "relative flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white/95 text-primary shadow-sm",
              "transition-transform duration-500 ease-out",
              "group-hover:scale-125",
              selected && "scale-125"
            )}
          >
            {/* Color fill expands from center outward */}
            <span
              aria-hidden
              className={cn(
                "absolute top-1/2 left-1/2 size-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-teal",
                "origin-center scale-0 transition-transform duration-500 ease-out",
                "group-hover:scale-100",
                selected && "scale-100"
              )}
            />
            <Icon
              className={cn(
                "relative z-10 size-4.5 transition-colors duration-500 ease-out",
                "group-hover:text-white",
                selected && "text-white"
              )}
            />
          </div>
          <h3
            className={cn(
              "font-heading text-lg font-semibold drop-shadow-sm",
              imageUrl ? "text-white" : "text-foreground"
            )}
          >
            {category}
          </h3>
        </div>
      </div>

      <div className="relative z-[1] flex flex-1 flex-col p-6">
        <p className="text-sm text-muted-foreground transition-colors duration-500 ease-out group-hover:text-foreground/75">
          {CATEGORY_META[category]?.blurb}
        </p>

        {servicesInCategory.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm text-foreground/80">
            {servicesInCategory.slice(0, 3).map((service) => (
              <li key={service.id}>
                <Link
                  href={`/services/${service.slug}`}
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex transition-colors duration-300 ease-out hover:text-brand-teal hover:underline"
                >
                  {service.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={`/services?category=${category}`}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal",
            "opacity-90 transition-opacity duration-500 ease-out sm:opacity-0",
            "group-hover:opacity-100",
            selected && "opacity-100"
          )}
        >
          Explore {category}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function ServicesSummary({ services, categoryImages = {} }: ServicesSummaryProps) {
  const categories = Array.from(new Set(services.map((service) => service.category)));
  const display =
    categories.length > 0
      ? categories
      : ["Cosmetic", "Surgery", "Orthodontics", "General", "Pediatric"];
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="section-padding bg-white">
      <div className="page-container">
        <div className="flex flex-col items-center gap-3 text-center">
          <Badge variant="secondary" className="h-auto px-4 py-1.5 text-sm font-semibold">
            Our Services
          </Badge>
          <h2>Comprehensive Care, Under One Roof</h2>
          <p className="max-w-2xl text-muted-foreground">
            From routine checkups to full smile transformations, every treatment is led by
            specialists using the latest dental technology.
          </p>
          <FeatureGate feature="multiPage">
          <Link
            href="/services"
            className={cn(
              "group mt-3 inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold",
              "bg-brand-teal/25 text-brand-navy",
              "ring-1 ring-brand-teal/40",
              "transition-[background-color,box-shadow,transform,color] duration-300 ease-out",
              "hover:bg-brand-teal/35 hover:text-brand-navy hover:ring-brand-teal/55",
              "hover:shadow-[0_12px_30px_-14px_rgba(0,178,216,0.65)]",
              "active:translate-y-px",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-teal/30"
            )}
          >
            View all services
            <ArrowRight className="size-4 text-brand-teal transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
          </Link>
          </FeatureGate>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((category, index) => (
            <FadeIn key={category} delay={index * 0.08}>
              <ServiceCategoryCard
                category={category}
                services={services}
                imageUrl={categoryImages[category as keyof CategoryImageMap]}
                selected={selected === category}
                onSelect={() =>
                  setSelected((current) => (current === category ? null : category))
                }
              />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
