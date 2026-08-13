import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Cpu, Radar, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/fade-in";
import { FeatureGate, BookOrCallButton } from "@/components/demo/feature-gate";
import type { DoctorWithUser } from "@/lib/data/doctors";
import { cn } from "@/lib/utils";

const TECH_FEATURES = [
  {
    icon: Radar,
    title: "3D CT Cone-Beam Imaging",
    description: "Millimeter-precise diagnostics for implants and root canals.",
  },
  {
    icon: Zap,
    title: "Laser Dentistry",
    description: "Faster healing, minimal discomfort, virtually silent procedures.",
  },
  {
    icon: Cpu,
    title: "Same-Day CAD/CAM Crowns",
    description: "Digitally milled restorations completed in a single visit.",
  },
  {
    icon: Sparkles,
    title: "Digital Smile Design",
    description: "Preview your results before treatment even begins.",
  },
];

/** Curated medical headshot placeholders used when a doctor has no uploaded photo. */
const PLACEHOLDER_AVATARS = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&h=1000&q=80",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&h=1000&q=80",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=800&h=1000&q=80",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&h=1000&q=80",
] as const;

const FALLBACK_DOCTORS = [
  {
    id: "1",
    user: { name: "Anura Perera" },
    specialty: "Cosmetic & Restorative Dentistry",
    image: PLACEHOLDER_AVATARS[0],
  },
  {
    id: "2",
    user: { name: "Dilini Silva" },
    specialty: "Oral & Maxillofacial Surgery",
    image: PLACEHOLDER_AVATARS[1],
  },
  {
    id: "3",
    user: { name: "Kavinda Fernando" },
    specialty: "Orthodontics & Invisalign",
    image: PLACEHOLDER_AVATARS[2],
  },
  {
    id: "4",
    user: { name: "Nimali Jayawardena" },
    specialty: "Pediatric Dentistry",
    image: PLACEHOLDER_AVATARS[3],
  },
];

interface DoctorShowcaseProps {
  doctors: DoctorWithUser[];
}

interface DoctorCardData {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

function DoctorCard({ doctor, index }: { doctor: DoctorCardData; index: number }) {
  const displayName = doctor.name.replace(/^Dr\.?\s+/i, "");

  return (
    <FadeIn delay={index * 0.08} className="h-full">
      <Link href={`/team#${doctor.id}`} className="block h-full">
      <article
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white",
          "ring-1 ring-border/80",
          "shadow-[0_12px_40px_-28px_rgba(13,79,92,0.35)]",
          "transition-[box-shadow,ring-color] duration-500 ease-out",
          "hover:ring-brand-teal/25",
          "hover:shadow-[0_24px_50px_-28px_rgba(13,79,92,0.45)]"
        )}
      >
        {/* Portrait */}
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <Image
            src={doctor.image}
            alt={doctor.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          {/* Soft depth gradient */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-brand-navy/15 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100"
          />

          {/* Specialty chip on photo */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-navy shadow-sm backdrop-blur-sm">
              <Award className="size-3 text-brand-teal" aria-hidden />
              Specialist
            </span>
          </div>

          {/* Name overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="font-heading text-xl font-semibold text-white drop-shadow-sm">
              Dr. {displayName}
            </h3>
            <p className="mt-1.5 text-sm leading-snug text-white/80">{doctor.specialty}</p>
          </div>
        </div>

        {/* Accent bar */}
        <span
          aria-hidden
          className="h-1 w-full origin-left scale-x-0 bg-brand-teal transition-transform duration-500 ease-out group-hover:scale-x-100"
        />
      </article>
      </Link>
    </FadeIn>
  );
}

export function DoctorShowcase({ doctors }: DoctorShowcaseProps) {
  const display: DoctorCardData[] =
    doctors.length > 0
      ? doctors.slice(0, 4).map((doctor, index) => ({
          id: doctor.id,
          name: doctor.user.name,
          specialty: doctor.specialty,
          image: doctor.image || PLACEHOLDER_AVATARS[index % PLACEHOLDER_AVATARS.length],
        }))
      : FALLBACK_DOCTORS.map((doctor) => ({
          id: doctor.id,
          name: doctor.user.name,
          specialty: doctor.specialty,
          image: doctor.image,
        }));

  return (
    <section className="section-padding bg-secondary">
      <div className="page-container">
        <div className="flex flex-col items-center gap-3 text-center">
          <Badge variant="secondary" className="h-auto px-4 py-1.5 text-sm font-semibold">
            Meet the Team
          </Badge>
          <h2>Specialists You Can Trust</h2>
          <p className="max-w-2xl text-muted-foreground">
            Every clinician is board-certified and trained on the latest minimally invasive
            techniques — backed by hospital-grade technology.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {display.map((doctor, index) => (
            <DoctorCard key={doctor.id} doctor={doctor} index={index} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
          <FeatureGate feature="multiPage">
          <Link
            href="/team"
            className={cn(
              "group inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold",
              "bg-white text-brand-navy ring-1 ring-border",
              "transition-[background-color,box-shadow,color] duration-300 ease-out",
              "hover:bg-secondary hover:ring-brand-teal/40"
            )}
          >
            View full team
            <ArrowRight className="size-4 text-brand-teal transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          </FeatureGate>
          <BookOrCallButton
            size="default"
            variant="accent"
            className="rounded-full"
            bookLabel="Book with a specialist"
            callLabel="Call a specialist"
          />
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {TECH_FEATURES.map((feature, index) => (
            <FadeIn key={feature.title} delay={index * 0.08}>
              <div
                className={cn(
                  "group flex h-full flex-col gap-3 rounded-2xl bg-white p-6",
                  "ring-1 ring-border/80 transition-[box-shadow,ring-color] duration-500 ease-out",
                  "hover:ring-brand-teal/20 hover:shadow-[0_16px_40px_-28px_rgba(13,79,92,0.35)]"
                )}
              >
                <div
                  className={cn(
                    "relative flex size-11 items-center justify-center overflow-hidden rounded-xl",
                    "bg-accent text-brand-teal transition-transform duration-500 ease-out",
                    "group-hover:scale-105"
                  )}
                >
                  <span
                    aria-hidden
                    className="absolute top-1/2 left-1/2 size-[160%] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-brand-teal transition-transform duration-500 ease-out group-hover:scale-100"
                  />
                  <feature.icon className="relative z-10 size-5 transition-colors duration-500 group-hover:text-white" />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
