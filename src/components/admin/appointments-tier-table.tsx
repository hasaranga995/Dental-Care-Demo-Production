import { Crown, Gem, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VipBadge } from "@/components/admin/vip-badge";
import { AppointmentStatusSelect } from "@/components/dashboard/appointment-actions";
import type { AppointmentWithDetails } from "@/lib/data/appointments";
import type { PatientTier } from "@/db/schema";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const TIER_ORDER: PatientTier[] = ["vvip", "vip", "standard"];

const TIER_META: Record<
  PatientTier,
  {
    label: string;
    description: string;
    icon: typeof Gem;
    headerClass: string;
    rowClass: string;
    avatarRing: string;
    avatarFallback: string;
  }
> = {
  vvip: {
    label: "VVIP",
    description: "Highest-priority concierge patients",
    icon: Gem,
    headerClass: "border-violet-200 bg-violet-50/90 text-violet-950",
    rowClass: "border-l-4 border-l-violet-500 bg-violet-50/40 hover:bg-violet-50",
    avatarRing: "ring-2 ring-violet-400 ring-offset-1",
    avatarFallback: "bg-violet-200 font-semibold text-violet-900",
  },
  vip: {
    label: "VIP",
    description: "Priority recognition patients",
    icon: Crown,
    headerClass: "border-amber-200 bg-amber-50/90 text-amber-950",
    rowClass: "border-l-4 border-l-amber-500 bg-amber-50/50 hover:bg-amber-100/60",
    avatarRing: "ring-2 ring-amber-400 ring-offset-1",
    avatarFallback: "bg-amber-200 font-semibold text-amber-900",
  },
  standard: {
    label: "Standard",
    description: "General patient queue",
    icon: Users,
    headerClass: "border-border bg-muted/40 text-foreground",
    rowClass: "",
    avatarRing: "",
    avatarFallback: "text-xs",
  },
};

export function groupAppointmentsByTier(appointments: AppointmentWithDetails[]) {
  return {
    vvip: appointments.filter((a) => a.patientCurrentTier === "vvip"),
    vip: appointments.filter((a) => a.patientCurrentTier === "vip"),
    standard: appointments.filter(
      (a) => a.patientCurrentTier !== "vip" && a.patientCurrentTier !== "vvip"
    ),
  };
}

function AppointmentRow({
  appointment,
  vipEnabled,
  tier,
}: {
  appointment: AppointmentWithDetails;
  vipEnabled: boolean;
  tier: PatientTier;
}) {
  const meta = TIER_META[tier];
  const isPriority = vipEnabled && (tier === "vip" || tier === "vvip");

  return (
    <TableRow className={cn(vipEnabled && meta.rowClass)}>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar className={cn("size-8", vipEnabled && meta.avatarRing)}>
            <AvatarFallback className={cn("text-xs", vipEnabled && meta.avatarFallback)}>
              {initials(appointment.patientName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <p className={cn("font-medium text-foreground", isPriority && "font-semibold")}>
                {appointment.patientName}
              </p>
              {vipEnabled ? <VipBadge tier={appointment.patientCurrentTier} /> : null}
            </div>
            <p className="text-xs text-muted-foreground">{appointment.patientEmail}</p>
            {vipEnabled && appointment.patientVipNotes ? (
              <p
                className={cn(
                  "mt-0.5 max-w-xs truncate text-xs font-medium",
                  tier === "vvip" ? "text-violet-800" : "text-amber-800"
                )}
              >
                {appointment.patientVipNotes}
              </p>
            ) : null}
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
      <TableCell className="pr-4">
        <AppointmentStatusSelect appointmentId={appointment.id} status={appointment.status} />
      </TableCell>
    </TableRow>
  );
}

export function AppointmentsTierTable({
  appointments,
  vipEnabled,
}: {
  appointments: AppointmentWithDetails[];
  vipEnabled: boolean;
}) {
  if (appointments.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Date &amp; Time</TableHead>
            <TableHead className="w-[10.5rem] pr-4">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
              No appointments booked yet.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  if (!vipEnabled) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Date &amp; Time</TableHead>
            <TableHead className="w-[10.5rem] pr-4">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <AppointmentRow
              key={appointment.id}
              appointment={appointment}
              vipEnabled={false}
              tier="standard"
            />
          ))}
        </TableBody>
      </Table>
    );
  }

  const grouped = groupAppointmentsByTier(appointments);

  return (
    <div className="divide-y divide-border">
      {TIER_ORDER.map((tier) => {
        const rows = grouped[tier];
        const meta = TIER_META[tier];
        const Icon = meta.icon;

        return (
          <section key={tier}>
            <div
              className={cn(
                "flex items-center justify-between gap-3 border-y px-5 py-3",
                meta.headerClass
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-full bg-white/70 shadow-sm">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-wide uppercase">{meta.label}</p>
                  <p className="text-xs opacity-80">{meta.description}</p>
                </div>
              </div>
              <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold tabular-nums shadow-sm">
                {rows.length}
              </span>
            </div>

            {rows.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No {meta.label.toLowerCase()} appointments right now.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date &amp; Time</TableHead>
                    <TableHead className="w-[10.5rem] pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((appointment) => (
                    <AppointmentRow
                      key={appointment.id}
                      appointment={appointment}
                      vipEnabled
                      tier={tier}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        );
      })}
    </div>
  );
}
