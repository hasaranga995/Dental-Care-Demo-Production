"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceCard } from "@/components/services/service-card";
import { SERVICE_CATEGORIES } from "@/lib/data/service-categories";
import type { ServiceWithParsed } from "@/lib/data/services";

interface ServicesFilterGridProps {
  services: ServiceWithParsed[];
  initialCategory?: string;
  categoryImages?: Partial<Record<string, string>>;
}

export function ServicesFilterGrid({
  services,
  initialCategory,
  categoryImages = {},
}: ServicesFilterGridProps) {
  const [category, setCategory] = useState(
    initialCategory && (SERVICE_CATEGORIES as readonly string[]).includes(initialCategory)
      ? initialCategory
      : "All"
  );

  const filtered = useMemo(
    () => (category === "All" ? services : services.filter((s) => s.category === category)),
    [services, category]
  );

  return (
    <div>
      <Tabs value={category} onValueChange={(value) => setCategory(value as string)}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {SERVICE_CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="rounded-full border border-border px-4 py-2 data-active:border-primary data-active:bg-primary data-active:text-primary-foreground"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          No services found in this category yet. Check back soon.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              imageUrl={categoryImages[service.category]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
