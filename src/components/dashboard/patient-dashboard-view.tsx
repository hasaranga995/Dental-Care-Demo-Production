"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  History,
  Phone,
  Plus,
} from "lucide-react";
import { DashboardCancelButton } from "@/components/dashboard/patient-dashboard-actions";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CLINIC, getWhatsAppHref } from "@/lib/clinic-config";
import { DOCTOR_AVATAR_FALLBACK } from "@/lib/data/patient-dashboard-data";
import { cn } from "@/lib/utils";

export type DashboardAppointmentCard = {
  id: string;
  serviceName: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorImage: string | null;
  isoDate: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string;
  bookingChannel: string;
  doctorId: string;
  priceRange: string;
  durationMinutes: number;
};

export type PatientDashboardViewProps = {
  firstName: string;
  upcoming: DashboardAppointmentCard[];
  history: DashboardAppointmentCard[];
};

type TabId = "upcoming" | "history";

const CARD =
  "rounded-2xl border border-[#dceeed] bg-white shadow-[0_18px_50px_-32px_rgba(13,79,92,0.35)]";

function displayDoctor(name: string) {
  const cleaned = name.replace(/^Dr\.?\s*/i, "").trim();
  return cleaned ? `Dr. ${cleaned}` : "Your clinician";
}

function formatLong(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function channelNote(appointment: DashboardAppointmentCard) {
  const notes = appointment.notes.toLowerCase();
  if (notes.includes("lumina") || notes.includes("ai concierge")) {
    return "Booked via Lumina AI Concierge";
  }
  if (appointment.bookingChannel === "whatsapp" || notes.includes("whatsapp")) {
    return "Booked via WhatsApp";
  }
  if (appointment.bookingChannel === "admin") return "Booked by front desk";
  if (appointment.bookingChannel === "web") return "Booked via website";
  return null;
}

function statusStyle(status: DashboardAppointmentCard["status"]) {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-800";
  if (status === "pending") return "bg-amber-100 text-amber-800";
  if (status === "completed") return "bg-sky-100 text-sky-800";
  return "bg-red-100 text-red-800";
}

function statusLabel(status: DashboardAppointmentCard["status"]) {
  if (status === "confirmed") return "Confirmed";
  if (status === "pending") return "Pending";
  if (status === "completed") return "Completed";
  return "Cancelled";
}

export function PatientDashboardView({
  firstName,
  upcoming,
  history,
}: PatientDashboardViewProps) {
  const [tab, setTab] = useState<TabId>("upcoming");
  const { has } = useDemoPlan();
  const whatsappHref = getWhatsAppHref(
    "Hi Dental Care, I need help with an appointment from my dashboard."
  );

  const tabs = useMemo(
    () =>
      [
        { id: "upcoming" as const, label: "Upcoming", count: upcoming.length, icon: CalendarDays },
        { id: "history" as const, label: "History", count: history.length, icon: History },
      ],
    [upcoming.length, history.length]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-teal uppercase">
            Patient portal
          </p>
          <h2 className="mt-1 font-heading text-3xl font-semibold text-foreground">
            Welcome back, {firstName}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Manage upcoming visits, review history, and reach the concierge desk in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button className="rounded-full" render={<Link href="/book" />}>
            <Plus className="size-4" />
            Book New Appointment
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          label="Upcoming visits"
          value={`${upcoming.length} scheduled`}
          icon={CalendarDays}
          tone="teal"
        />
        <MetricCard
          label="Visit history"
          value={`${history.length} past visits`}
          icon={History}
          tone="navy"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-brand-navy bg-brand-navy text-white shadow-sm"
                  : "border-[#dceeed] bg-white text-muted-foreground hover:border-brand-teal/50 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  active ? "bg-white/15" : "bg-[#F3FAF9] text-brand-navy"
                )}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "upcoming" && (
            <section className="space-y-4">
              {upcoming.length === 0 ? (
                <EmptyState
                  title="No upcoming visits"
                  body="Reserve a chair and we will confirm your visit by email."
                />
              ) : (
                upcoming.map((appointment) => (
                  <UpcomingCard key={appointment.id} appointment={appointment} />
                ))
              )}
            </section>
          )}

          {tab === "history" && (
            <section className="space-y-4">
              {history.length === 0 ? (
                <EmptyState title="No visit history yet" body="Completed and past appointments will appear here." />
              ) : (
                history.map((appointment) => (
                  <HistoryCard key={appointment.id} appointment={appointment} />
                ))
              )}
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      <div className={cn(CARD, "flex flex-col gap-4 bg-gradient-to-r from-white to-[#F3FAF9] p-6 sm:flex-row sm:items-center sm:justify-between")}>
        <div>
          <p className="font-heading text-xl font-semibold text-foreground">
            Need help or an emergency reschedule?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {has("whatsapp")
              ? "WhatsApp concierge and the front desk are on standby."
              : "The front desk is on standby — call us to change a visit."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {has("whatsapp") ? (
            <Button className="rounded-full" render={<a href={whatsappHref} />}>
              <WhatsAppIcon className="size-4" />
              Chat on WhatsApp
            </Button>
          ) : null}
          <Button variant="outline" className="rounded-full" render={<a href={`tel:${CLINIC.phoneRaw}`} />}>
            <Phone className="size-4" />
            Call {CLINIC.phone}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof CalendarDays;
  tone: "teal" | "navy";
}) {
  const palette =
    tone === "teal"
      ? {
          card: "border-transparent bg-gradient-to-br from-[#5EC8C0] to-[#2A9D93] text-white shadow-[0_18px_50px_-28px_rgba(42,157,147,0.7)]",
          icon: "bg-white/20 text-white",
          label: "text-white/80",
        }
      : {
          card: "border-transparent bg-gradient-to-br from-[#0D4F5C] to-[#08343C] text-white shadow-[0_18px_50px_-28px_rgba(13,79,92,0.7)]",
          icon: "bg-white/15 text-[#5EC8C0]",
          label: "text-white/70",
        };

  return (
    <div className={cn("rounded-2xl p-5", palette.card)}>
      <p className={cn("flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase", palette.label)}>
        <span className={cn("inline-flex size-7 items-center justify-center rounded-full", palette.icon)}>
          <Icon className="size-3.5" />
        </span>
        {label}
      </p>
      <p className="mt-3 font-heading text-xl font-semibold">{value}</p>
    </div>
  );
}

function UpcomingCard({ appointment }: { appointment: DashboardAppointmentCard }) {
  const provenance = channelNote(appointment);
  return (
    <motion.article whileHover={{ y: -2 }} className={cn(CARD, "p-5 sm:p-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <Avatar className="size-14">
            <AvatarImage src={appointment.doctorImage || DOCTOR_AVATAR_FALLBACK} alt="" />
            <AvatarFallback className="bg-[#F3FAF9] text-brand-navy">DR</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-heading text-xl font-semibold text-foreground">{appointment.serviceName}</h3>
            <p className="mt-0.5 text-sm font-medium text-brand-navy">{displayDoctor(appointment.doctorName)}</p>
            {appointment.doctorSpecialty ? (
              <span className="mt-2 inline-flex rounded-full bg-[#F3FAF9] px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                {appointment.doctorSpecialty}
              </span>
            ) : null}
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="size-4 text-brand-teal" />
              {formatLong(appointment.isoDate)}
            </p>
            {provenance ? <p className="mt-2 text-xs text-muted-foreground">{provenance}</p> : null}
          </div>
        </div>
        <span className={cn("h-fit rounded-full px-3 py-1 text-xs font-semibold", statusStyle(appointment.status))}>
          {statusLabel(appointment.status)}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e7f3f1] pt-4">
        <DashboardCancelButton appointmentId={appointment.id} isoDate={appointment.isoDate} />
      </div>
    </motion.article>
  );
}

function HistoryCard({ appointment }: { appointment: DashboardAppointmentCard }) {
  const provenance = channelNote(appointment);
  return (
    <article className={cn(CARD, "p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">{appointment.serviceName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{displayDoctor(appointment.doctorName)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{formatShort(appointment.isoDate)}</p>
          {provenance ? (
            <p className="mt-2 inline-flex rounded-full bg-[#F3FAF9] px-2.5 py-1 text-[11px] text-brand-navy">
              {provenance}
            </p>
          ) : null}
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyle(appointment.status))}>
          {statusLabel(appointment.status)}
        </span>
      </div>
    </article>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={cn(CARD, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
      <CalendarDays className="size-8 text-brand-teal" />
      <p className="font-heading text-lg font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{body}</p>
      <Button className="mt-1 rounded-full" render={<Link href="/book" />}>
        <Plus className="size-4" />
        Book a visit
      </Button>
    </div>
  );
}
