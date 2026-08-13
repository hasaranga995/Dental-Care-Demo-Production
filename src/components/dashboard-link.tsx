"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardLinkProps {
  className?: string;
  /** Icon-only control for compact headers (same destination). */
  iconOnly?: boolean;
}

/**
 * Renders a link to the appropriate dashboard for the signed-in user's
 * role (patient -> /dashboard, doctor/admin -> /admin). Reads the role from
 * Clerk's `publicMetadata`, which is kept in sync with Postgres via
 * `setUserRole()` and the Clerk webhook.
 */
export function DashboardLink({ className, iconOnly = false }: DashboardLinkProps) {
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? "patient";
  const href = role === "admin" ? "/admin" : role === "doctor" ? "/doctor-portal" : "/dashboard";

  if (iconOnly) {
    return (
      <Button
        size="icon-sm"
        className={cn("size-9 rounded-full", className)}
        aria-label="My Dashboard"
        title="My Dashboard"
        render={<Link href={href} />}
      >
        <LayoutDashboard className="size-4" />
      </Button>
    );
  }

  return (
    <Button size="sm" className={cn(className)} render={<Link href={href} />}>
      <LayoutDashboard className="size-4" />
      My Dashboard
    </Button>
  );
}
