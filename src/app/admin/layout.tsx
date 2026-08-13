import type { ReactNode } from "react";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(["admin"]);

  return (
    <PortalShell title="Admin Dashboard" variant="admin">
      {children}
    </PortalShell>
  );
}
