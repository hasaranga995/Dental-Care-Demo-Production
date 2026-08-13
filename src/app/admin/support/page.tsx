import type { Metadata } from "next";
import { AlertTriangle, Info, Siren, Ticket } from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import {
  RaiseSupportTicketForm,
  SupportSlaGuide,
  SupportTicketTable,
  type SupportTicketRow,
} from "@/components/admin/support-desk";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getSupportDeskStats, listSupportTickets, listTicketAttachments } from "@/lib/data/support";

export const metadata: Metadata = {
  title: "Support Desk | Dental Care Admin",
};

export default async function AdminSupportDeskPage() {
  const [tickets, stats, cloudinaryConfigured] = await Promise.all([
    listSupportTickets(),
    getSupportDeskStats(),
    Promise.resolve(isCloudinaryConfigured()),
  ]);

  const rows: SupportTicketRow[] = await Promise.all(
    tickets.map(async (ticket) => {
      const attachments = await listTicketAttachments(ticket.id);
      return {
        id: ticket.id,
        reference: ticket.reference,
        title: ticket.title,
        priority: ticket.priority,
        status: ticket.status,
        category: ticket.category,
        reporterName: ticket.reporterName,
        createdAt: ticket.createdAt.toISOString(),
        slaResponseDueAt: ticket.slaResponseDueAt.toISOString(),
        slaResolutionDueAt: ticket.slaResolutionDueAt.toISOString(),
        firstRespondedAt: ticket.firstRespondedAt?.toISOString() ?? null,
        resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
        attachmentCount: attachments.length,
      };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Support Desk</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Raise platform issues with screenshots or videos. Every ticket starts response and
          resolution SLA clocks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Open tickets" value={stats.open} icon={Ticket} tone="today" />
        <AdminStatCard
          label="Blockers"
          value={stats.blocker}
          icon={Siren}
          tone={stats.blocker > 0 ? "alert" : "pending"}
          hint={stats.blocker > 0 ? "Business-halting — respond in 30m" : "None open"}
        />
        <AdminStatCard
          label="Critical"
          value={stats.critical}
          icon={AlertTriangle}
          tone="pending"
          hint="Major degradation"
        />
        <AdminStatCard
          label="Minor open"
          value={stats.minorOpen}
          icon={Info}
          tone="confirmed"
          hint="Tweaks & guidance"
        />
      </div>

      <SupportSlaGuide />
      <RaiseSupportTicketForm cloudinaryConfigured={cloudinaryConfigured} />
      <SupportTicketTable tickets={rows} />
    </div>
  );
}
