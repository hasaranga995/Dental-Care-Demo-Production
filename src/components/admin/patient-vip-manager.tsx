"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Crown, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VipBadge } from "@/components/admin/vip-badge";
import { setPatientTier } from "@/actions/patients";
import type { PatientTier } from "@/db/schema";
import { cn } from "@/lib/utils";

export interface PatientRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tier: PatientTier;
  vipNotes: string;
  vipSince: string | null;
  appointmentCount: number;
  lastAppointmentAt: string | null;
}

const TIER_OPTIONS: { value: PatientTier; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "vip", label: "VIP" },
  { value: "vvip", label: "VVIP" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "All patients" },
  { value: "vip-only", label: "VIP & VVIP only" },
  { value: "vip", label: "VIP only" },
  { value: "vvip", label: "VVIP only" },
  { value: "standard", label: "Standard only" },
];

function displayPatientEmail(email: string): string {
  return email.replace(/\+p\d+(?:\.\d+)?@/, "@");
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PatientTierDialog({ patient }: { patient: PatientRow }) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<PatientTier>(patient.tier);
  const [notes, setNotes] = useState(patient.vipNotes);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    const formData = new FormData();
    formData.set("patientId", patient.id);
    formData.set("tier", tier);
    formData.set("vipNotes", notes);

    startTransition(async () => {
      const result = await setPatientTier(formData);
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTier(patient.tier);
          setNotes(patient.vipNotes);
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Crown className="size-3.5" />
        {patient.tier === "standard" ? "Mark VIP" : "Edit VIP"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{patient.name}</DialogTitle>
          <DialogDescription>
            Set the recognition tier for this patient. It applies to every future booking across
            WhatsApp, the website, and reception — you only need to mark them once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Recognition tier</Label>
            <Select
              value={tier}
              onValueChange={(next) => next && setTier(next as PatientTier)}
              disabled={isPending}
            >
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`vip-notes-${patient.id}`}>
              Concierge notes {tier === "standard" && "(cleared for standard patients)"}
            </Label>
            <Textarea
              id={`vip-notes-${patient.id}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={isPending || tier === "standard"}
              rows={4}
              maxLength={1000}
              placeholder="Prefers Dr. Nimali, morning appointments, private waiting area. Anxious about injections."
              className="mt-1.5"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Shared with the front-desk assistant and back-office alerts. Never read out to the
              patient.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PatientDirectoryFiltersBar({
  defaultQuery,
  defaultTier,
  vipEnabled = true,
}: {
  defaultQuery: string;
  defaultTier: string;
  vipEnabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultQuery);
  const [isPending, startTransition] = useTransition();

  function apply(next: { q?: string; tier?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextQuery = next.q ?? query;
    const nextTier = next.tier ?? defaultTier;

    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    else params.delete("q");

    if (nextTier && nextTier !== "all") params.set("tier", nextTier);
    else params.delete("tier");

    startTransition(() => {
      router.push(`/admin/patients?${params.toString()}`);
    });
  }

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        apply({});
      }}
    >
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, or phone number…"
          className="pl-9"
        />
      </div>
      {vipEnabled ? (
      <Select
        value={defaultTier}
        onValueChange={(next) => next && apply({ tier: next })}
        disabled={isPending}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      ) : null}
      <Button type="submit" disabled={isPending} className="sm:w-28">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : "Search"}
      </Button>
    </form>
  );
}

export function PatientDirectoryTable({
  patients,
  vipEnabled = true,
}: {
  patients: PatientRow[];
  vipEnabled?: boolean;
}) {
  return (
    <Card className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Visits</TableHead>
            <TableHead>Last appointment</TableHead>
            {vipEnabled ? (
              <>
                <TableHead>VIP since</TableHead>
                <TableHead className="text-right">Recognition</TableHead>
              </>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => {
            const isVip = patient.tier === "vip";
            const isVvip = patient.tier === "vvip";

            return (
            <TableRow
              key={patient.id}
              className={cn(
                vipEnabled && isVvip && "border-l-4 border-l-violet-500 bg-violet-50/70 hover:bg-violet-50",
                vipEnabled && isVip && "border-l-4 border-l-amber-500 bg-amber-50/80 hover:bg-amber-100/70"
              )}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium text-foreground",
                      vipEnabled && (isVip || isVvip) && "font-semibold"
                    )}
                  >
                    {patient.name}
                  </span>
                  {vipEnabled ? <VipBadge tier={patient.tier} /> : null}
                </div>
                {vipEnabled && patient.vipNotes && (
                  <p
                    className={cn(
                      "mt-0.5 max-w-xs truncate text-xs font-medium",
                      isVvip ? "text-violet-800" : "text-amber-800"
                    )}
                  >
                    {patient.vipNotes}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <p className="text-sm text-foreground">{displayPatientEmail(patient.email)}</p>
                <p className="text-xs text-muted-foreground">{patient.phone || "No phone on file"}</p>
              </TableCell>
              <TableCell className="text-foreground">{patient.appointmentCount}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(patient.lastAppointmentAt)}
              </TableCell>
              {vipEnabled ? (
                <>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(patient.vipSince)}
              </TableCell>
              <TableCell className="text-right">
                <PatientTierDialog patient={patient} />
              </TableCell>
                </>
              ) : null}
            </TableRow>
            );
          })}
          {patients.length === 0 && (
            <TableRow>
              <TableCell colSpan={vipEnabled ? 6 : 4} className="py-10 text-center text-muted-foreground">
                No patients match this search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
