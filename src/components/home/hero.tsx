import { Phone, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { BookOrCallButton } from "@/components/demo/feature-gate";
import { cn } from "@/lib/utils";
import { CLINIC } from "@/lib/clinic-config";
import type { HeroVideo } from "@/db/schema";

interface HeroProps {
  /** Admin-managed Cloudinary background video; renders the default gradient hero when absent. */
  video?: HeroVideo | null;
}

export function Hero({ video }: HeroProps) {
  const hasVideo = Boolean(video);

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        hasVideo ? "bg-[#0a3a44]" : "bg-gradient-to-b from-secondary via-background to-background"
      )}
    >
      {video ? (
        <>
          <video
            key={video.id}
            aria-hidden
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={video.posterUrl || undefined}
            className="absolute inset-0 size-full object-cover"
          >
            <source src={video.videoUrl} type="video/mp4" />
          </video>
          <div aria-hidden className="absolute inset-0 bg-[#0a3a44]/25" />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-[#0D4F5C]/70 via-[#0D4F5C]/35 to-transparent"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[#0a3a44]/40 via-transparent to-[#0a3a44]/15"
          />
        </>
      ) : (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-40 -left-24 size-72 rounded-full bg-gold/20 blur-3xl"
          />
        </>
      )}

      <div className="page-container relative grid grid-cols-1 items-center gap-8 pt-10 pb-16 sm:gap-10 sm:pt-14 sm:pb-20 md:pt-16 lg:gap-12 xl:grid-cols-2 xl:gap-14 xl:pt-20 xl:pb-24">
        <FadeIn className="min-w-0">
          <h1
            className={cn(
              "text-balance",
              hasVideo ? "text-white [text-shadow:0_2px_24px_rgba(10,31,61,0.55)]" : "text-foreground"
            )}
          >
            Your Smile.{" "}
            <span
              className={cn(
                "underline decoration-2 underline-offset-[0.18em]",
                hasVideo
                  ? "text-white decoration-[#A8E6E1]"
                  : "text-brand-navy decoration-brand-teal"
              )}
            >
              Our Passion.
            </span>
          </h1>

          <p
            className={cn(
              "mt-4 max-w-xl text-base leading-relaxed sm:mt-5 sm:text-lg",
              hasVideo
                ? "text-white/95 [text-shadow:0_1px_12px_rgba(10,31,61,0.45)]"
                : "text-muted-foreground"
            )}
          >
            From routine checkups and preventive care to cosmetic and pediatric dentistry, we
            provide personalized treatment in a comfortable, welcoming environment designed
            around you and your family.
          </p>

          <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <BookOrCallButton size="lg" variant="accent" className="w-full sm:w-auto" />
            <Button
              size="lg"
              variant="outline"
              className={cn(
                "w-full sm:w-auto",
                hasVideo &&
                  "border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              )}
              render={<a href={`tel:${CLINIC.emergencyPhoneRaw}`} />}
            >
              <Phone className="size-5 shrink-0" />
              <span className="sm:hidden">Emergency Call</span>
              <span className="hidden sm:inline">Emergency: {CLINIC.emergencyPhone}</span>
            </Button>
          </div>

          <div
            className={cn(
              "mt-8 flex flex-col gap-3 text-sm sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-6",
              hasVideo ? "text-white/90" : "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck
                className={cn("size-4 shrink-0", hasVideo ? "text-[#A8E6E1]" : "text-primary")}
              />
              Hospital-Grade Sterilization
            </div>
            <div className="flex items-center gap-2">
              <Sparkles
                className={cn("size-4 shrink-0", hasVideo ? "text-[#A8E6E1]" : "text-primary")}
              />
              Painless Laser Dentistry
            </div>
          </div>
        </FadeIn>

        {!hasVideo && (
          <FadeIn delay={0.15} className="min-w-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D4F5C] via-[#1A7A84] to-[#5EC8C0] p-6 pb-12 text-primary-foreground shadow-xl shadow-primary/15 sm:p-10 sm:pb-14 md:p-14 md:pb-16">
              <div
                aria-hidden
                className="absolute -top-10 -right-10 size-56 rounded-full border border-white/10"
              />
              <div
                aria-hidden
                className="absolute bottom-0 left-0 size-40 rounded-full bg-brand-teal/25 blur-2xl"
              />
              <p className="font-heading text-xs tracking-[0.2em] text-brand-teal uppercase sm:text-sm">
                {CLINIC.name}
              </p>
              <p className="mt-3 max-w-sm font-heading text-xl leading-snug font-medium sm:text-2xl md:text-3xl">
                {CLINIC.tagline}
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-primary-foreground/85 sm:mt-8 sm:space-y-3">
                <li>3D CT Cone-Beam Imaging</li>
                <li>Same-Day CAD/CAM Crowns</li>
                <li>Board-Certified Specialists</li>
                <li>Sedation &amp; Pediatric-Friendly Suites</li>
              </ul>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}
