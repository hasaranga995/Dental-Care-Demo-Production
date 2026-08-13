import type { ReactNode } from "react";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { requireRole } from "@/lib/auth";

export default async function DoctorPortalLayout({ children }: { children: ReactNode }) {
  await requireRole(["doctor"]);

  return (
    <PortalShell title="Doctor Portal" variant="doctor">
      {children}
    </PortalShell>
  );
}
