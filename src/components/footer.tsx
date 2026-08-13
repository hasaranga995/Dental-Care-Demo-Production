"use client";

import Link from "next/link";
import { CheckCircle2, MapPin, Phone, Star } from "lucide-react";
import { ToothLogo } from "@/components/tooth-logo";
import { FacebookIcon, InstagramIcon } from "@/components/social-icons";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { CLINIC, getOperatingHoursList, getWhatsAppHref } from "@/lib/clinic-config";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About Us" },
  { href: "/team", label: "Meet the Team" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 font-sans text-xs font-semibold tracking-wider text-brand-teal uppercase">
      {children}
    </h3>
  );
}

export function Footer() {
  const hours = getOperatingHoursList();
  const { has } = useDemoPlan();
  const socialClass = cn(
    "grid size-8 place-items-center rounded-full",
    "border border-white/20 bg-white/10 text-white",
    "transition-[background-color,border-color,color] duration-200 ease-out",
    "hover:border-brand-teal/50 hover:bg-brand-teal hover:text-brand-navy"
  );
  const linkClass =
    "text-white/75 transition-colors duration-300 ease-out hover:text-teal-300";

  return (
    <footer className="relative overflow-hidden bg-brand-navy text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,#2dd4bf_10%,transparent),transparent_45%)]"
      />

      <div className="page-container relative grid grid-cols-1 gap-8 py-8 sm:gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:py-9">
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-brand-teal ring-1 ring-white/15">
              <ToothLogo className="size-5" />
            </span>
            <span className="font-heading text-base font-semibold text-white">{CLINIC.name}</span>
          </Link>

          <p className="mt-3 max-w-xs text-[13px] leading-5 text-white/75">{CLINIC.description}</p>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-white/70">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-white">{CLINIC.googleRating.score}</span>
            <span>({CLINIC.googleRating.count.toLocaleString()} Google reviews)</span>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <a href={CLINIC.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className={socialClass}>
              <InstagramIcon className="size-3.5" />
            </a>
            <a href={CLINIC.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className={socialClass}>
              <FacebookIcon className="size-3.5" />
            </a>
            <a href={CLINIC.social.google} target="_blank" rel="noreferrer" aria-label="Google Business" className={socialClass}>
              <Star className="size-3.5" />
            </a>
            {has("whatsapp") ? (
            <a
              href={getWhatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className={socialClass}
            >
              <WhatsAppIcon className="size-3.5" />
            </a>
            ) : null}
          </div>
        </div>

        {has("multiPage") ? (
        <div>
          <FooterHeading>Quick Links</FooterHeading>
          <ul className="space-y-2 text-[13px]">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        ) : (
        <div>
          <FooterHeading>Visit Us</FooterHeading>
          <p className="text-[13px] leading-5 text-white/75">
            One-page hospital site. Call reception to book a visit — hours and directions are listed here.
          </p>
        </div>
        )}

        <div>
          <FooterHeading>Operating Hours</FooterHeading>
          <ul className="space-y-2.5 text-[13px]">
            {hours.map((day) => (
              <li key={day.label} className="flex justify-between gap-3">
                <span className="text-white/80">{day.label}</span>
                <span className="text-white/60">{day.hours}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <FooterHeading>Get in Touch</FooterHeading>
          <ul className="space-y-2.5 text-[13px] text-white/80">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-white" strokeWidth={2.5} />
              <span>
                {CLINIC.address.line1}, {CLINIC.address.line2}
                <br />
                {CLINIC.address.city}, {CLINIC.address.country}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0 text-white" strokeWidth={2.5} />
              <a href={`tel:${CLINIC.phoneRaw}`} className={linkClass}>
                {CLINIC.phone}
              </a>
            </li>
            {has("whatsapp") ? (
            <li className="flex items-center gap-2">
              <WhatsAppIcon className="size-3.5 shrink-0 text-white" />
              <a href={getWhatsAppHref()} target="_blank" rel="noopener noreferrer" className={linkClass}>
                WhatsApp us
              </a>
            </li>
            ) : null}
          </ul>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {CLINIC.accreditations.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium tracking-wide text-white/80"
              >
                <CheckCircle2 className="size-3 shrink-0 text-brand-teal" strokeWidth={2.25} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-slate-800/80 py-3.5">
        <p className="page-container text-center text-[11px] text-white/55">
          © {new Date().getFullYear()} {CLINIC.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
