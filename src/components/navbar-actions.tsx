"use client";

import Link from "next/link";
import { LogIn, PhoneCall } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { BookAppointmentLink } from "@/components/booking/book-appointment-link";
import { DashboardLink } from "@/components/dashboard-link";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { CLINIC, getWhatsAppHref } from "@/lib/clinic-config";
import { PLAN_DISPLAY_NAME } from "@/lib/demo-plan";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";
import { cn } from "@/lib/utils";

export function NavbarActions() {
  const { has } = useDemoPlan();

  return (
    <>
      <a
        href={`tel:${CLINIC.phoneRaw}`}
        aria-label={`Call ${CLINIC.phone}`}
        className="hidden items-center gap-2.5 rounded-full transition-opacity hover:opacity-90 lg:inline-flex"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/15">
          <PhoneCall className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] font-semibold tracking-wide text-foreground uppercase">
            Call us today:
          </span>
          <span className="text-sm font-bold whitespace-nowrap text-foreground">{CLINIC.phone}</span>
        </span>
      </a>

      {has("whatsapp") ? (
        <a
          href={getWhatsAppHref()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          title="Chat on WhatsApp"
          className="hidden size-9 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105 hover:bg-[#1ebe57] focus-visible:ring-3 focus-visible:ring-[#25D366]/40 focus-visible:outline-none lg:inline-flex"
        >
          <WhatsAppIcon className="size-4" />
        </a>
      ) : null}

      {has("auth") ? (
        <>
          <Show when="signed-in">
            <DashboardLink className="hidden lg:inline-flex" iconOnly />
            <span className="inline-flex size-8 shrink-0 items-center justify-center">
              <UserButton
                showName={false}
                appearance={{
                  elements: {
                    rootBox: {
                      width: "2rem",
                      height: "2rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    userButtonBox: { gap: "0" },
                    userButtonTrigger: { width: "2rem", height: "2rem" },
                    userButtonAvatarBox: { width: "2rem", height: "2rem" },
                    userButtonOuterIdentifier: { display: "none" },
                  },
                }}
              />
            </span>
          </Show>
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className={cn(
                "group relative hidden h-9 items-center gap-2 overflow-hidden rounded-full px-4 text-sm font-semibold text-white lg:inline-flex",
                "bg-gradient-to-r from-[#0D4F5C] via-[#1A7A84] to-[#0D4F5C] bg-[length:200%_100%]",
                "ring-1 ring-[#0D4F5C]/30",
                "transition-all duration-300 hover:bg-[position:100%_0%] hover:ring-brand-teal/40",
                "focus-visible:ring-3 focus-visible:ring-brand-teal/40 focus-visible:outline-none",
                "active:translate-y-0"
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              />
              <span className="relative flex size-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 transition-colors group-hover:bg-brand-teal/30">
                <LogIn className="size-3.5" strokeWidth={2.4} />
              </span>
              <span className="relative tracking-wide">Sign In</span>
            </Link>
          </Show>
        </>
      ) : null}

      {has("booking") ? (
        <Button
          size="sm"
          variant="accent"
          className="hidden shrink-0 sm:inline-flex"
          render={<BookAppointmentLink href="/book" />}
        >
          Book Appointment
        </Button>
      ) : (
        <Button
          size="sm"
          variant="accent"
          className="hidden shrink-0 sm:inline-flex"
          render={<a href={`tel:${CLINIC.phoneRaw}`} />}
        >
          Call to Book
        </Button>
      )}
    </>
  );
}

export function DemoPlanNavBadge() {
  const { plan } = useDemoPlan();
  const label = plan ? PLAN_DISPLAY_NAME[plan] : "Demo";

  return (
    <span className="mt-1 w-fit rounded-full bg-brand-teal/15 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-brand-teal uppercase sm:text-[10px]">
      {CLINIC.demoVersion} · {label}
    </span>
  );
}
