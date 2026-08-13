"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cancelAppointment,
  getAvailableTimeSlots,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "@/actions/appointments";
import type { AppointmentStatus } from "@/db/schema";

function formatSlotLabel(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      const result = await cancelAppointment(appointmentId);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
          />
        }
      >
        <X className="size-3.5" />
        Cancel
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this appointment?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. You&apos;ll need to book a new appointment if you change
            your mind.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Keep Appointment
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            Confirm Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RescheduleDialogProps {
  appointmentId: string;
  doctorId: string;
  currentDateValue: string;
}

export function RescheduleAppointmentDialog({
  appointmentId,
  doctorId,
  currentDateValue,
}: RescheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(currentDateValue);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function loadSlots(nextDate: string) {
    if (!nextDate) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    try {
      const available = await getAvailableTimeSlots(doctorId, nextDate);
      setSlots(available);
    } finally {
      setSlotsLoading(false);
    }
  }

  function handleDateChange(nextDate: string) {
    setDate(nextDate);
    setTime("");
    void loadSlots(nextDate);
  }

  function handleSubmit() {
    if (!date || !time) {
      toast.error("Please select both a date and a time.");
      return;
    }
    const formData = new FormData();
    formData.set("appointmentId", appointmentId);
    formData.set("appointmentDate", date);
    formData.set("appointmentTime", time);

    startTransition(async () => {
      const result = await rescheduleAppointment(formData);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void loadSlots(date);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <CalendarClock className="size-3.5" />
        Reschedule
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>Pick a new date and time. We&apos;ll re-confirm by email.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reschedule-date">New date</Label>
            <input
              id="reschedule-date"
              type="date"
              min={today}
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div>
            <Label>New time</Label>
            {slotsLoading && (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading availability…
              </p>
            )}
            {!slotsLoading && date && slots.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">No open slots on this date.</p>
            )}
            {!slotsLoading && slots.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                      time === slot
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-primary/60"
                    }`}
                  >
                    {formatSlotLabel(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !date || !time}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Save New Time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_OPTIONS: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled"];

export function AppointmentStatusSelect({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(nextStatus: string | null) {
    if (!nextStatus) return;
    const formData = new FormData();
    formData.set("appointmentId", appointmentId);
    formData.set("status", nextStatus);

    startTransition(async () => {
      const result = await updateAppointmentStatus(formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" className="w-36 capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option} value={option} className="capitalize">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
