import type { Metadata } from "next";
import { CalendarCheck, Clock3, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { getDoctorByUserId } from "@/lib/data/doctors";
import { getAppointmentsForDoctor } from "@/lib/data/appointments";
import {
  AppointmentStatusSelect,
  CancelAppointmentButton,
} from "@/components/dashboard/appointment-actions";
import { VipBadge } from "@/components/admin/vip-badge";
import { getDemoPlan } from "@/lib/demo-plan-server";

export const metadata: Metadata = {
  title: "Doctor Portal | Dental Care",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  confirmed: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  completed: "bg-sky-100 text-sky-800 hover:bg-sky-100",
  cancelled: "bg-rose-100 text-rose-800 hover:bg-rose-100",
};

export default async function DoctorPortalPage() {
  const currentUser = await requireUser();
  const doctorProfile = await getDoctorByUserId(currentUser.id);

  if (!doctorProfile) {
    return (
      <Card className="p-10 text-center">
        <Stethoscope className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No doctor profile is linked to your account yet. Please contact an administrator to
          set up your specialty and working hours.
        </p>
      </Card>
    );
  }

  const [appointments, plan] = await Promise.all([
    getAppointmentsForDoctor(doctorProfile.id),
    getDemoPlan(),
  ]);
  const vipEnabled = plan === "premier";
  const now = new Date();
  const upcoming = appointments.filter((a) => a.appointmentDate >= now && a.status !== "cancelled");
  const past = appointments.filter((a) => a.appointmentDate < now || a.status === "cancelled");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Upcoming Visits</p>
            <CalendarCheck className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
            {upcoming.length}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Pending Confirmation</p>
            <Clock3 className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
            {appointments.filter((a) => a.status === "pending").length}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Specialty</p>
            <Stethoscope className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-heading text-lg font-semibold text-foreground">
            {doctorProfile.specialty}
          </p>
        </Card>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Upcoming Patient Queue ({upcoming.length})
        </h2>
        <div className="space-y-4">
          {upcoming.map((appointment) => (
            <Card key={appointment.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-base font-semibold text-foreground">
                      {appointment.patientName}
                    </p>
                    {vipEnabled ? <VipBadge tier={appointment.patientCurrentTier} /> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {appointment.serviceName} ·{" "}
                    {appointment.appointmentDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {appointment.appointmentDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {appointment.patientEmail} · {appointment.patientPhone}
                  </p>
                </div>
                <Badge className={STATUS_STYLES[appointment.status] ?? ""}>
                  {appointment.status}
                </Badge>
              </div>
              {appointment.notes && (
                <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  {appointment.notes}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <AppointmentStatusSelect appointmentId={appointment.id} status={appointment.status} />
                <CancelAppointmentButton appointmentId={appointment.id} />
              </div>
            </Card>
          ))}
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          History ({past.length})
        </h2>
        <div className="space-y-3">
          {past.slice(0, 10).map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="font-medium text-foreground">{appointment.patientName}</span>
              <span className="text-muted-foreground">{appointment.serviceName}</span>
              <span className="text-muted-foreground">
                {appointment.appointmentDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <Badge className={STATUS_STYLES[appointment.status] ?? ""}>
                {appointment.status}
              </Badge>
            </div>
          ))}
          {past.length === 0 && <p className="text-sm text-muted-foreground">No history yet.</p>}
        </div>
      </section>
    </div>
  );
}
