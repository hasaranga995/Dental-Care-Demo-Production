import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Braces,
  CalendarCheck,
  CircleCheckBig,
  Clock3,
  Scissors,
  Sparkles,
  Stethoscope,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getAllServices, getServiceBySlug } from "@/lib/data/services";
import { getCategoryImageMap } from "@/lib/data/category-images";
import { getProcedureImagesForCategory } from "@/lib/data/procedure-images";
import { getCategoryVisual } from "@/lib/data/service-categories";
import { SensitiveProcedureGallery } from "@/components/services/sensitive-procedure-gallery";
import { CLINIC } from "@/lib/clinic-config";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Cosmetic: Sparkles,
  Surgery: Scissors,
  Orthodontics: Braces,
  General: Stethoscope,
  Pediatric: Baby,
};

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) return { title: "Service Not Found" };

  return {
    title: service.name,
    description: service.description,
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) notFound();

  const Icon = CATEGORY_ICON[service.category] ?? Sparkles;
  const visual = getCategoryVisual(service.category);
  const [allServices, categoryImages] = await Promise.all([getAllServices(), getCategoryImageMap()]);
  const related = allServices
    .filter((s) => s.category === service.category && s.id !== service.id)
    .slice(0, 3);
  const heroImage = categoryImages[service.category as keyof typeof categoryImages] || visual.fallbackImage;
  const procedureImages = getProcedureImagesForCategory(service.category);

  return (
    <div className="relative overflow-hidden">
      <section className="relative isolate min-h-[22rem] overflow-hidden sm:min-h-[26rem]">
        <Image
          src={heroImage}
          alt={visual.imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#0D4F5C]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D4F5C] via-[#0D4F5C]/35 to-black/20" />

        <div className="page-container relative z-10 flex min-h-[22rem] flex-col justify-end py-10 sm:min-h-[26rem] sm:py-14">
          <Link
            href="/services"
            className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            All services
          </Link>

          <Badge variant="outline" className={cn("w-fit border-0 font-semibold shadow-sm", visual.chip)}>
            {service.category}
          </Badge>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-semibold text-white sm:text-5xl">
            {service.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {service.description}
          </p>
        </div>
      </section>

      <div className="relative">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={heroImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.14] blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F3FAF9] via-white/88 to-[#F3FAF9]" />
        </div>

        <div className="page-container relative py-10 sm:py-14">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:gap-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Treatment overview</p>
                  <p className="font-heading text-xl font-semibold text-foreground">{service.name}</p>
                </div>
              </div>

              {service.fullDetails && (
                <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                  {service.fullDetails}
                </div>
              )}

              <SensitiveProcedureGallery images={procedureImages} />

              {service.treatmentSteps.length > 0 && (
                <div className="mt-12">
                  <h2 className="font-heading text-2xl font-semibold text-foreground">Treatment steps</h2>
                  <ol className="mt-6 space-y-5">
                    {service.treatmentSteps.map((step, index) => (
                      <li key={step.title} className="flex gap-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{step.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {service.faqs.length > 0 && (
                <div className="mt-12">
                  <h2 className="font-heading text-2xl font-semibold text-foreground">
                    Frequently asked questions
                  </h2>
                  <Accordion className="mt-4">
                    {service.faqs.map((faq, index) => (
                      <AccordionItem key={faq.question} value={`faq-${index}`}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent>{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {related.length > 0 && (
                <div className="mt-14">
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    Related {service.category} services
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {related.map((item) => (
                      <Link
                        key={item.id}
                        href={`/services/${item.slug}`}
                        className="group rounded-xl border border-border bg-white/80 p-4 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-md"
                      >
                        <span className="flex items-center justify-between gap-2">
                          {item.name}
                          <ArrowRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card className="border-primary/20 bg-white/90 p-6 shadow-lg shadow-primary/5 backdrop-blur-md">
                <CardContent className="space-y-4 px-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Tag className="size-4" /> Price range
                    </span>
                    <span className="font-semibold text-foreground">{service.priceRange}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock3 className="size-4" /> Duration
                    </span>
                    <span className="font-semibold text-foreground">
                      {service.durationMinutes} minutes
                    </span>
                  </div>

                  <ul className="space-y-2 border-t border-border pt-4 text-sm text-foreground/80">
                    <li className="flex items-center gap-2">
                      <CircleCheckBig className="size-4 text-primary" /> Board-certified specialists
                    </li>
                    <li className="flex items-center gap-2">
                      <CircleCheckBig className="size-4 text-primary" /> Modern sterilization protocol
                    </li>
                    <li className="flex items-center gap-2">
                      <CircleCheckBig className="size-4 text-primary" /> Flexible financing available
                    </li>
                  </ul>

                  <Button size="lg" className="w-full" render={<Link href={`/book?service=${service.slug}`} />}>
                    <CalendarCheck className="size-4" />
                    Book this service
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Or call us at{" "}
                    <a href={`tel:${CLINIC.phoneRaw}`} className="font-semibold text-primary">
                      {CLINIC.phone}
                    </a>
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
