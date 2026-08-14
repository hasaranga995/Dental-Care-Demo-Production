"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Show } from "@clerk/nextjs";
import { LayoutDashboard, LogIn, Menu, PhoneCall } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { BookAppointmentLink } from "@/components/booking/book-appointment-link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ToothLogo } from "@/components/tooth-logo";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { NAV_LINKS, isNavActive } from "@/components/navbar-links";
import { CLINIC, getWhatsAppHref } from "@/lib/clinic-config";
import { PLAN_DISPLAY_NAME } from "@/lib/demo-plan";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";
import { cn } from "@/lib/utils";

function MobileDashboardLink() {
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? "patient";
  const href = role === "admin" ? "/admin" : role === "doctor" ? "/doctor-portal" : "/dashboard";

  return (
    <SheetClose render={<Button className="justify-start" render={<Link href={href} />} />}>
      <LayoutDashboard className="size-4" />
      My Dashboard
    </SheetClose>
  );
}

export function NavbarMobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { has, plan } = useDemoPlan();
  const links = has("multiPage") ? NAV_LINKS : [];
  const planLabel = plan ? PLAN_DISPLAY_NAME[plan] : "Demo";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100vw-2rem,360px)]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2.5 text-primary">
            <ToothLogo className="size-7 shrink-0" />
            <span className="flex flex-col items-start leading-none">
              <span className="font-heading text-base font-semibold whitespace-nowrap text-foreground">
                {CLINIC.name}
              </span>
              <span className="mt-1 w-fit rounded-full bg-brand-teal/15 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-brand-teal uppercase">
                {CLINIC.demoVersion} · {planLabel}
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1 px-4" aria-label="Primary">
          {links.map((link) => {
            const active = isNavActive(pathname, link.href);
            return (
              <SheetClose
                key={link.href}
                render={
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted",
                      active ? "bg-secondary text-primary" : "text-foreground/80"
                    )}
                  />
                }
              >
                {link.label}
              </SheetClose>
            );
          })}
        </nav>
        <div className="mt-6 flex flex-col gap-3 px-4">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Talk to us
          </p>
          <Button variant="outline" className="justify-start" render={<a href={`tel:${CLINIC.phoneRaw}`} />}>
            <PhoneCall className="size-4" />
            Call {CLINIC.phone}
          </Button>
          {has("whatsapp") ? (
            <Button
              className="justify-start bg-[#25D366] text-white hover:bg-[#1ebe57] hover:text-white"
              render={
                <a href={getWhatsAppHref()} target="_blank" rel="noopener noreferrer" />
              }
            >
              <WhatsAppIcon className="size-4" />
              Chat on WhatsApp
            </Button>
          ) : null}
          {has("auth") ? (
            <>
              <Show when="signed-in">
                <MobileDashboardLink />
              </Show>
              <Show when="signed-out">
                <SheetClose
                  render={
                    <Link
                      href="/sign-in"
                      className={cn(
                        "group relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold text-white",
                        "bg-gradient-to-r from-[#0D4F5C] via-[#1A7A84] to-[#0D4F5C] bg-[length:200%_100%]",
                        "ring-1 ring-white/10",
                        "transition-all duration-300 hover:bg-[position:100%_0%]"
                      )}
                    />
                  }
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <LogIn className="relative size-4" />
                  <span className="relative">Sign In</span>
                </SheetClose>
              </Show>
            </>
          ) : null}
          {has("booking") ? (
            <SheetClose
              render={<Button variant="accent" className="justify-start" render={<BookAppointmentLink href="/book" />} />}
            >
              Book Appointment
            </SheetClose>
          ) : (
            <SheetClose
              render={
                <Button variant="accent" className="justify-start" render={<a href={`tel:${CLINIC.phoneRaw}`} />} />
              }
            >
              Call to Book
            </SheetClose>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
