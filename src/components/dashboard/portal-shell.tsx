"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BellRing,
  BookOpen,
  CalendarPlus,
  Crown,
  GalleryHorizontal,
  Image as ImageIcon,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Shield,
  Video,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { ToothLogo } from "@/components/tooth-logo";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";
import { cn } from "@/lib/utils";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export type PortalVariant = "patient" | "admin" | "doctor";

const NAV_ITEMS_BY_VARIANT: Record<PortalVariant, PortalNavItem[]> = {
  patient: [
    { href: "/dashboard", label: "My Appointments", icon: LayoutDashboard },
    { href: "/book", label: "Book New Appointment", icon: CalendarPlus },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/patients", label: "Patients & VIP", icon: Crown },
    { href: "/admin/vip-desk", label: "VIP Desk", icon: BellRing },
    { href: "/admin/banners", label: "Banners & Promos", icon: GalleryHorizontal },
    { href: "/admin/hero-video", label: "Hero Video", icon: Video },
    { href: "/admin/category-images", label: "Service Tile Images", icon: ImageIcon },
    { href: "/admin/knowledge", label: "AI Knowledge Base", icon: BookOpen },
    { href: "/admin/support", label: "Support Desk", icon: LifeBuoy },
  ],
  doctor: [{ href: "/doctor-portal", label: "My Schedule", icon: LayoutDashboard }],
};

const ROLE_LABEL_BY_VARIANT: Record<PortalVariant, string> = {
  patient: "Patient",
  admin: "Admin",
  doctor: "Doctor",
};

interface PortalShellProps {
  title: string;
  variant: PortalVariant;
  isAdmin?: boolean;
  children: React.ReactNode;
}

function NavLinks({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: PortalNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin" || item.href === "/dashboard" || item.href === "/doctor-portal"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground/70 hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BackToHomeButton({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
        className
      )}
    >
      <ArrowLeft className="size-4" />
      Back to Home
    </Link>
  );
}

export function PortalShell({ title, variant, isAdmin = false, children }: PortalShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { has } = useDemoPlan();
  const navItems = [
    ...NAV_ITEMS_BY_VARIANT[variant].map((item) =>
      item.href === "/admin/patients"
        ? { ...item, label: has("vip") ? "Patients & VIP" : "Patients" }
        : item
    ),
    ...(variant === "patient" && isAdmin
      ? [{ href: "/admin", label: "Admin Dashboard", icon: Shield }]
      : []),
  ].filter((item) => {
    if (variant === "admin" && !has("fullAdmin") && item.href !== "/admin") return false;
    if (!has("vip") && item.href === "/admin/vip-desk") return false;
    if (!has("ai") && item.href === "/admin/knowledge") return false;
    return true;
  });
  const roleLabel = ROLE_LABEL_BY_VARIANT[variant];

  return (
    <div data-page-reveal className="flex min-h-screen bg-[#F3FAF9]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-5">
          <ToothLogo className="size-6 text-primary" />
          <span className="font-heading text-base font-semibold text-foreground">Dental Care</span>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <Badge variant="secondary" className="capitalize">
            {roleLabel}
          </Badge>
          <NavLinks navItems={navItems} pathname={pathname} />
        </div>
        <div className="shrink-0 border-t border-border p-4">
          <BackToHomeButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <SheetContent side="left" className="flex w-72 flex-col">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-primary">
                    <ToothLogo className="size-6" />
                    Dental Care
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-2 min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
                  <Badge variant="secondary" className="capitalize">
                    {roleLabel}
                  </Badge>
                  <NavLinks
                    navItems={navItems}
                    pathname={pathname}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </div>
                <SheetFooter>
                  <SheetClose
                    render={
                      <Link
                        href="/"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                      />
                    }
                  >
                    <ArrowLeft className="size-4" />
                    Back to Home
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <h1 className="font-heading text-lg font-semibold text-foreground">{title}</h1>
          </div>
          <UserButton />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
