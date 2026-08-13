"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/team", label: "Meet the Team" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
] as const;

/** Home is exact-match only; other routes stay active on nested paths (e.g. /services/whitening). */
export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavbarDesktopLinks() {
  const pathname = usePathname();
  const { has } = useDemoPlan();
  if (!has("multiPage")) return null;

  return (
    <nav
      className="ml-1 hidden items-center gap-0.5 lg:flex xl:ml-3 xl:gap-1"
      aria-label="Primary"
    >
      {NAV_LINKS.map((link) => {
        const active = isNavActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-colors xl:px-3 xl:py-2",
              active
                ? "bg-secondary text-primary"
                : "text-foreground/75 hover:bg-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
