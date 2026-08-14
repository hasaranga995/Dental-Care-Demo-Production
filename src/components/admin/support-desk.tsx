"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  Film,
  ImagePlus,
  Info,
  LifeBuoy,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  PlayCircle,
  Siren,
  Timer,
} from "lucide-react";
import {
  postSupportTicketMessage,
  raiseSupportTicket,
  setSupportTicketStatusQuick,
} from "@/actions/support";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import type { SupportTicketPriority, SupportTicketStatus } from "@/db/schema";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_SLA,
  SUPPORT_STATUS_LABELS,
  evaluateSlaClock,
  formatSlaCountdown,
} from "@/lib/support/sla";
import { cn } from "@/lib/utils";

export interface SupportAttachmentRow {
  id: string;
  messageId: string | null;
  url: string;
  resourceType: string;
  fileName: string;
}

export interface SupportTicketRow {
  id: string;
  reference: string;
  title: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  category: string;
  reporterName: string;
  createdAt: string;
  slaResponseDueAt: string;
  slaResolutionDueAt: string;
  firstRespondedAt: string | null;
  resolvedAt: string | null;
  attachmentCount?: number;
}

export interface SupportMessageRow {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
  attachments: SupportAttachmentRow[];
}

const PRIORITY_BADGE: Record<SupportTicketPriority, string> = {
  blocker: "border-red-400 bg-red-50 text-red-800",
  critical: "border-orange-400 bg-orange-50 text-orange-900",
  minor: "border-sky-300 bg-sky-50 text-sky-900",
};

const STATUS_BADGE: Record<SupportTicketStatus, string> = {
  open: "border-sky-300 bg-sky-50 text-sky-800",
  in_progress: "border-amber-300 bg-amber-50 text-amber-900",
  waiting_on_client: "border-violet-300 bg-violet-50 text-violet-900",
  resolved: "border-emerald-300 bg-emerald-50 text-emerald-800",
  closed: "border-slate-300 bg-slate-50 text-slate-700",
};

const CLOCK_BADGE: Record<string, string> = {
  ok: "border-emerald-300 bg-emerald-50 text-emerald-800",
  due_soon: "border-amber-400 bg-amber-50 text-amber-900",
  breached: "border-red-400 bg-red-50 text-red-800",
  met: "border-slate-300 bg-slate-50 text-slate-600",
};

function formatWhen(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function categoryLabel(value: string): string {
  return SUPPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function AttachmentGallery({ attachments }: { attachments: SupportAttachmentRow[] }) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {attachments.map((file) =>
        file.resourceType === "video" ? (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-xl border border-border bg-slate-950"
          >
            <video src={file.url} className="max-h-48 w-full object-contain" controls preload="metadata" />
            <p className="flex items-center gap-1.5 truncate bg-slate-900 px-2 py-1.5 text-[11px] text-slate-200">
              <Film className="size-3 shrink-0" />
              {file.fileName || "Video"}
            </p>
          </a>
        ) : (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-xl border border-border bg-muted/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt={file.fileName || "Screenshot"}
              className="max-h-48 w-full object-cover transition group-hover:opacity-95"
            />
            <p className="truncate px-2 py-1.5 text-[11px] text-muted-foreground">
              {file.fileName || "Screenshot"}
            </p>
          </a>
        )
      )}
    </div>
  );
}

function MediaField({
  id,
  cloudinaryConfigured,
}: {
  id: string;
  cloudinaryConfigured: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>Screenshots &amp; videos</Label>
      <div
        className={cn(
          "mt-1.5 rounded-xl border border-dashed border-border bg-muted/30 p-4",
          !cloudinaryConfigured && "opacity-70"
        )}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <ImagePlus className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Attach evidence</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Screenshots (JPG/PNG/WebP, up to 8MB) or screen recordings (MP4/WebM, up to 40MB). Max 5
              files.
            </p>
            <Input
              id={id}
              name="attachments"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              disabled={!cloudinaryConfigured}
              className="mt-3 cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
            />
            {!cloudinaryConfigured && (
              <p className="mt-2 text-xs text-amber-700">
                Cloudinary is not configured — text tickets still work, but media uploads are disabled.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupportSlaGuide() {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#0D4F5C]/15 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-[#0D4F5C] px-6 py-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[#5EC8C0]/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-20 size-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <LifeBuoy className="size-6 text-[#5EC8C0]" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#5EC8C0] uppercase">
              Service levels
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-white">
              Support SLA (Available for 24/7 support service)
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
              Choose the priority that matches the real impact. Response and resolution clocks start
              the moment the ticket is raised.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 bg-[#F3FAF9] p-4 md:grid-cols-3 md:p-5">
        {(Object.keys(SUPPORT_SLA) as SupportTicketPriority[]).map((key) => {
          const sla = SUPPORT_SLA[key];
          const Icon = key === "blocker" ? Siren : key === "critical" ? AlertTriangle : Info;
          return (
            <div
              key={key}
              className={cn(
                "flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm",
                key === "blocker" && "border-red-200",
                key === "critical" && "border-orange-200",
                key === "minor" && "border-sky-200"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-xl",
                    key === "blocker" && "bg-red-100 text-red-700",
                    key === "critical" && "bg-orange-100 text-orange-700",
                    key === "minor" && "bg-sky-100 text-sky-800"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="font-heading text-lg font-semibold text-foreground">{sla.label}</p>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {sla.hoursNote}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-foreground/80">{sla.description}</p>

              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                {sla.examples.map((example) => (
                  <li key={example} className="flex gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-current opacity-50" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                <div
                  className={cn(
                    "rounded-xl p-3",
                    key === "blocker" && "bg-red-50",
                    key === "critical" && "bg-orange-50",
                    key === "minor" && "bg-sky-50"
                  )}
                >
                  <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    <Timer className="size-3" /> Response
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{sla.responseLabel}</p>
                </div>
                <div
                  className={cn(
                    "rounded-xl p-3",
                    key === "blocker" && "bg-red-50",
                    key === "critical" && "bg-orange-50",
                    key === "minor" && "bg-sky-50"
                  )}
                >
                  <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    <CheckCircle2 className="size-3" /> Resolve
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{sla.resolutionLabel}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function RaiseSupportTicketForm({
  cloudinaryConfigured,
}: {
  cloudinaryConfigured: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState<SupportTicketPriority>("minor");
  const [category, setCategory] = useState("other");

  function handleSubmit(formData: FormData) {
    formData.set("priority", priority);
    formData.set("category", category);
    startTransition(async () => {
      const result = await raiseSupportTicket(formData);
      if (result.success) {
        toast.success(result.message);
        formRef.current?.reset();
        setPriority("minor");
        setCategory("other");
        if (result.ticketId) router.push(`/admin/support/${result.ticketId}`);
        else router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const sla = SUPPORT_SLA[priority];

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <MessageSquarePlus className="size-5" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">Raise a ticket</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Describe the issue, attach screenshots or a short video, and we&apos;ll respond within
            the SLA for your priority.
          </p>
        </div>
      </div>

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="support-priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(value) => value && setPriority(value as SupportTicketPriority)}
            >
              <SelectTrigger id="support-priority" className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blocker">Blocker — business halted</SelectItem>
                <SelectItem value="critical">Critical — major degradation</SelectItem>
                <SelectItem value="minor">Minor — tweak / question</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Response {sla.responseLabel} · Resolution {sla.resolutionLabel}
            </p>
          </div>
          <div>
            <Label htmlFor="support-category">Area</Label>
            <Select value={category} onValueChange={(value) => value && setCategory(value)}>
              <SelectTrigger id="support-category" className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="support-title">Title</Label>
          <Input
            id="support-title"
            name="title"
            required
            minLength={5}
            maxLength={200}
            placeholder="e.g. WhatsApp bot not replying during morning clinic"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="support-description">What happened?</Label>
          <Textarea
            id="support-description"
            name="description"
            required
            minLength={20}
            maxLength={5000}
            rows={5}
            placeholder="Steps to reproduce, which phones/channels are affected, when it started…"
            className="mt-1.5"
          />
        </div>

        <MediaField id="support-attachments" cloudinaryConfigured={cloudinaryConfigured} />

        <Button type="submit" disabled={isPending} className="gap-1.5">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <LifeBuoy className="size-4" />}
          Submit ticket
        </Button>
      </form>
    </Card>
  );
}

function SlaPill({
  label,
  dueAt,
  metAt,
}: {
  label: string;
  dueAt: string;
  metAt: string | null;
}) {
  const { state, minutesRemaining } = evaluateSlaClock({
    dueAt: new Date(dueAt),
    metAt: metAt ? new Date(metAt) : null,
  });

  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", CLOCK_BADGE[state])}>
      <Clock3 className="size-3" />
      {label}: {formatSlaCountdown(minutesRemaining, state)}
    </Badge>
  );
}

export function SupportTicketTable({ tickets }: { tickets: SupportTicketRow[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border bg-gradient-to-r from-[#F3FAF9] to-white px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#0D4F5C] text-white">
            <CircleDot className="size-4" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight text-[#0D4F5C]">
              Tickets
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Open and recent requests with live response and resolution clocks.
            </p>
          </div>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Raised</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              className={cn(
                ticket.priority === "blocker" && "border-l-4 border-l-red-500 bg-red-50/50",
                ticket.priority === "critical" && "border-l-4 border-l-orange-400 bg-orange-50/40"
              )}
            >
              <TableCell>
                <Link
                  href={`/admin/support/${ticket.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {ticket.reference}
                </Link>
                <p className="mt-0.5 max-w-xs truncate text-sm text-foreground">{ticket.title}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{categoryLabel(ticket.category)}</span>
                  {(ticket.attachmentCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5">
                      <Paperclip className="size-3" />
                      {ticket.attachmentCount}
                    </span>
                  )}
                </p>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={PRIORITY_BADGE[ticket.priority]}>
                  {SUPPORT_SLA[ticket.priority].label}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={STATUS_BADGE[ticket.status]}>
                  {SUPPORT_STATUS_LABELS[ticket.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <SlaPill
                    label="Response"
                    dueAt={ticket.slaResponseDueAt}
                    metAt={ticket.firstRespondedAt}
                  />
                  <SlaPill
                    label="Resolve"
                    dueAt={ticket.slaResolutionDueAt}
                    metAt={ticket.resolvedAt}
                  />
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <p>{formatWhen(ticket.createdAt)}</p>
                <p className="text-xs">{ticket.reporterName || "Admin"}</p>
              </TableCell>
            </TableRow>
          ))}
          {tickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                No tickets yet. Raise one above when something needs attention.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

const QUICK_STATUSES: Array<{
  value: "open" | "in_progress" | "resolved";
  label: string;
  icon: typeof CircleDot;
}> = [
  { value: "open", label: "Open", icon: CircleDot },
  { value: "in_progress", label: "In progress", icon: PlayCircle },
  { value: "resolved", label: "Resolved", icon: CheckCircle2 },
];

export function SupportTicketDetail({
  ticket,
  messages,
  cloudinaryConfigured,
}: {
  ticket: SupportTicketRow & {
    description: string;
    reporterEmail: string;
  };
  messages: SupportMessageRow[];
  cloudinaryConfigured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const messageRef = useRef<HTMLFormElement>(null);

  function postComment(formData: FormData) {
    formData.set("ticketId", ticket.id);
    startTransition(async () => {
      const result = await postSupportTicketMessage(formData);
      if (result.success) {
        toast.success(result.message);
        messageRef.current?.reset();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function setStatus(next: "open" | "in_progress" | "resolved") {
    startTransition(async () => {
      const result = await setSupportTicketStatusQuick(ticket.id, next);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const sla = SUPPORT_SLA[ticket.priority];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/support" className="text-sm font-medium text-primary hover:underline">
            ← Back to Support Desk
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-foreground">
            {ticket.reference}
          </h1>
          <p className="mt-1 text-base text-foreground">{ticket.title}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className={PRIORITY_BADGE[ticket.priority]}>
              {sla.label}
            </Badge>
            <Badge variant="outline" className={STATUS_BADGE[ticket.status]}>
              {SUPPORT_STATUS_LABELS[ticket.status]}
            </Badge>
            <Badge variant="secondary">{categoryLabel(ticket.category)}</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <SlaPill label="Response" dueAt={ticket.slaResponseDueAt} metAt={ticket.firstRespondedAt} />
          <SlaPill label="Resolve" dueAt={ticket.slaResolutionDueAt} metAt={ticket.resolvedAt} />
        </div>
      </div>

      <Card className="p-4 sm:p-5">
        <p className="text-sm font-semibold text-foreground">Ticket status</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Switch between Open, In progress, and Resolved.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_STATUSES.map((item) => {
            const Icon = item.icon;
            const active =
              ticket.status === item.value ||
              (item.value === "resolved" && ticket.status === "closed");
            return (
              <Button
                key={item.value}
                type="button"
                disabled={isPending || active}
                variant={active ? "default" : "outline"}
                className={cn(
                  "gap-1.5",
                  active && item.value === "open" && "bg-sky-600 hover:bg-sky-600",
                  active && item.value === "in_progress" && "bg-amber-600 hover:bg-amber-600",
                  active && item.value === "resolved" && "bg-emerald-600 hover:bg-emerald-600"
                )}
                onClick={() => setStatus(item.value)}
              >
                <Icon className="size-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Comments</h2>
            <p className="text-sm text-muted-foreground">
              Raised by {ticket.reporterName || "Admin"}
              {ticket.reporterEmail ? ` · ${ticket.reporterEmail}` : ""} · {formatWhen(ticket.createdAt)}
            </p>
          </div>

          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-xl border p-3",
                  message.authorRole === "vendor"
                    ? "border-teal-200 bg-teal-50/60"
                    : "border-border bg-muted/40"
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {message.authorName || "Unknown"}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({message.authorRole === "vendor" ? "support" : "clinic"})
                    </span>
                  </span>
                  <span>{formatWhen(message.createdAt)}</span>
                </div>
                {message.body && message.body !== "(Attachment)" && (
                  <p className="whitespace-pre-wrap text-sm text-foreground">{message.body}</p>
                )}
                <AttachmentGallery attachments={message.attachments} />
              </div>
            ))}
          </div>

          <form
            ref={messageRef}
            action={postComment}
            className="space-y-3 border-t border-border pt-4"
          >
            <Label htmlFor="ticket-message">Add a comment</Label>
            <Textarea
              id="ticket-message"
              name="body"
              rows={3}
              placeholder="Add an update, ask a question, or confirm a fix…"
            />
            <MediaField id="comment-attachments" cloudinaryConfigured={cloudinaryConfigured} />
            <Button type="submit" disabled={isPending} className="gap-1.5">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
              Post comment
            </Button>
          </form>
        </Card>

        <Card className="h-fit space-y-3 p-5">
          <h2 className="font-heading text-base font-semibold text-foreground">SLA for this ticket</h2>
          <p className="text-sm text-muted-foreground">{sla.description}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Response
              </p>
              <p className="mt-1 text-sm font-semibold">{sla.responseLabel}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Resolve
              </p>
              <p className="mt-1 text-sm font-semibold">{sla.resolutionLabel}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Response due {formatWhen(ticket.slaResponseDueAt)}
            <br />
            Resolution due {formatWhen(ticket.slaResolutionDueAt)}
          </p>
        </Card>
      </div>
    </div>
  );
}
