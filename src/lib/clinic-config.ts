/**
 * Single source of truth for clinic branding, contact details, and operating
 * hours. Update this file to rebrand the site or change hours across every
 * page (navbar, footer, contact page open/closed badge, emails, etc).
 */

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface DayHours {
  open: string; // "HH:mm" 24h
  close: string; // "HH:mm" 24h
}

export const CLINIC = {
  name: "Dental Care",
  legalName: "Dental Care Private Hospital",
  /** Client demo build label shown next to the brand in the top nav. */
  demoVersion: "DEMO (V2026.R1.0)",
  tagline: "Your Smile. Our Passion.",
  /** Front-desk persona name — used by web chat and WhatsApp receptionist. */
  receptionistName: "Amaya",
  description:
    "A private dental hospital delivering cosmetic, surgical, orthodontic, and family dentistry with hospital-grade sterilization and a calm, boutique experience.",
  phone: "+94 11 000 0000",
  phoneRaw: "+94110000000",
  emergencyPhone: "+94 77 123 4567",
  emergencyPhoneRaw: "+94771234567",
  /** Digits-only WhatsApp number (no +). Overridden by NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER when the Cloud API bot is live. */
  whatsapp: "94110000000",
  whatsappMessage: "Hi Dental Care, I'd like to speak with the front desk.",
  email: "hello@dentalcare.example",
  address: {
    line1: "128 Harbor View Avenue",
    line2: "Suite 400",
    city: "Colombo",
    region: "Western Province",
    postalCode: "00300",
    country: "Sri Lanka",
    mapsEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.442!2d79.848!3d6.927!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTUnMzcuMiJOIDc5wrA1MCc1My4wIkU!5e0!3m2!1sen!2s!4v1700000000000",
    mapsGoogleUrl: "https://maps.google.com/?q=128+Harbor+View+Avenue+Colombo",
    mapsAppleUrl: "https://maps.apple.com/?q=128+Harbor+View+Avenue,+Colombo",
    mapsWazeUrl: "https://waze.com/ul?q=128%20Harbor%20View%20Avenue%20Colombo&navigate=yes",
  },
  transitInfo:
    "2-minute walk from Harbor View Metro Station. Bus routes 04, 12, and 21 stop directly outside our main entrance.",
  parkingInfo:
    "Complimentary valet parking at the main lobby entrance. 40 secure basement parking bays accessible via Dockside Lane.",
  accessibilityInfo:
    "100% wheelchair accessible, private elevator access, and multi-lingual staff (English, Sinhala, Tamil).",
  social: {
    instagram: "https://instagram.com/dentalcare",
    facebook: "https://facebook.com/dentalcare",
    google: "https://g.page/r/dentalcare/review",
  },
  accreditations: [
    "ISO 9001:2015 Certified",
    "JCI Ambulatory Care Accredited",
    "National Dental Council Licensed",
    "Autoclave-Verified Sterilization Program",
  ],
  googleRating: {
    score: 4.9,
    count: 1284,
  },
  hours: {
    mon: { open: "08:00", close: "20:00" },
    tue: { open: "08:00", close: "20:00" },
    wed: { open: "08:00", close: "20:00" },
    thu: { open: "08:00", close: "20:00" },
    fri: { open: "08:00", close: "20:00" },
    sat: { open: "09:00", close: "17:00" },
    sun: { open: "10:00", close: "14:00" },
  } as Record<DayKey, DayHours>,
  timeZone: "Asia/Colombo",
} as const;

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_LABELS: Record<DayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export interface ClinicClock {
  timeZone: string;
  today: string;
  todayWeekday: string;
  todayLabel: string;
  time: string;
  tomorrow: string;
  tomorrowWeekday: string;
  tomorrowLabel: string;
}

function clinicParts(date: Date, options: Intl.DateTimeFormatOptions) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC.timeZone, ...options })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  ) as Record<string, string>;
}

/** Hospital wall clock in Asia/Colombo — use this instead of the model’s guessed date. */
export function getClinicClock(date: Date = new Date()): ClinicClock {
  const todayParts = clinicParts(date, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const tomorrowDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowParts = clinicParts(tomorrowDate, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const tomorrow = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrowDate);

  const todayLabel = `${todayParts.weekday} ${todayParts.day} ${todayParts.month} ${todayParts.year}`;
  const tomorrowLabel = `${tomorrowParts.weekday} ${tomorrowParts.day} ${tomorrowParts.month} ${tomorrowParts.year}`;

  return {
    timeZone: CLINIC.timeZone,
    today,
    todayWeekday: todayParts.weekday,
    todayLabel,
    time: `${todayParts.hour}:${todayParts.minute}`,
    tomorrow,
    tomorrowWeekday: tomorrowParts.weekday,
    tomorrowLabel,
  };
}

export function formatClinicDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return dateStr;
  const parts = clinicParts(date, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.year}`;
}

export function getOperatingHoursList(): {
  key: DayKey;
  label: string;
  hours: string;
  isToday: boolean;
}[] {
  const clock = getClinicClock();
  const todayKey = DAY_KEYS.find((key) => DAY_LABELS[key] === clock.todayWeekday) ?? "mon";

  return DAY_KEYS.map((key) => {
    const hours = CLINIC.hours[key];
    return {
      key,
      label: DAY_LABELS[key],
      hours: hours ? `${formatTime(hours.open)} – ${formatTime(hours.close)}` : "Closed",
      isToday: key === todayKey,
    };
  });
}

function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

export interface ClinicOpenStatus {
  isOpen: boolean;
  label: string;
  todayHours: string;
}

/**
 * Determines whether the clinic is currently open, based on the provided
 * (or current) date, evaluated against `CLINIC.hours`.
 */
export function getClinicOpenStatus(date: Date = new Date()): ClinicOpenStatus {
  const clock = getClinicClock(date);
  const dayKey =
    DAY_KEYS.find((key) => DAY_LABELS[key] === clock.todayWeekday) ?? "mon";
  const todayHours = CLINIC.hours[dayKey];

  if (!todayHours) {
    return { isOpen: false, label: "Closed Today", todayHours: "Closed" };
  }

  const [hourStr, minuteStr] = clock.time.split(":");
  const minutesNow = Number(hourStr) * 60 + Number(minuteStr);
  const [openHour, openMinute] = todayHours.open.split(":").map(Number);
  const [closeHour, closeMinute] = todayHours.close.split(":").map(Number);
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  const isOpen = minutesNow >= openMinutes && minutesNow < closeMinutes;
  const todayRange = `${formatTime(todayHours.open)} – ${formatTime(todayHours.close)}`;

  return {
    isOpen,
    label: isOpen
      ? `Open Today: ${todayRange}`
      : "After-Hours: 24/7 Emergency Line Active",
    todayHours: todayRange,
  };
}

/** Live Cloud API inbox, if configured. Placeholder demo numbers are ignored. */
export function getWhatsAppBusinessNumber(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER?.replace(/\D/g, "") ?? "";
  if (fromEnv) return fromEnv;
  if (CLINIC.whatsapp && CLINIC.whatsapp !== "94110000000") return CLINIC.whatsapp;
  return null;
}

/**
 * WhatsApp deep link for site buttons. Until a real Cloud API number is set,
 * this opens the in-browser front-desk tester so the bot can be used locally.
 */
export function getWhatsAppHref(message: string = CLINIC.whatsappMessage): string {
  const number = getWhatsAppBusinessNumber();
  if (!number) return "/whatsapp-lab";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Direct WhatsApp hotline for the 24/7 emergency / concierge number. */
export function getEmergencyWhatsAppHref(): string {
  return `https://wa.me/${CLINIC.emergencyPhoneRaw.replace(/\D/g, "")}`;
}

export function getClinicFullAddress(): string {
  const { line1, line2, city, region, postalCode, country } = CLINIC.address;
  return `${line1}, ${line2}, ${city}, ${region} ${postalCode}, ${country}`;
}
