import { z } from "zod";

export const bookingSchema = z.object({
  serviceId: z.string().uuid("Please select a valid service."),
  doctorId: z.string().uuid("Please select a valid doctor."),
  appointmentDate: z.string().min(1, "Please select a date."),
  appointmentTime: z.string().min(1, "Please select a time."),
  patientName: z.string().trim().min(2, "Please enter your full name."),
  patientEmail: z.string().trim().email("Please enter a valid email address."),
  patientPhone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(20, "Please enter a valid phone number."),
  notes: z.string().trim().max(1000, "Notes must be under 1000 characters.").optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(20, "Please enter a valid phone number."),
  subject: z.string().trim().min(3, "Please enter a subject."),
  message: z.string().trim().min(10, "Please enter a message of at least 10 characters."),
  preferredChannel: z.enum(["whatsapp", "phone", "email"]).optional().default("email"),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const appointmentStatusUpdateSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

export const rescheduleSchema = z.object({
  appointmentId: z.string().uuid(),
  appointmentDate: z.string().min(1, "Please select a date."),
  appointmentTime: z.string().min(1, "Please select a time."),
});

export const MAX_BANNER_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
export const ACCEPTED_BANNER_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const bannerSchema = z.object({
  title: z.string().trim().max(255, "Title must be under 255 characters.").optional(),
  subtitle: z.string().trim().max(500, "Subtitle must be under 500 characters.").optional(),
  ctaLabel: z.string().trim().max(100, "Button label must be under 100 characters.").optional(),
  ctaHref: z
    .string()
    .trim()
    .max(255, "Link must be under 255 characters.")
    .refine(
      (value) => value === "" || value.startsWith("/") || value.startsWith("http"),
      "Link must be a relative path (e.g. /book) or a full URL."
    )
    .optional(),
});

export type BannerInput = z.infer<typeof bannerSchema>;

export const bannerIdSchema = z.object({
  bannerId: z.string().uuid("Invalid banner id."),
});

export const MAX_HERO_VIDEO_BYTES = 40 * 1024 * 1024; // 40MB
export const ACCEPTED_HERO_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const SERVICE_CATEGORY_VALUES = [
  "Cosmetic",
  "Surgery",
  "Orthodontics",
  "General",
  "Pediatric",
] as const;

export const MAX_CATEGORY_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
export const ACCEPTED_CATEGORY_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const categoryImageIdentifierSchema = z.object({
  category: z.enum(SERVICE_CATEGORY_VALUES),
});

export const PATIENT_TIER_VALUES = ["standard", "vip", "vvip"] as const;

export const patientTierUpdateSchema = z.object({
  patientId: z.string().uuid("Invalid patient id."),
  tier: z.enum(PATIENT_TIER_VALUES),
  vipNotes: z
    .string()
    .trim()
    .max(1000, "Notes must be under 1000 characters.")
    .optional()
    .default(""),
});

export const staffSubscriberSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(24, "Please enter a valid phone number."),
  name: z.string().trim().max(255, "Name must be under 255 characters.").optional().default(""),
  role: z.string().trim().max(64, "Role must be under 64 characters.").optional().default(""),
});

export const staffSubscriberIdSchema = z.object({
  subscriberId: z.string().uuid("Invalid subscriber id."),
});

export const SUPPORT_PRIORITY_VALUES = ["blocker", "critical", "minor"] as const;
export const SUPPORT_STATUS_VALUES = [
  "open",
  "in_progress",
  "waiting_on_client",
  "resolved",
  "closed",
] as const;
export const SUPPORT_CATEGORY_VALUES = [
  "whatsapp",
  "booking",
  "vip_alerts",
  "ai",
  "admin",
  "other",
] as const;

export const createSupportTicketSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(200),
  description: z
    .string()
    .trim()
    .min(20, "Please describe the issue in at least 20 characters.")
    .max(5000),
  priority: z.enum(SUPPORT_PRIORITY_VALUES),
  category: z.enum(SUPPORT_CATEGORY_VALUES),
});

export const supportTicketIdSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket id."),
});

export const updateSupportTicketStatusSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket id."),
  status: z.enum(SUPPORT_STATUS_VALUES),
  vendorNotes: z.string().trim().max(4000).optional().default(""),
});

export const addSupportTicketMessageSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket id."),
  body: z.string().trim().min(2, "Message is too short.").max(4000),
  asVendor: z.boolean().optional().default(false),
});
