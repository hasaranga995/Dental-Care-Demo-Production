import type { Metadata } from "next";
import { CalendarCheck, CalendarClock, Clock3, Crown, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { VipBadge } from "@/components/admin/vip-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAllAppointments, getAdminStats } from "@/lib/data/appointments";
import { getDemoPlan } from "@/lib/demo-plan-server";
import {
  AppointmentStatusSelect,
  CancelAppointmentButton,
} from "@/components/dashboard/appointment-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard | Dental Care",
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AdminOverviewPage() {
  const [appointments, stats, plan] = await Promise.all([
    getAllAppointments(),
    getAdminStats(),
    getDemoPlan(),
  ]);
  const vipEnabled = plan === "premier";

  return (
    <div className="space-y-8">
      <div className={vipEnabled ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"}>
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

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              All Appointments
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage the full patient queue and update appointment status.
            </p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => {
              const isVip = vipEnabled && appointment.patientCurrentTier === "vip";
              const isVvip = vipEnabled && appointment.patientCurrentTier === "vvip";
              const isPriority = isVip || isVvip;

              return (
              <TableRow
                key={appointment.id}
                className={cn(
                  isVvip && "border-l-4 border-l-violet-500 bg-violet-50/70 hover:bg-violet-50",
                  isVip && "border-l-4 border-l-amber-500 bg-amber-50/80 hover:bg-amber-100/70"
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      className={cn(
                        "size-8",
                        isVvip && "ring-2 ring-violet-400 ring-offset-1",
                        isVip && "ring-2 ring-amber-400 ring-offset-1"
                      )}
                    >
                      <AvatarFallback
                        className={cn(
                          "text-xs",
                          isVvip && "bg-violet-200 font-semibold text-violet-900",
                          isVip && "bg-amber-200 font-semibold text-amber-900"
                        )}
                      >
                        {initials(appointment.patientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            "font-medium text-foreground",
                            isPriority && "font-semibold"
                          )}
                        >
                          {appointment.patientName}
                        </p>
                        {vipEnabled ? <VipBadge tier={appointment.patientCurrentTier} /> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{appointment.patientEmail}</p>
                      {vipEnabled && appointment.patientVipNotes && (
                        <p
                          className={cn(
                            "mt-0.5 max-w-xs truncate text-xs font-medium",
                            isVvip ? "text-violet-800" : "text-amber-800"
                          )}
                        >
                          {appointment.patientVipNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">{appointment.serviceName}</TableCell>
                <TableCell className="text-foreground">Dr. {appointment.doctorName}</TableCell>
                <TableCell>
                  <div className="text-foreground">
                    {appointment.appointmentDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {appointment.appointmentDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <AppointmentStatusSelect appointmentId={appointment.id} status={appointment.status} />
                </TableCell>
                <TableCell className="text-right">
                  <CancelAppointmentButton appointmentId={appointment.id} />
                </TableCell>
              </TableRow>
              );
            })}
            {appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No appointments booked yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
