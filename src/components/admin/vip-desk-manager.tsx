"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BellRing, Copy, Check, Loader2, Send, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addStaffSubscriber,
  deleteStaffSubscriber,
  sendTestVipAlert,
  toggleStaffSubscriber,
} from "@/actions/vip-desk";

export interface SubscriberRow {
  id: string;
  name: string;
  phone: string;
  phoneDisplay: string;
  role: string;
  isActive: boolean;
  source: string;
  optedInAt: string;
  lastNotifiedAt: string | null;
}

export interface AlertLogRow {
  id: string;
  patientName: string;
  tier: string;
  bookingChannel: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  error: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  sent: "border-emerald-300 bg-emerald-50 text-emerald-800",
  partial: "border-amber-300 bg-amber-50 text-amber-800",
  failed: "border-red-300 bg-red-50 text-red-700",
  skipped: "border-slate-300 bg-slate-50 text-slate-600",
  pending: "border-sky-300 bg-sky-50 text-sky-700",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function VipDeskSetupCard({
  joinCode,
  joinNumber,
  hasDedicatedNumber,
  hasTemplate,
}: {
  joinCode: string;
  joinNumber: string | null;
  hasDedicatedNumber: boolean;
  hasTemplate: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const joinMessage = `JOIN ${joinCode} <your name>`;

  async function copy() {
    await navigator.clipboard.writeText(joinMessage);
    setCopied(true);
    toast.success("Join command copied.");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">
          How staff subscribe
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each staff member opts in from their own phone — WhatsApp requires a recorded opt-in
          before a business can message someone.
        </p>
      </div>

      <ol className="space-y-2 text-sm text-foreground">
        <li>
          1. An admin adds the staff WhatsApp number below (pre-approval).{" "}
          <span className="font-semibold">JOIN alone is not enough.</span>
        </li>
        <li>
          2. That staff member saves{" "}
          <span className="font-semibold">{joinNumber ? `+${joinNumber}` : "(clinic WhatsApp number)"}</span>{" "}
          and sends:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{joinMessage}</code>
        </li>
        <li>3. The VIP desk confirms the Meta opt-in, and alerts start immediately.</li>
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          Copy join command
        </Button>
        <Badge variant="secondary">
          {hasDedicatedNumber ? "Dedicated staff number" : "Shared with patient number"}
        </Badge>
        <Badge variant={hasTemplate ? "secondary" : "outline"}>
          {hasTemplate ? "Utility template configured" : "No template — 24h window only"}
        </Badge>
      </div>

      {!hasTemplate && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p>
            Without an approved Utility template, WhatsApp only delivers alerts to staff who
            messaged the bot in the last 24 hours.
          </p>
          <p>
            In Meta WhatsApp Manager → Message templates, create a <strong>Utility</strong> template
            named <code>vip_arrival_alert</code> with body placeholders{" "}
            <code>{"{{1}}"}–{"{{6}}"}</code> (tier, patient, service, doctor, date/time, channel),
            then set <code>WHATSAPP_STAFF_TEMPLATE_NAME=vip_arrival_alert</code> in{" "}
            <code>.env.local</code> and restart the server.
          </p>
        </div>
      )}
    </Card>
  );
}

export function AddSubscriberForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addStaffSubscriber(formData);
      if (result.success) {
        toast.success(result.message);
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card className="p-5">
      <h2 className="font-heading text-lg font-semibold text-foreground">Pre-approve a staff phone</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add the number here first. They still need to send JOIN from that phone before alerts start.
        Use full international format for expats (e.g. +44…, +960…).
      </p>

      <form ref={formRef} action={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <Label htmlFor="subscriber-phone">WhatsApp number</Label>
          <Input
            id="subscriber-phone"
            name="phone"
            required
            placeholder="+94 77 123 4567"
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor="subscriber-name">Name</Label>
          <Input id="subscriber-name" name="name" placeholder="Amaya Silva" className="mt-1.5" />
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor="subscriber-role">Role</Label>
          <Input
            id="subscriber-role"
            name="role"
            placeholder="Patient relations"
            className="mt-1.5"
          />
        </div>
        <div className="flex items-end sm:col-span-1">
          <Button type="submit" disabled={isPending} className="w-full gap-1.5">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            Pre-approve
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SubscriberRowActions({ subscriber }: { subscriber: SubscriberRow }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function runToggle(next: boolean) {
    const formData = new FormData();
    formData.set("subscriberId", subscriber.id);
    formData.set("isActive", String(next));

    startTransition(async () => {
      const result = await toggleStaffSubscriber(formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function runDelete() {
    const formData = new FormData();
    formData.set("subscriberId", subscriber.id);

    startTransition(async () => {
      const result = await deleteStaffSubscriber(formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <Switch checked={subscriber.isActive} onCheckedChange={runToggle} disabled={isPending} />
      <Button
        variant="ghost"
        size="icon"
        onClick={runDelete}
        disabled={isPending}
        aria-label={`Remove ${subscriber.phoneDisplay}`}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function SubscriberTable({ subscribers }: { subscribers: SubscriberRow[] }) {
  return (
    <Card className="p-0">
      <div className="border-b border-border p-5">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Back-office alert list
        </h2>
        <p className="text-sm text-muted-foreground">
          {subscribers.filter((s) => s.isActive).length} active of {subscribers.length} registered.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff member</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Opted in</TableHead>
            <TableHead>Last alert</TableHead>
            <TableHead className="text-right">Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.map((subscriber) => (
            <TableRow key={subscriber.id}>
              <TableCell>
                <p className="font-medium text-foreground">{subscriber.name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">{subscriber.role}</p>
              </TableCell>
              <TableCell className="text-foreground">{subscriber.phoneDisplay}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {subscriber.isActive ? formatDateTime(subscriber.optedInAt) : "Waiting for JOIN"}
                <span className="ml-1 text-xs">
                  ({subscriber.source === "admin" ? "admin pre-approved" : "WhatsApp opt-in"})
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(subscriber.lastNotifiedAt)}
              </TableCell>
              <TableCell className="text-right">
                <SubscriberRowActions subscriber={subscriber} />
              </TableCell>
            </TableRow>
          ))}
          {subscribers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                Nobody has subscribed yet. Share the join command above with your back-office team.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

export function TestAlertButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function run() {
    startTransition(async () => {
      const result = await sendTestVipAlert();
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button variant="outline" onClick={run} disabled={isPending} className="gap-1.5">
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      Send test alert
    </Button>
  );
}

export function AlertLogTable({ alerts }: { alerts: AlertLogRow[] }) {
  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <BellRing className="size-4 text-primary" />
            Alert history
          </h2>
          <p className="text-sm text-muted-foreground">
            Every VIP broadcast, with per-recipient delivery counts.
          </p>
        </div>
        <TestAlertButton />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Delivered</TableHead>
            <TableHead>Sent at</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>
                <p className="font-medium text-foreground">{alert.patientName}</p>
                <p className="text-xs text-muted-foreground uppercase">{alert.tier}</p>
              </TableCell>
              <TableCell className="text-sm text-foreground capitalize">
                {alert.bookingChannel}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {alert.sentCount} / {alert.recipientCount}
                {alert.failedCount > 0 && (
                  <span className="ml-1 text-xs text-destructive">({alert.failedCount} failed)</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(alert.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    STATUS_STYLES[alert.status] ?? STATUS_STYLES.pending
                  }`}
                  title={alert.error || undefined}
                >
                  {alert.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
          {alerts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                No VIP alerts yet. They appear here the moment a VIP books.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
