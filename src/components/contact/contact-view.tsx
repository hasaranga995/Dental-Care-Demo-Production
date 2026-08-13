"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Accessibility,
  Car,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  TrainFront,
} from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { EmergencyBanner } from "@/components/contact/emergency-banner";
import { OpenStatusBadge } from "@/components/contact/open-status-badge";
import { ContactForm } from "@/components/contact/contact-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";
import {
  CLINIC,
  getClinicFullAddress,
  getEmergencyWhatsAppHref,
  getOperatingHoursList,
} from "@/lib/clinic-config";

const MAP_LAUNCHERS = [
  {
    label: "Open in Google Maps",
    href: CLINIC.address.mapsGoogleUrl,
    emoji: "🗺️",
    icon: MapPin,
  },
  {
    label: "Apple Maps",
    href: CLINIC.address.mapsAppleUrl,
    emoji: "🍎",
    icon: Navigation,
  },
  {
    label: "Waze Directions",
    href: CLINIC.address.mapsWazeUrl,
    emoji: "🚗",
    icon: Car,
  },
] as const;

const AMENITIES = [
  {
    icon: Car,
    emoji: "🏎️",
    title: "Complimentary Valet & Parking",
    body: CLINIC.parkingInfo,
  },
  {
    icon: TrainFront,
    emoji: "🚇",
    title: "Public Transit & Metro",
    body: CLINIC.transitInfo,
  },
  {
    icon: Accessibility,
    emoji: "♿",
    title: "Accessibility & Languages",
    body: CLINIC.accessibilityInfo,
  },
] as const;

const EMERGENCY_FAQS = [
  {
    question: "What qualifies as a dental emergency?",
    answer:
      "Severe or escalating toothache, facial trauma, uncontrolled bleeding, a knocked-out or displaced tooth, swelling that affects breathing or swallowing, and post-surgical complications. If you are unsure, call the 24/7 emergency line — our on-call maxillofacial surgeon will triage immediately.",
  },
  {
    question: "Do I need an appointment for emergency treatment?",
    answer: `True emergencies are seen without a routine appointment. Call ${CLINIC.emergencyPhone} so the emergency room can prepare a chair, imaging, and the on-call surgeon. Walk-ins are accepted; calling ahead shortens wait time.`,
  },
  {
    question: "Is valet parking really free for all patients?",
    answer:
      "Yes. Complimentary valet is available at the main lobby entrance for every patient, including emergency visits. Forty secure basement bays are also available via Dockside Lane at no charge.",
  },
] as const;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=2400&q=80";

export function ContactView() {
  const [hours, setHours] = useState(() => getOperatingHoursList());
  const fullAddress = getClinicFullAddress();
  const whatsappHref = getEmergencyWhatsAppHref();
  const { has } = useDemoPlan();

  useEffect(() => {
    const interval = setInterval(() => setHours(getOperatingHoursList()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#F4FAF9]">
      <div className="relative overflow-hidden pb-16 text-white sm:pb-20">
        <Image
          src={HERO_IMAGE}
          alt="Dental Care Private Hospital reception lounge"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%]"
        />
        <div aria-hidden className="absolute inset-0 bg-[#071820]/50" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#071820]/80 via-[#0D4F5C]/55 to-[#071820]/25"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#071820]/75 via-transparent to-[#071820]/30"
        />

        <EmergencyBanner />

        <div className="page-container relative pt-10 sm:pt-12 lg:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <h1 className="text-balance font-heading text-3xl font-semibold tracking-tight !text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              <span className="bg-gradient-to-r from-white via-teal-100 to-amber-200 bg-clip-text text-transparent">
                We&apos;re Here for Your Smile — Day or Night
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              Have a question about treatment, pricing, or need immediate assistance? Reach our
              care team via phone{has("whatsapp") ? ", WhatsApp," : ""} or the contact form.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="page-container relative z-10 -mt-8 pb-6 sm:-mt-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-10">
          <FadeIn>
            <div className="rounded-2xl border border-white/60 bg-white/75 p-6 shadow-[0_24px_60px_-32px_rgba(13,79,92,0.45)] backdrop-blur-xl sm:p-8">
              <h2 className="font-heading text-xl font-semibold text-[#0D4F5C]">
                Send Us a Message
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a topic, tell us how to reach you, and our concierge desk will follow up.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/60 bg-white/75 p-6 shadow-[0_24px_60px_-32px_rgba(13,79,92,0.45)] backdrop-blur-xl">
                <OpenStatusBadge />

                <ul className="mt-5 space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#0D4F5C]/8 text-[#0D4F5C]">
                      <MapPin className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0D4F5C]">Hospital Address</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {fullAddress}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#0D4F5C]/8 text-[#0D4F5C]">
                      <Phone className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0D4F5C]">Direct Line</p>
                      <a
                        href={`tel:${CLINIC.phoneRaw}`}
                        className="mt-0.5 block min-h-11 text-sm text-muted-foreground hover:text-[#0D4F5C]"
                      >
                        {CLINIC.phone}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                      <Phone className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0D4F5C]">Emergency Line</p>
                      <a
                        href={`tel:${CLINIC.emergencyPhoneRaw}`}
                        className="mt-0.5 block min-h-11 font-semibold text-red-700 hover:text-red-800"
                      >
                        {CLINIC.emergencyPhone}
                      </a>
                    </div>
                  </li>
                  {has("whatsapp") ? (
                  <li className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <WhatsAppIcon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0D4F5C]">WhatsApp Hotline</p>
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block min-h-11 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                      >
                        {CLINIC.emergencyPhone}
                      </a>
                    </div>
                  </li>
                  ) : null}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/75 p-6 shadow-[0_24px_60px_-32px_rgba(13,79,92,0.45)] backdrop-blur-xl">
                <p className="flex items-center gap-2 font-semibold text-[#0D4F5C]">
                  <Clock3 className="size-4 text-amber-600" />
                  Operating Hours
                </p>
                <ul className="mt-3 space-y-1">
                  {hours.map((day) => (
                    <li
                      key={day.key}
                      className={
                        day.isToday
                          ? "flex justify-between rounded-lg border border-amber-300/60 bg-gradient-to-r from-amber-50 to-teal-50 px-3 py-2 text-sm font-semibold text-[#0D4F5C] shadow-[0_0_18px_-8px_rgba(245,158,11,0.85)]"
                          : "flex justify-between px-3 py-1.5 text-sm text-muted-foreground"
                      }
                    >
                      <span>{day.label}</span>
                      <span>{day.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="page-container py-10 sm:py-14">
        <FadeIn>
          <h2 className="font-heading text-2xl font-semibold text-[#0D4F5C] sm:text-3xl">
            Hospital Arrival & Amenities
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            From valet to metro access, arriving at {CLINIC.legalName} is designed to feel
            effortless.
          </p>
        </FadeIn>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {AMENITIES.map((item, index) => (
            <FadeIn key={item.title} delay={index * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="h-full rounded-2xl border border-white/70 bg-white/70 p-6 shadow-[0_20px_50px_-32px_rgba(13,79,92,0.4)] backdrop-blur-xl"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-[#0D4F5C]/8 text-[#0D4F5C]">
                  <item.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold text-[#0D4F5C]">
                  <span className="mr-1.5" aria-hidden>
                    {item.emoji}
                  </span>
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="page-container pb-10 sm:pb-14">
        <FadeIn>
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-[#071820] p-3 shadow-[0_30px_70px_-36px_rgba(7,24,32,0.7)] sm:p-4">
            <div className="relative overflow-hidden rounded-2xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 ring-1 ring-inset ring-white/15"
              />
              <iframe
                src={CLINIC.address.mapsEmbedUrl}
                title={`${CLINIC.legalName} location`}
                className="h-72 w-full border-0 grayscale-[20%] contrast-[1.05] sm:h-96"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-[#071820]/70 to-transparent"
              />
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {MAP_LAUNCHERS.map((launcher) => (
                <a
                  key={launcher.label}
                  href={launcher.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
                >
                  <span aria-hidden>{launcher.emoji}</span>
                  {launcher.label}
                </a>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="page-container pb-16 sm:pb-20">
        <FadeIn>
          <div className="rounded-2xl border border-white/60 bg-white/75 p-6 shadow-[0_24px_60px_-32px_rgba(13,79,92,0.45)] backdrop-blur-xl sm:p-8">
            <h2 className="font-heading text-2xl font-semibold text-[#0D4F5C]">
              Emergency FAQ
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Immediate answers while you are on the way to the hospital.
            </p>
            <Accordion className="mt-5">
              {EMERGENCY_FAQS.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={`emergency-faq-${index}`}
                  className="border-[#dceeed]"
                >
                  <AccordionTrigger className="py-3.5 text-[#0D4F5C] hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
