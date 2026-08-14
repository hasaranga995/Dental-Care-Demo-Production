import type { Metadata } from "next";
import { CalendarCheck, CalendarClock, Clock3, Crown, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AppointmentsTierTable } from "@/components/admin/appointments-tier-table";
import { getAllAppointments, getAdminStats } from "@/lib/data/appointments";
import { getDemoPlan } from "@/lib/demo-plan-server";

export const metadata: Metadata = {
  title: "Admin Dashboard | Dental Care",
};

export default async function AdminOverviewPage() {
  const [appointments, stats, plan] = await Promise.all([
    getAllAppointments(),
    getAdminStats(),
    getDemoPlan(),
  ]);
  const vipEnabled = plan === "premier";

  return (
    <div className="space-y-8">
      <div
        className={
          vipEnabled
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
            : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        }
      >
        <AdminStatCard
          label="Total Appointments"
          value={stats.total}
          icon={CalendarCheck}
          tone="total"
        />
        <AdminStatCard
          label="Pending Approval"
          value={stats.pending}
          icon={Clock3}
          tone="pending"
          hint={
            stats.pending > 0
              ? `${stats.pending} booking${stats.pending === 1 ? "" : "s"} need a decision`
              : "Queue is clear"
          }
        />
        <AdminStatCard
          label="Confirmed"
          value={stats.confirmed}
          icon={CalendarClock}
          tone="confirmed"
        />
        <AdminStatCard
          label="Today's Patients"
          value={stats.upcomingToday}
          icon={Users}
          tone="today"
        />
        {vipEnabled ? (
          <AdminStatCard
            label="VIP Arrivals"
            value={stats.vipUpcoming}
            icon={Crown}
            tone={stats.vipUpcoming > 0 ? "alert" : "vip"}
            hint={
              stats.vipUpcoming > 0
                ? "Upcoming VIP / VVIP bookings — prepare arrivals"
                : "No upcoming VIP bookings"
            }
            href="/admin/patients?tier=vip-only"
          />
        ) : null}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              All Appointments
            </h2>
            <p className="text-sm text-muted-foreground">
              {vipEnabled
                ? "Grouped by VVIP, VIP, and Standard so priority patients are easy to spot."
                : "Manage the full patient queue and update appointment status."}
            </p>
          </div>
        </div>
        <AppointmentsTierTable appointments={appointments} vipEnabled={vipEnabled} />
      </Card>
    </div>
  );
}
