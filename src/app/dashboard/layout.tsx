import type { ReactNode } from "react";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { getOrCreateCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getOrCreateCurrentUser();

  return (
    <PortalShell title="Patient Dashboard" variant="patient" isAdmin={user?.role === "admin"}>
      {children}
    </PortalShell>
  );
}
