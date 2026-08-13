import Link from "next/link";
import { ToothLogo } from "@/components/tooth-logo";
import { NavbarMobileMenu } from "@/components/navbar-mobile-menu";
import { NavbarDesktopLinks } from "@/components/navbar-links";
import { DemoPlanNavBadge, NavbarActions } from "@/components/navbar-actions";
import { CLINIC } from "@/lib/clinic-config";

/**
 * Compact header: brand + links on the left; actions on the right.
 * Phone number shows on laptop/desktop only (hidden on mobile — available in the menu).
 */
export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80">
      <div className="page-container flex h-16 items-center gap-3 sm:h-[4.25rem] sm:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-primary">
          <ToothLogo className="size-7 shrink-0 sm:size-8" />
          <span className="flex flex-col leading-none">
            <span className="font-heading text-base font-semibold tracking-tight whitespace-nowrap text-foreground sm:text-lg">
              {CLINIC.name}
            </span>
            <DemoPlanNavBadge />
          </span>
        </Link>

        <NavbarDesktopLinks />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <NavbarActions />
          <NavbarMobileMenu />
        </div>
      </div>
    </header>
  );
}
