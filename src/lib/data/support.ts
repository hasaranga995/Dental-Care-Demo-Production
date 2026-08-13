import "server-only";

import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  supportTicketAttachments,
  supportTicketMessages,
  supportTickets,
  type SupportTicket,
  type SupportTicketAttachment,
  type SupportTicketMessage,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "@/db/schema";
import {
  buildTicketReference,
  computeSlaDeadlines,
  type SupportCategory,
} from "@/lib/support/sla";

export interface SupportTicketFilters {
  status?: SupportTicketStatus | "openish" | "all";
  priority?: SupportTicketPriority | "all";
}

export async function listSupportTickets(
  filters: SupportTicketFilters = {}
): Promise<SupportTicket[]> {
  try {
    const clauses = [];
    if (filters.status === "openish") {
      clauses.push(
        inArray(supportTickets.status, ["open", "in_progress", "waiting_on_client"])
      );
    } else if (filters.status && filters.status !== "all") {
      clauses.push(eq(supportTickets.status, filters.status));
    }
    if (filters.priority && filters.priority !== "all") {
      clauses.push(eq(supportTickets.priority, filters.priority));
    }

    return await db
      .select()
      .from(supportTickets)
      .where(clauses.length ? and(...clauses) : undefined)
      .orderBy(desc(supportTickets.createdAt));
  } catch (error) {
    console.warn("[support] listSupportTickets failed:", error);
    return [];
  }
}

export async function getSupportTicketById(id: string): Promise<SupportTicket | null> {
  try {
    const [row] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    return row ?? null;
  } catch (error) {
    console.warn("[support] getSupportTicketById failed:", error);
    return null;
  }
}

export async function listTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
  try {
    return await db
      .select()
      .from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(supportTicketMessages.createdAt);
  } catch (error) {
    console.warn("[support] listTicketMessages failed:", error);
    return [];
  }
}

export async function getSupportDeskStats(): Promise<{
  open: number;
  blocker: number;
  critical: number;
  minorOpen: number;
  breachedResponse: number;
}> {
  try {
    const openStatuses: SupportTicketStatus[] = ["open", "in_progress", "waiting_on_client"];
    const openRows = await db
      .select()
      .from(supportTickets)
      .where(inArray(supportTickets.status, openStatuses));

    const now = Date.now();
    return {
      open: openRows.length,
      blocker: openRows.filter((t) => t.priority === "blocker").length,
      critical: openRows.filter((t) => t.priority === "critical").length,
      minorOpen: openRows.filter((t) => t.priority === "minor").length,
      breachedResponse: openRows.filter(
        (t) => !t.firstRespondedAt && t.slaResponseDueAt.getTime() < now
      ).length,
    };
  } catch (error) {
    console.warn("[support] getSupportDeskStats failed:", error);
    return { open: 0, blocker: 0, critical: 0, minorOpen: 0, breachedResponse: 0 };
  }
}

async function nextTicketReference(): Promise<string> {
  const [{ value }] = await db.select({ value: count() }).from(supportTickets);
  return buildTicketReference((value ?? 0) + 1);
}

export async function listTicketAttachments(ticketId: string): Promise<SupportTicketAttachment[]> {
  try {
    return await db
      .select()
      .from(supportTicketAttachments)
      .where(eq(supportTicketAttachments.ticketId, ticketId))
      .orderBy(supportTicketAttachments.createdAt);
  } catch (error) {
    console.warn("[support] listTicketAttachments failed:", error);
    return [];
  }
}

export async function createSupportTicket(input: {
  title: string;
  description: string;
  priority: SupportTicketPriority;
  category: SupportCategory;
  createdByUserId: string | null;
  reporterName: string;
  reporterEmail: string;
}): Promise<{ ticket: SupportTicket; message: SupportTicketMessage }> {
  const now = new Date();
  const deadlines = computeSlaDeadlines(input.priority, now);
  const reference = await nextTicketReference();

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      reference,
      title: input.title,
      description: input.description,
      priority: input.priority,
      category: input.category,
      createdByUserId: input.createdByUserId,
      reporterName: input.reporterName,
      reporterEmail: input.reporterEmail,
      slaResponseDueAt: deadlines.slaResponseDueAt,
      slaResolutionDueAt: deadlines.slaResolutionDueAt,
      status: "open",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [message] = await db
    .insert(supportTicketMessages)
    .values({
      ticketId: ticket.id,
      authorUserId: input.createdByUserId,
      authorName: input.reporterName || "Clinic admin",
      authorRole: "client",
      body: input.description,
    })
    .returning();

  return { ticket, message };
}

export async function insertSupportAttachments(
  rows: Array<{
    ticketId: string;
    messageId?: string | null;
    url: string;
    publicId: string;
    resourceType: "image" | "video";
    fileName: string;
    mimeType: string;
    bytes: number;
  }>
): Promise<SupportTicketAttachment[]> {
  if (rows.length === 0) return [];
  return db
    .insert(supportTicketAttachments)
    .values(
      rows.map((row) => ({
        ticketId: row.ticketId,
        messageId: row.messageId ?? null,
        url: row.url,
        publicId: row.publicId,
        resourceType: row.resourceType,
        fileName: row.fileName,
        mimeType: row.mimeType,
        bytes: row.bytes,
      }))
    )
    .returning();
}

export async function addSupportTicketMessage(input: {
  ticketId: string;
  body: string;
  authorUserId: string | null;
  authorName: string;
  authorRole: "client" | "vendor";
}): Promise<SupportTicketMessage> {
  const [message] = await db
    .insert(supportTicketMessages)
    .values({
      ticketId: input.ticketId,
      body: input.body,
      authorUserId: input.authorUserId,
      authorName: input.authorName,
      authorRole: input.authorRole,
    })
    .returning();

  const patch: Partial<SupportTicket> = {
    updatedAt: new Date(),
  };

  if (input.authorRole === "vendor") {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, input.ticketId))
      .limit(1);
    if (ticket && !ticket.firstRespondedAt) {
      patch.firstRespondedAt = new Date();
      if (ticket.status === "open") {
        patch.status = "in_progress";
      }
    }
  }

  await db.update(supportTickets).set(patch).where(eq(supportTickets.id, input.ticketId));

  return message;
}

export async function updateSupportTicketStatus(input: {
  ticketId: string;
  status: SupportTicketStatus;
  vendorNotes?: string;
}): Promise<SupportTicket | null> {
  const [existing] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, input.ticketId))
    .limit(1);
  if (!existing) return null;

  const now = new Date();
  const patch: Partial<SupportTicket> = {
    status: input.status,
    updatedAt: now,
  };

  if (typeof input.vendorNotes === "string") {
    patch.vendorNotes = input.vendorNotes;
  }

  if (
    (input.status === "resolved" || input.status === "closed") &&
    !existing.resolvedAt
  ) {
    patch.resolvedAt = now;
  }

  if (input.status === "in_progress" && !existing.firstRespondedAt) {
    patch.firstRespondedAt = now;
  }

  if (input.status === "open" || input.status === "in_progress" || input.status === "waiting_on_client") {
    if (existing.status === "resolved" || existing.status === "closed") {
      patch.resolvedAt = null;
    }
  }

  const [updated] = await db
    .update(supportTickets)
    .set(patch)
    .where(eq(supportTickets.id, input.ticketId))
    .returning();

  return updated ?? null;
}

/** Soft health check used by the desk empty-state. */
export async function countAllSupportTickets(): Promise<number> {
  try {
    const [row] = await db.select({ value: count() }).from(supportTickets);
    return row?.value ?? 0;
  } catch {
    return 0;
  }
}
