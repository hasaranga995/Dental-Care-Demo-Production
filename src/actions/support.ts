"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  addSupportTicketMessage,
  createSupportTicket,
  insertSupportAttachments,
  updateSupportTicketStatus,
} from "@/lib/data/support";
import {
  ACCEPTED_SUPPORT_IMAGE_TYPES,
  ACCEPTED_SUPPORT_VIDEO_TYPES,
  isCloudinaryConfigured,
  MAX_SUPPORT_IMAGE_BYTES,
  MAX_SUPPORT_VIDEO_BYTES,
  uploadSupportMedia,
  type SupportMediaKind,
} from "@/lib/cloudinary";
import { sendSupportTicketNotification } from "@/lib/resend";
import { SUPPORT_CATEGORIES, SUPPORT_SLA } from "@/lib/support/sla";
import {
  addSupportTicketMessageSchema,
  createSupportTicketSchema,
  updateSupportTicketStatusSchema,
} from "@/lib/validations";
import type { SupportTicketStatus } from "@/db/schema";

export interface ActionResult {
  success: boolean;
  message: string;
  ticketId?: string;
}

const MAX_ATTACHMENTS = 5;

function revalidateSupport(ticketId?: string) {
  revalidatePath("/admin/support");
  revalidatePath("/admin");
  if (ticketId) revalidatePath(`/admin/support/${ticketId}`);
}

function collectAttachmentFiles(formData: FormData): File[] {
  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  return files.slice(0, MAX_ATTACHMENTS);
}

async function uploadAttachmentFiles(files: File[]) {
  if (files.length === 0) return [] as Array<{
    url: string;
    publicId: string;
    resourceType: SupportMediaKind;
    fileName: string;
    mimeType: string;
    bytes: number;
  }>;

  if (!isCloudinaryConfigured()) {
    throw new Error(
      "File uploads need Cloudinary. Add CLOUDINARY_* keys to .env.local, or submit without attachments."
    );
  }

  const uploaded = [];

  for (const file of files) {
    const mime = file.type;
    const isImage = (ACCEPTED_SUPPORT_IMAGE_TYPES as readonly string[]).includes(mime);
    const isVideo = (ACCEPTED_SUPPORT_VIDEO_TYPES as readonly string[]).includes(mime);

    if (!isImage && !isVideo) {
      throw new Error(`Unsupported file type: ${file.name || mime || "unknown"}`);
    }

    const maxBytes = isImage ? MAX_SUPPORT_IMAGE_BYTES : MAX_SUPPORT_VIDEO_BYTES;
    if (file.size > maxBytes) {
      throw new Error(
        `${file.name} is too large. Max ${isImage ? "8MB for images" : "40MB for videos"}.`
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind: SupportMediaKind = isImage ? "image" : "video";
    const result = await uploadSupportMedia(buffer, mime, kind);

    uploaded.push({
      url: result.url,
      publicId: result.publicId,
      resourceType: kind,
      fileName: file.name || `${kind}-attachment`,
      mimeType: mime,
      bytes: file.size,
    });
  }

  return uploaded;
}

export async function raiseSupportTicket(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["admin"]);

  const parsed = createSupportTicketSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    priority: formData.get("priority")?.toString() ?? "",
    category: formData.get("category")?.toString() ?? "other",
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid ticket." };
  }

  try {
    const files = collectAttachmentFiles(formData);
    const media = await uploadAttachmentFiles(files);

    const { ticket, message } = await createSupportTicket({
      ...parsed.data,
      createdByUserId: user.id,
      reporterName: user.name,
      reporterEmail: user.email,
    });

    if (media.length > 0) {
      await insertSupportAttachments(
        media.map((item) => ({
          ticketId: ticket.id,
          messageId: message.id,
          ...item,
        }))
      );
    }

    const sla = SUPPORT_SLA[ticket.priority];
    const categoryLabel =
      SUPPORT_CATEGORIES.find((c) => c.value === ticket.category)?.label ?? ticket.category;
    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.WHATSAPP_PUBLIC_BASE_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    try {
      await sendSupportTicketNotification({
        reference: ticket.reference,
        title: ticket.title,
        description: ticket.description,
        priority: `${sla.emoji} ${sla.label}`,
        category: categoryLabel,
        reporterName: ticket.reporterName,
        reporterEmail: ticket.reporterEmail,
        responseSla: sla.responseLabel,
        resolutionSla: sla.resolutionLabel,
        hoursNote: sla.hoursNote,
        ticketUrl: `${baseUrl}/admin/support/${ticket.id}`,
      });
    } catch (emailError) {
      console.error("[actions/support] notify failed:", emailError);
    }

    revalidateSupport(ticket.id);
    return {
      success: true,
      message: `Ticket ${ticket.reference} raised. Initial response SLA: ${sla.responseLabel}.`,
      ticketId: ticket.id,
    };
  } catch (error) {
    console.error("[actions/support] raiseSupportTicket failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Could not raise the ticket. Please try again.",
    };
  }
}

export async function postSupportTicketMessage(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["admin"]);

  const body = formData.get("body")?.toString() ?? "";
  const files = collectAttachmentFiles(formData);

  const parsed = addSupportTicketMessageSchema.safeParse({
    ticketId: formData.get("ticketId")?.toString() ?? "",
    body: body.trim() || (files.length > 0 ? "(Attachment)" : ""),
    asVendor: formData.get("asVendor")?.toString() === "true",
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid message." };
  }

  if (!body.trim() && files.length === 0) {
    return { success: false, message: "Add a comment or attach a file." };
  }

  try {
    const media = await uploadAttachmentFiles(files);
    const message = await addSupportTicketMessage({
      ticketId: parsed.data.ticketId,
      body: body.trim() || "Shared an attachment.",
      authorUserId: user.id,
      authorName: user.name,
      authorRole: parsed.data.asVendor ? "vendor" : "client",
    });

    if (media.length > 0) {
      await insertSupportAttachments(
        media.map((item) => ({
          ticketId: parsed.data.ticketId,
          messageId: message.id,
          ...item,
        }))
      );
    }

    revalidateSupport(parsed.data.ticketId);
    return { success: true, message: "Comment posted." };
  } catch (error) {
    console.error("[actions/support] postSupportTicketMessage failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Could not post that comment.",
    };
  }
}

export async function changeSupportTicketStatus(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const parsed = updateSupportTicketStatusSchema.safeParse({
    ticketId: formData.get("ticketId")?.toString() ?? "",
    status: formData.get("status")?.toString() ?? "",
    vendorNotes: formData.get("vendorNotes")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid status update." };
  }

  try {
    const updated = await updateSupportTicketStatus({
      ticketId: parsed.data.ticketId,
      status: parsed.data.status as SupportTicketStatus,
      vendorNotes: parsed.data.vendorNotes,
    });
    if (!updated) {
      return { success: false, message: "Ticket not found." };
    }
    revalidateSupport(parsed.data.ticketId);
    return { success: true, message: "Ticket status updated." };
  } catch (error) {
    console.error("[actions/support] changeSupportTicketStatus failed:", error);
    return { success: false, message: "Could not update ticket status." };
  }
}

/** One-click status change used by Open / In progress / Resolved buttons. */
export async function setSupportTicketStatusQuick(
  ticketId: string,
  status: "open" | "in_progress" | "resolved"
): Promise<ActionResult> {
  await requireRole(["admin"]);

  try {
    const updated = await updateSupportTicketStatus({ ticketId, status });
    if (!updated) return { success: false, message: "Ticket not found." };
    revalidateSupport(ticketId);
    return { success: true, message: `Marked as ${status.replace("_", " ")}.` };
  } catch (error) {
    console.error("[actions/support] setSupportTicketStatusQuick failed:", error);
    return { success: false, message: "Could not update ticket status." };
  }
}
