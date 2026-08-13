import "server-only";

import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { createAppointment, createGuestAppointment } from "@/actions/appointments";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { CLINIC, formatClinicDateLabel, getClinicClock, getClinicOpenStatus, getOperatingHoursList, getWhatsAppHref } from "@/lib/clinic-config";
import { getAvailableTimeSlots } from "@/lib/data/availability";
import { getAvailableDoctors, getDoctorById } from "@/lib/data/doctors";
import { CLINIC_FAQS } from "@/lib/data/faqs";
import { getAllServices, getServiceBySlug } from "@/lib/data/services";
import { tierLabel, type VipContext } from "@/lib/vip/identity";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export type DentalChatChannel = "web" | "whatsapp";

export interface DentalChatToolOptions {
  channel?: DentalChatChannel;
  /** E.164-style phone of the WhatsApp sender, used as the default booking number. */
  patientPhone?: string;
  /** Resolved patient identity, used to tag VIP bookings for the back office. */
  vip?: VipContext | null;
}

/**
 * Server-side tools the Dental Care Concierge / WhatsApp front desk can call.
 * All availability and booking paths reuse the same data layer as the website.
 */
export function createDentalChatTools(options: DentalChatToolOptions = {}) {
  const channel = options.channel ?? "web";
  const defaultPhone = options.patientPhone?.trim() ?? "";
  const vip = options.vip ?? null;

  return {
    getClinicInfo: tool({
      description:
        "Get Dental Care clinic contact details, address, hours, open/closed status, parking, and accreditations.",
      inputSchema: z.object({}),
      execute: async () => {
        const status = getClinicOpenStatus();
        return {
          name: CLINIC.name,
          phone: CLINIC.phone,
          emergencyPhone: CLINIC.emergencyPhone,
          email: CLINIC.email,
          whatsapp: `+${CLINIC.whatsapp}`,
          address: CLINIC.address,
          hours: getOperatingHoursList(),
          openStatus: status,
          parking: CLINIC.parkingInfo,
          transit: CLINIC.transitInfo,
          accreditations: CLINIC.accreditations,
        };
      },
    }),

    searchFaqs: tool({
      description: "Search the clinic FAQ knowledge base for insurance, appointments, treatments, and safety questions.",
      inputSchema: z.object({
        query: z.string().describe("Keywords or a patient question to match against FAQs"),
      }),
      execute: async ({ query }) => {
        const lower = query.toLowerCase();
        const matches = CLINIC_FAQS.filter(
          (faq) =>
            faq.question.toLowerCase().includes(lower) ||
            faq.answer.toLowerCase().includes(lower) ||
            faq.category.toLowerCase().includes(lower)
        ).slice(0, 5);
        return { count: matches.length, faqs: matches.length > 0 ? matches : CLINIC_FAQS.slice(0, 4) };
      },
    }),

    listServices: tool({
      description: "List dental services offered by the clinic with category, duration, and price range.",
      inputSchema: z.object({
        category: z
          .enum(["Cosmetic", "Surgery", "Orthodontics", "General", "Pediatric", "All"])
          .optional()
          .describe("Optional category filter"),
      }),
      execute: async ({ category }) => {
        const services = await getAllServices();
        const filtered =
          !category || category === "All"
            ? services
            : services.filter((service) => service.category === category);
        return filtered.map((service) => ({
          id: service.id,
          slug: service.slug,
          name: service.name,
          category: service.category,
          durationMinutes: service.durationMinutes,
          priceRange: service.priceRange,
          summary: service.description.slice(0, 180),
        }));
      },
    }),

    getServiceDetails: tool({
      description: "Get full details for one service by slug or UUID, including FAQs and treatment steps.",
      inputSchema: z.object({
        service: z.string().describe("Service slug (e.g. teeth-whitening) or service UUID"),
      }),
      execute: async ({ service }) => {
        const found = isUuid(service)
          ? (await getAllServices()).find((row) => row.id === service) ?? null
          : await getServiceBySlug(service);
        if (!found) return { found: false as const, message: "Service not found." };
        return {
          found: true as const,
          id: found.id,
          slug: found.slug,
          name: found.name,
          category: found.category,
          durationMinutes: found.durationMinutes,
          priceRange: found.priceRange,
          description: found.description,
          fullDetails: found.fullDetails,
          treatmentSteps: found.treatmentSteps,
          faqs: found.faqs,
        };
      },
    }),

    listDoctors: tool({
      description:
        "List the hospital's real doctors. Always call this before naming a doctor. Copy names exactly from the result — never invent or guess a name.",
      inputSchema: z.object({
        specialtyHint: z
          .string()
          .optional()
          .describe("Optional specialty or name keyword like Orthodontics, Pediatric, Jayawardena, or checkup"),
      }),
      execute: async ({ specialtyHint }) => {
        const doctors = await getAvailableDoctors();
        const hint = specialtyHint?.toLowerCase().trim();
        const filtered = hint
          ? doctors.filter(
              (doctor) =>
                doctor.specialty.toLowerCase().includes(hint) ||
                doctor.user.name.toLowerCase().includes(hint) ||
                doctor.bio.toLowerCase().includes(hint)
            )
          : doctors;
        const rows = (filtered.length > 0 ? filtered : doctors).map((doctor) => ({
          id: doctor.id,
          name: doctor.user.name,
          specialty: doctor.specialty,
          bio: doctor.bio.slice(0, 220),
          workingDays: Object.entries(doctor.workingHours)
            .filter(([, hours]) => hours)
            .map(([day]) => day),
        }));
        return { count: rows.length, doctors: rows };
      },
    }),

    checkAvailability: tool({
      description:
        "Check open appointment time slots for a doctor on a specific date (YYYY-MM-DD in Asia/Colombo). Use the clinic clock for today/tomorrow. Never invent slots.",
      inputSchema: z.object({
        doctorId: z.string().uuid().describe("Doctor UUID from listDoctors"),
        date: z.string().describe("Appointment date in YYYY-MM-DD format"),
      }),
      execute: async ({ doctorId, date }) => {
        const clock = getClinicClock();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return {
            available: false,
            slots: [] as string[],
            message: `Invalid date. Use YYYY-MM-DD. Today is ${clock.today} (${clock.todayLabel}). Tomorrow is ${clock.tomorrow} (${clock.tomorrowLabel}).`,
            today: clock.today,
            tomorrow: clock.tomorrow,
          };
        }
        if (date < clock.today) {
          return {
            available: false,
            slots: [] as string[],
            pastDate: true,
            requestedDate: date,
            today: clock.today,
            tomorrow: clock.tomorrow,
            message: `${date} is in the past. Today is ${clock.todayLabel}. Tomorrow is ${clock.tomorrowLabel}. Ask for a future day and check again.`,
          };
        }

        const doctor = await getDoctorById(doctorId);
        if (!doctor) {
          return { available: false, slots: [] as string[], message: "Doctor not found. Call listDoctors and use an id from that list." };
        }
        const slots = await getAvailableTimeSlots(doctorId, date);
        const humanDate = formatClinicDateLabel(date);
        return {
          available: slots.length > 0,
          doctorName: doctor.user.name,
          specialty: doctor.specialty,
          date,
          humanDate,
          slots,
          message:
            slots.length > 0
              ? `${doctor.user.name} has ${slots.length} open times on ${humanDate}.`
              : `${doctor.user.name} has no open times on ${humanDate}. Offer another date or another doctor from listDoctors.`,
        };
      },
    }),

    bookAppointment: tool({
      description:
        channel === "whatsapp"
          ? "Book an appointment after the patient has confirmed service, doctor, date, time, full name, email, and phone. Never book until they clearly confirm the summary."
          : "Book an appointment for the currently signed-in patient. Requires serviceId (UUID or slug), doctorId, date, time, and patient contact fields. Do not call if the user is not signed in.",
      inputSchema: z.object({
        serviceId: z.string().describe("Service UUID or slug"),
        doctorId: z.string().uuid(),
        appointmentDate: z.string().describe("YYYY-MM-DD"),
        appointmentTime: z.string().describe("HH:mm from checkAvailability"),
        patientName: z.string().min(2),
        patientEmail: z.string().email(),
        patientPhone: z.string().min(7).max(20).optional(),
        notes: z.string().max(1000).optional(),
      }),
      execute: async (input) => {
        const patientPhone = input.patientPhone?.trim() || defaultPhone;
        if (!patientPhone) {
          return {
            success: false,
            message: "A phone number is required to confirm the booking.",
          };
        }

        if (channel !== "whatsapp") {
          const user = await getOrCreateCurrentUser();
          if (!user) {
            return {
              success: false,
              message:
                "The patient is not signed in. Ask them to sign in at /sign-in, then try booking again.",
              signInUrl: "/sign-in?redirect_url=/book",
            };
          }
        }

        const slots = await getAvailableTimeSlots(input.doctorId, input.appointmentDate);
        if (!slots.includes(input.appointmentTime)) {
          return {
            success: false,
            message: `That time is no longer available. Open slots on ${input.appointmentDate}: ${slots.join(", ") || "none"}.`,
            slots,
          };
        }

        const baseNote =
          input.notes ??
          (channel === "whatsapp" ? "Booked via WhatsApp front desk" : "Booked via website front desk");
        // Tag the note so the tier is visible to staff reading the raw
        // appointment, independent of the badge in the admin UI.
        const notes = vip?.recognized ? `[${tierLabel(vip.tier)}] ${baseNote}` : baseNote;

        const formData = new FormData();
        formData.set("serviceId", input.serviceId);
        formData.set("doctorId", input.doctorId);
        formData.set("appointmentDate", input.appointmentDate);
        formData.set("appointmentTime", input.appointmentTime);
        formData.set("patientName", input.patientName);
        formData.set("patientEmail", input.patientEmail);
        formData.set("patientPhone", patientPhone);
        formData.set("bookingChannel", channel);
        formData.set("notes", notes);

        const result =
          channel === "whatsapp"
            ? await createGuestAppointment(formData)
            : await createAppointment(formData);

        return {
          ...result,
          dashboardUrl: result.success && channel !== "whatsapp" ? "/dashboard" : undefined,
          whatsappConfirmation: result.success
            ? `Your appointment request is in our diary as pending.\n\n• ${input.patientName}\n• ${input.appointmentDate} at ${input.appointmentTime}\n\nYou'll get an email shortly. Please arrive 10 minutes early.`
            : undefined,
        };
      },
    }),

    ...(channel === "whatsapp"
      ? {
          transferToOnCall: tool({
            description:
              "Use when the patient needs a senior administrator, has a complaint, billing dispute, or an emergency that should not be handled in chat. Returns the hospital phone numbers.",
            inputSchema: z.object({
              reason: z.string().min(5).describe("Why the front desk is escalating"),
            }),
            execute: async ({ reason }) => ({
              escalated: true as const,
              reason,
              phone: CLINIC.phone,
              emergencyPhone: CLINIC.emergencyPhone,
              displayMessage: `Please call our front desk on ${CLINIC.phone}. For dental emergencies call ${CLINIC.emergencyPhone}.`,
            }),
          }),
        }
      : {
          handoffToWhatsApp: tool({
            description:
              "Hand the patient to the Dental Care WhatsApp front desk when you cannot complete the request (missing data, out-of-scope clinical advice, billing/insurance disputes, complaints, payment issues, complex multi-visit care planning, or the patient asks for a human). Always call this instead of inventing an answer.",
            inputSchema: z.object({
              reason: z
                .string()
                .min(5)
                .describe("Short reason the web concierge cannot finish this in chat"),
              patientSummary: z
                .string()
                .min(10)
                .describe("Brief summary of what the patient needs"),
            }),
            execute: async ({ reason, patientSummary }) => {
              const whatsappUrl = getWhatsAppHref(
                `Hi Dental Care, I'd like help with: ${patientSummary}`
              );
              return {
                handedOff: true as const,
                reason,
                whatsappUrl,
                displayMessage:
                  "I can't complete that here — connecting you with our front desk on WhatsApp.",
              };
            },
          }),
        }),
  } satisfies ToolSet;
}

export type DentalChatTools = ReturnType<typeof createDentalChatTools>;
