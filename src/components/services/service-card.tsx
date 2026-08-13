import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Baby, Braces, Clock3, Scissors, Sparkles, Stethoscope, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCategoryVisual } from "@/lib/data/service-categories";
import type { ServiceWithParsed } from "@/lib/data/services";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Cosmetic: Sparkles,
  Surgery: Scissors,
  Orthodontics: Braces,
  General: Stethoscope,
  Pediatric: Baby,
};

export function ServiceCard({
  service,
  imageUrl,
}: {
  service: ServiceWithParsed;
  imageUrl?: string;
}) {
  const Icon = CATEGORY_ICON[service.category] ?? Sparkles;
  const visual = getCategoryVisual(service.category);
  const photo = imageUrl || visual.fallbackImage;

  return (
    <Link
      href={`/services/${service.slug}`}
      className={cn(
        "service-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-left outline-none",
        "shadow-sm transition-[transform,box-shadow,border-color] duration-500 ease-out",
        "hover:-translate-y-1.5 hover:border-brand-teal/40 hover:shadow-[0_22px_40px_-24px_rgba(13,79,92,0.45)]",
        "focus-visible:ring-3 focus-visible:ring-brand-teal/35 focus-visible:ring-offset-2"
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-20 h-0.5 origin-left scale-x-0 bg-brand-teal transition-transform duration-500 ease-out group-hover:scale-x-100"
      />

      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={photo}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-110"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#0D4F5C]/80 via-[#0D4F5C]/15 to-transparent"
        />
        <div className="absolute inset-0 flex items-end justify-between gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-white/95 text-primary shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:bg-brand-teal group-hover:text-white">
            <Icon className="size-5" />
          </span>
          <Badge
            variant="outline"
            className={cn("border font-semibold shadow-sm backdrop-blur-sm", visual.tag)}
          >
            {service.category}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 py-5">
        <h3 className="font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {service.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {service.description}
        </p>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">{service.priceRange}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock3 className="size-3.5" />
            {service.durationMinutes} min
          </span>
        </div>

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          View treatment
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
