"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cancelAppointment } from "@/actions/appointments";
import { cn } from "@/lib/utils";

const CANCEL_REASONS = [
  "Change of plans",
  "Feeling unwell",
  "Scheduling conflict",
  "Other",
] as const;

export function DashboardCancelButton({
  appointmentId,
  isoDate,
}: {
  appointmentId: string;
  isoDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const within24h = new Date(isoDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  function handleConfirm() {
    if (!reason) {
      toast.error("Please choose a cancellation reason.");
      return;
    }
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
            variant="destructive"
            size="sm"
            className="gap-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90"
          />
        }
      >
        <X className="size-3.5" />
        Cancel
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel this visit?</DialogTitle>
          <DialogDescription>
            {within24h
              ? "Cancellations within 24 hours require direct phone confirmation. Please call reception if you still need to cancel."
              : "This cannot be undone. You can book a new visit anytime from the portal."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CANCEL_REASONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setReason(item)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  reason === item
                    ? "border-brand-navy bg-brand-navy text-white"
                    : "border-border bg-white text-muted-foreground hover:border-brand-teal/50 hover:text-foreground"
                )}
              >
                {item}
              </button>
            ))}
          </div>
          {reason === "Other" && (
            <Textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Tell us a little more…"
              className="min-h-20"
            />
          )}
        </div>
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
