import type { Metadata } from "next";
import { CalendarCheck, Clock3, Crown, Gem, Stethoscope, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { getDoctorByUserId } from "@/lib/data/doctors";
import { getAppointmentsForDoctor, type AppointmentWithDetails } from "@/lib/data/appointments";
import { groupAppointmentsByTier } from "@/components/admin/appointments-tier-table";
import { AppointmentStatusSelect } from "@/components/dashboard/appointment-actions";
import { VipBadge } from "@/components/admin/vip-badge";
import { getDemoPlan } from "@/lib/demo-plan-server";
import type { PatientTier } from "@/db/schema";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Doctor Portal | Dental Care",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "border-transparent bg-amber-500 text-white hover:bg-amber-500",
  confirmed: "border-transparent bg-emerald-600 text-white hover:bg-emerald-600",
  completed: "border-transparent bg-sky-600 text-white hover:bg-sky-600",
  cancelled: "border-transparent bg-red-600 text-white hover:bg-red-600",
};

const TIER_ORDER: PatientTier[] = ["vvip", "vip", "standard"];

const TIER_SECTION: Record<
  PatientTier,
  { label: string; icon: typeof Gem; className: string }
> = {
  vvip: {
    label: "VVIP",
    icon: Gem,
    className: "border-violet-200 bg-violet-50 text-violet-950",
  },
  vip: {
    label: "VIP",
    icon: Crown,
    className: "border-amber-200 bg-amber-50 text-amber-950",
  },
  standard: {
    label: "Standard",
    icon: Users,
    className: "border-border bg-muted/50 text-foreground",
  },
};

function UpcomingCard({
  appointment,
  vipEnabled,
}: {
  appointment: AppointmentWithDetails;
  vipEnabled: boolean;
}) {
  return (
    <Card className="p-5">
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
        <Badge className={STATUS_STYLES[appointment.status] ?? ""}>{appointment.status}</Badge>
      </div>
      {appointment.notes ? (
        <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          {appointment.notes}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <AppointmentStatusSelect appointmentId={appointment.id} status={appointment.status} />
      </div>
    </Card>
  );
}

export default async function DoctorPortalPage() {
  const currentUser = await requireUser();
  const doctorProfile = await getDoctorByUserId(currentUser.id);

  if (!doctorProfile) {
    return (
      <Card className="p-10 text-center">
        <Stethoscope className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No doctor profile is linked to your account yet. Please contact an administrator to set up
          your specialty and working hours.
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
  const groupedUpcoming = groupAppointmentsByTier(upcoming);

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
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Upcoming Patient Queue ({upcoming.length})
        </h2>

        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
        ) : vipEnabled ? (
          <div className="space-y-6">
            {TIER_ORDER.map((tier) => {
              const rows = groupedUpcoming[tier];
              const meta = TIER_SECTION[tier];
              const Icon = meta.icon;
              return (
                <div key={tier} className="space-y-3">
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-2.5",
                      meta.className
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-4" />
                      <span className="text-sm font-semibold tracking-wide uppercase">
                        {meta.label}
                      </span>
                    </div>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {rows.length}
                    </span>
                  </div>
                  {rows.length === 0 ? (
                    <p className="px-1 text-sm text-muted-foreground">
                      No {meta.label.toLowerCase()} patients in the upcoming queue.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {rows.map((appointment) => (
                        <UpcomingCard
                          key={appointment.id}
                          appointment={appointment}
                          vipEnabled
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((appointment) => (
              <UpcomingCard
                key={appointment.id}
                appointment={appointment}
                vipEnabled={false}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          History ({past.length})
        </h2>
        <div className="space-y-3">
          {past.slice(0, 10).map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="flex items-center gap-2 font-medium text-foreground">
                {appointment.patientName}
                {vipEnabled ? <VipBadge tier={appointment.patientCurrentTier} /> : null}
              </span>
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
