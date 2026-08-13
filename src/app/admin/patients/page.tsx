import type { Metadata } from "next";
import { Crown, Gem, Users } from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import {
  PatientDirectoryFiltersBar,
  PatientDirectoryTable,
  type PatientRow,
} from "@/components/admin/patient-vip-manager";
import { getPatientDirectory, getPatientDirectoryStats } from "@/lib/data/patients";
import type { PatientTier } from "@/db/schema";
import { getDemoPlan } from "@/lib/demo-plan-server";

export const metadata: Metadata = {
  title: "Patients | Dental Care Admin",
};

const TIER_FILTERS = ["all", "vip-only", "vip", "vvip", "standard"] as const;

type TierFilter = (typeof TIER_FILTERS)[number];

function parseTierFilter(value: string | undefined): TierFilter {
  return TIER_FILTERS.includes(value as TierFilter) ? (value as TierFilter) : "all";
}

export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const tier = parseTierFilter(params.tier);

  const [patients, stats, plan] = await Promise.all([
    getPatientDirectory({
      query,
      tier: tier === "all" ? "all" : tier === "vip-only" ? "vip-only" : (tier as PatientTier),
    }),
    getPatientDirectoryStats(),
    getDemoPlan(),
  ]);
  const vipEnabled = plan === "premier";

  const rows: PatientRow[] = patients.map((patient) => ({
    id: patient.id,
    name: patient.name,
    email: patient.email,
    phone: patient.phone,
    tier: patient.tier,
    vipNotes: patient.vipNotes,
    vipSince: patient.vipSince?.toISOString() ?? null,
    appointmentCount: patient.appointmentCount,
    lastAppointmentAt: patient.lastAppointmentAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {vipEnabled ? "Patients & VIP" : "Patients"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {vipEnabled
            ? "Mark a patient as VIP once and every future booking is recognized automatically — whichever channel they use. The front-desk assistant greets them personally, and the back-office WhatsApp desk is alerted the moment they book."
            : "Search and review every patient on file. Upgrade to Premier to add VIP recognition and desk alerts."}
        </p>
      </div>

      <div className={vipEnabled ? "grid grid-cols-1 gap-4 sm:grid-cols-3" : "grid grid-cols-1 gap-4"}>
        <AdminStatCard
          label="Total Patients"
          value={stats.total}
          icon={Users}
          tone="total"
          hint="Everyone on file"
        />
        {vipEnabled ? (
          <>
        <AdminStatCard
          label="VIP"
          value={stats.vip}
          icon={Crown}
          tone="vip"
          hint="Recognized priority patients"
          href="/admin/patients?tier=vip"
        />
        <AdminStatCard
          label="VVIP"
          value={stats.vvip}
          icon={Gem}
          tone="vvip"
          hint="Highest-priority concierge patients"
          href="/admin/patients?tier=vvip"
        />
          </>
        ) : null}
      </div>

      <PatientDirectoryFiltersBar defaultQuery={query} defaultTier={tier} vipEnabled={vipEnabled} />
      <PatientDirectoryTable patients={rows} vipEnabled={vipEnabled} />
    </div>
  );
}
