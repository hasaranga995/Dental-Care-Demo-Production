import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  SupportTicketDetail,
  type SupportAttachmentRow,
  type SupportMessageRow,
  type SupportTicketRow,
} from "@/components/admin/support-desk";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import {
  getSupportTicketById,
  listTicketAttachments,
  listTicketMessages,
} from "@/lib/data/support";

export const metadata: Metadata = {
  title: "Support Ticket | Dental Care Admin",
};

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getSupportTicketById(id);
  if (!ticket) notFound();

  const [messages, attachments] = await Promise.all([
    listTicketMessages(ticket.id),
    listTicketAttachments(ticket.id),
  ]);

  const attachmentRows: SupportAttachmentRow[] = attachments.map((file) => ({
    id: file.id,
    messageId: file.messageId,
    url: file.url,
    resourceType: file.resourceType,
    fileName: file.fileName,
  }));

  const row: SupportTicketRow & {
    description: string;
    reporterEmail: string;
  } = {
    id: ticket.id,
    reference: ticket.reference,
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    category: ticket.category,
    reporterName: ticket.reporterName,
    reporterEmail: ticket.reporterEmail,
    createdAt: ticket.createdAt.toISOString(),
    slaResponseDueAt: ticket.slaResponseDueAt.toISOString(),
    slaResolutionDueAt: ticket.slaResolutionDueAt.toISOString(),
    firstRespondedAt: ticket.firstRespondedAt?.toISOString() ?? null,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
  };

  const messageRows: SupportMessageRow[] = messages.map((message) => ({
    id: message.id,
    authorName: message.authorName,
    authorRole: message.authorRole,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    attachments: attachmentRows.filter((file) => file.messageId === message.id),
  }));

  return (
    <SupportTicketDetail
      ticket={row}
      messages={messageRows}
      cloudinaryConfigured={isCloudinaryConfigured()}
    />
  );
}
