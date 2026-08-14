import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["patient", "doctor", "admin"]);

export const serviceCategoryEnum = pgEnum("service_category", [
  "Cosmetic",
  "Surgery",
  "Orthodontics",
  "General",
  "Pediatric",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

/**
 * Patient recognition tier. `vip`/`vvip` unlock concierge handling in both
 * chat channels and trigger a back-office WhatsApp alert on every booking.
 */
export const patientTierEnum = pgEnum("patient_tier", ["standard", "vip", "vvip"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: varchar("clerk_id", { length: 191 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("patient"),
    phone: varchar("phone", { length: 32 }),
    /** Full E.164 digits (no `+`), derived from `phone` on every write. */
    phoneNormalized: varchar("phone_normalized", { length: 32 }),
    /**
     * Full E.164 digits (country code included). Preserving the country code
     * prevents collisions like UK `+44 771…` vs Sri Lankan `+94 771…` that
     * share the same national subscriber portion.
     */
    phoneKey: varchar("phone_key", { length: 20 }),
    tier: patientTierEnum("tier").notNull().default("standard"),
    vipSince: timestamp("vip_since", { withTimezone: true }),
    /** Internal concierge preferences — never shown to the patient verbatim. */
    vipNotes: text("vip_notes").notNull().default(""),
    vipUpdatedBy: uuid("vip_updated_by"),
    vipUpdatedAt: timestamp("vip_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("users_clerk_id_idx").on(table.clerkId),
    index("users_role_idx").on(table.role),
    index("users_phone_key_idx").on(table.phoneKey),
    index("users_tier_idx").on(table.tier),
    uniqueIndex("users_email_patient_idx")
      .on(table.email)
      .where(sql`${table.role} = 'patient'`),
    uniqueIndex("users_email_staff_idx")
      .on(table.email)
      .where(sql`${table.role} <> 'patient'`),
  ]
);

export const doctors = pgTable(
  "doctors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    specialty: varchar("specialty", { length: 255 }).notNull(),
    bio: text("bio").notNull().default(""),
    image: varchar("image", { length: 512 }),
    /**
     * Shape: { mon: { start: "09:00", end: "17:00" } | null, tue: ..., ... sun: ... }
     */
    workingHours: jsonb("working_hours").notNull().default({}),
    isAvailable: boolean("is_available").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("doctors_user_id_idx").on(table.userId)]
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description").notNull(),
    fullDetails: text("full_details").notNull().default(""),
    priceRange: varchar("price_range", { length: 100 }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    category: serviceCategoryEnum("category").notNull(),
    image: varchar("image", { length: 512 }),
    icon: varchar("icon", { length: 64 }).notNull().default("Sparkles"),
    /** Ordered list of treatment steps shown on the service detail page */
    treatmentSteps: jsonb("treatment_steps").notNull().default([]),
    /** Ordered list of { question, answer } shown on the service detail page */
    faqs: jsonb("faqs").notNull().default([]),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("services_slug_idx").on(table.slug),
    index("services_category_idx").on(table.category),
  ]
);

export const banners = pgTable(
  "banners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Cloudinary `secure_url` — the CDN-served image shown in the slider. */
    imageUrl: varchar("image_url", { length: 1024 }).notNull(),
    /** Cloudinary `public_id`, required to delete the asset on removal. */
    imagePublicId: varchar("image_public_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull().default(""),
    subtitle: varchar("subtitle", { length: 500 }).notNull().default(""),
    ctaLabel: varchar("cta_label", { length: 100 }).notNull().default(""),
    ctaHref: varchar("cta_href", { length: 255 }).notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("banners_active_idx").on(table.isActive),
    index("banners_sort_order_idx").on(table.sortOrder),
  ]
);

export const categoryImages = pgTable("category_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: serviceCategoryEnum("category").notNull().unique(),
  /** Cloudinary `secure_url` — shown as the tile's background photo. */
  imageUrl: varchar("image_url", { length: 1024 }).notNull(),
  /** Cloudinary `public_id`, required to delete the asset on removal. */
  imagePublicId: varchar("image_public_id", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const heroVideos = pgTable(
  "hero_videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Cloudinary `secure_url` — the CDN-served video shown behind the hero. */
    videoUrl: varchar("video_url", { length: 1024 }).notNull(),
    /** Cloudinary `public_id`, required to delete the asset on removal. */
    videoPublicId: varchar("video_public_id", { length: 255 }).notNull(),
    /** Auto-generated Cloudinary thumbnail, shown while the video loads. */
    posterUrl: varchar("poster_url", { length: 1024 }).notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("hero_videos_active_idx").on(table.isActive)]
);

/**
 * Admin-uploaded PDF knowledge packs. The chatbot loads the single active
 * document's extracted text into its system prompt on every request.
 */
export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    cloudinaryUrl: text("cloudinary_url").notNull(),
    extractedText: text("extracted_text").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("knowledge_documents_active_idx").on(table.isActive)]
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    appointmentDate: timestamp("appointment_date", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    notes: text("notes").notNull().default(""),
    patientName: varchar("patient_name", { length: 255 }).notNull(),
    patientEmail: varchar("patient_email", { length: 255 }).notNull(),
    patientPhone: varchar("patient_phone", { length: 32 }).notNull(),
    /** Tier snapshot at booking time, so historic rows stay accurate. */
    patientTier: patientTierEnum("patient_tier").notNull().default("standard"),
    /** Where the booking came from: web, whatsapp, or admin. */
    bookingChannel: varchar("booking_channel", { length: 24 }).notNull().default("web"),
    confirmationEmailSent: boolean("confirmation_email_sent").notNull().default(false),
    /** Set once the back-office VIP broadcast has been dispatched. */
    vipAlertSentAt: timestamp("vip_alert_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("appointments_patient_id_idx").on(table.patientId),
    index("appointments_doctor_id_idx").on(table.doctorId),
    index("appointments_date_idx").on(table.appointmentDate),
    index("appointments_status_idx").on(table.status),
    index("appointments_patient_tier_idx").on(table.patientTier),
  ]
);

/**
 * Back-office staff who receive VIP booking alerts on WhatsApp. Staff opt in
 * themselves by messaging the join code to the clinic number (Meta requires a
 * recorded opt-in for every recipient), or an admin adds them manually.
 */
export const staffAlertSubscribers = pgTable(
  "staff_alert_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull().default(""),
    phone: varchar("phone", { length: 32 }).notNull(),
    /** Full E.164 digits — unique identity key for a staff device. */
    phoneKey: varchar("phone_key", { length: 20 }).notNull().unique(),
    role: varchar("role", { length: 64 }).notNull().default("Back office"),
    isActive: boolean("is_active").notNull().default(true),
    /** "whatsapp" (self opt-in) or "admin" (added from the console). */
    source: varchar("source", { length: 24 }).notNull().default("whatsapp"),
    optedInAt: timestamp("opted_in_at", { withTimezone: true }).notNull().defaultNow(),
    optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("staff_alert_subscribers_active_idx").on(table.isActive)]
);

/**
 * One row per VIP booking event. Written before any message goes out so a
 * failed broadcast is visible and replayable instead of silently lost.
 */
export const vipAlerts = pgTable(
  "vip_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tier: patientTierEnum("tier").notNull().default("vip"),
    bookingChannel: varchar("booking_channel", { length: 24 }).notNull().default("web"),
    message: text("message").notNull().default(""),
    /** pending | sent | partial | failed | skipped */
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    recipientCount: integer("recipient_count").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    error: text("error").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("vip_alerts_appointment_idx").on(table.appointmentId),
    index("vip_alerts_status_idx").on(table.status),
  ]
);

/** Per-recipient delivery audit for each VIP alert. */
export const vipAlertDeliveries = pgTable(
  "vip_alert_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alertId: uuid("alert_id")
      .notNull()
      .references(() => vipAlerts.id, { onDelete: "cascade" }),
    subscriberId: uuid("subscriber_id").references(() => staffAlertSubscribers.id, {
      onDelete: "set null",
    }),
    phone: varchar("phone", { length: 32 }).notNull(),
    /** sent | failed */
    status: varchar("status", { length: 16 }).notNull().default("sent"),
    error: text("error").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("vip_alert_deliveries_alert_idx").on(table.alertId)]
);

/**
 * Client → vendor support desk. Clinic admins raise tickets when WhatsApp,
 * booking, VIP alerts, or the AI front desk misbehave. Priority drives the
 * contractual SLA clocks stamped onto every ticket at creation time.
 */
export const supportTicketPriorityEnum = pgEnum("support_ticket_priority", [
  "blocker",
  "critical",
  "minor",
]);

export const supportTicketStatusEnum = pgEnum("support_ticket_status", [
  "open",
  "in_progress",
  "waiting_on_client",
  "resolved",
  "closed",
]);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human-facing reference, e.g. DC-20260813-0042 */
    reference: varchar("reference", { length: 32 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    priority: supportTicketPriorityEnum("priority").notNull().default("minor"),
    status: supportTicketStatusEnum("status").notNull().default("open"),
    /** Optional area: whatsapp | booking | vip_alerts | ai | admin | other */
    category: varchar("category", { length: 40 }).notNull().default("other"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reporterName: varchar("reporter_name", { length: 255 }).notNull().default(""),
    reporterEmail: varchar("reporter_email", { length: 255 }).notNull().default(""),
    slaResponseDueAt: timestamp("sla_response_due_at", { withTimezone: true }).notNull(),
    slaResolutionDueAt: timestamp("sla_resolution_due_at", { withTimezone: true }).notNull(),
    firstRespondedAt: timestamp("first_responded_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    /** Vendor-facing working notes — visible to admins tracking the case. */
    vendorNotes: text("vendor_notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("support_tickets_status_idx").on(table.status),
    index("support_tickets_priority_idx").on(table.priority),
    index("support_tickets_created_at_idx").on(table.createdAt),
  ]
);

export const supportTicketMessages = pgTable(
  "support_ticket_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    authorName: varchar("author_name", { length: 255 }).notNull().default(""),
    /** client = clinic staff; vendor = support team */
    authorRole: varchar("author_role", { length: 16 }).notNull().default("client"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("support_ticket_messages_ticket_idx").on(table.ticketId)]
);

/** Screenshots / screen recordings attached to a ticket or a follow-up comment. */
export const supportTicketAttachments = pgTable(
  "support_ticket_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").references(() => supportTicketMessages.id, {
      onDelete: "cascade",
    }),
    url: text("url").notNull(),
    publicId: varchar("public_id", { length: 255 }).notNull(),
    /** image | video */
    resourceType: varchar("resource_type", { length: 16 }).notNull().default("image"),
    fileName: varchar("file_name", { length: 255 }).notNull().default(""),
    mimeType: varchar("mime_type", { length: 120 }).notNull().default(""),
    bytes: integer("bytes").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("support_ticket_attachments_ticket_idx").on(table.ticketId),
    index("support_ticket_attachments_message_idx").on(table.messageId),
  ]
);

export const usersRelations = relations(users, ({ one, many }) => ({
  doctorProfile: one(doctors, {
    fields: [users.id],
    references: [doctors.userId],
  }),
  appointments: many(appointments),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, {
    fields: [doctors.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(users, {
    fields: [appointments.patientId],
    references: [users.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  vipAlerts: many(vipAlerts),
}));

export const vipAlertsRelations = relations(vipAlerts, ({ one, many }) => ({
  appointment: one(appointments, {
    fields: [vipAlerts.appointmentId],
    references: [appointments.id],
  }),
  patient: one(users, {
    fields: [vipAlerts.patientId],
    references: [users.id],
  }),
  deliveries: many(vipAlertDeliveries),
}));

export const vipAlertDeliveriesRelations = relations(vipAlertDeliveries, ({ one }) => ({
  alert: one(vipAlerts, {
    fields: [vipAlertDeliveries.alertId],
    references: [vipAlerts.id],
  }),
  subscriber: one(staffAlertSubscribers, {
    fields: [vipAlertDeliveries.subscriberId],
    references: [staffAlertSubscribers.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [supportTickets.createdByUserId],
    references: [users.id],
  }),
  messages: many(supportTicketMessages),
  attachments: many(supportTicketAttachments),
}));

export const supportTicketMessagesRelations = relations(supportTicketMessages, ({ one, many }) => ({
  ticket: one(supportTickets, {
    fields: [supportTicketMessages.ticketId],
    references: [supportTickets.id],
  }),
  author: one(users, {
    fields: [supportTicketMessages.authorUserId],
    references: [users.id],
  }),
  attachments: many(supportTicketAttachments),
}));

export const supportTicketAttachmentsRelations = relations(supportTicketAttachments, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [supportTicketAttachments.ticketId],
    references: [supportTickets.id],
  }),
  message: one(supportTicketMessages, {
    fields: [supportTicketAttachments.messageId],
    references: [supportTicketMessages.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Doctor = typeof doctors.$inferSelect;
export type NewDoctor = typeof doctors.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type AppointmentStatus = Appointment["status"];
export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
export type HeroVideo = typeof heroVideos.$inferSelect;
export type NewHeroVideo = typeof heroVideos.$inferInsert;
export type CategoryImage = typeof categoryImages.$inferSelect;
export type NewCategoryImage = typeof categoryImages.$inferInsert;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type NewKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;
export type PatientTier = (typeof patientTierEnum.enumValues)[number];
export type StaffAlertSubscriber = typeof staffAlertSubscribers.$inferSelect;
export type NewStaffAlertSubscriber = typeof staffAlertSubscribers.$inferInsert;
export type VipAlert = typeof vipAlerts.$inferSelect;
export type NewVipAlert = typeof vipAlerts.$inferInsert;
export type VipAlertDelivery = typeof vipAlertDeliveries.$inferSelect;
export type SupportTicketPriority = (typeof supportTicketPriorityEnum.enumValues)[number];
export type SupportTicketStatus = (typeof supportTicketStatusEnum.enumValues)[number];
export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type SupportTicketAttachment = typeof supportTicketAttachments.$inferSelect;

export interface WorkingHoursDay {
  start: string;
  end: string;
}

export type WorkingHours = Partial<
  Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", WorkingHoursDay | null>
>;

export interface TreatmentStep {
  title: string;
  description: string;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}
