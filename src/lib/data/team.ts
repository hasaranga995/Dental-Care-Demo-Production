import type { WorkingHours } from "@/db/schema";

export const TEAM_AVATARS = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&h=1000&q=80",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&h=1000&q=80",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=800&h=1000&q=80",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&h=1000&q=80",
  "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=800&h=1000&q=80",
] as const;

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export interface TeamHourRow {
  key: string;
  label: string;
  value: string;
  isOff: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  image: string;
  credentials: string[];
  languages: string[];
  focus: string[];
  hours: TeamHourRow[];
}

const PROFILE_EXTRAS: Record<
  string,
  { credentials: string[]; languages: string[]; focus: string[] }
> = {
  "Cosmetic & Restorative Dentistry": {
    credentials: ["BDS", "MSc Restorative Dentistry", "Board-certified cosmetic clinician"],
    languages: ["English", "Sinhala"],
    focus: ["Smile makeovers", "Porcelain veneers", "Professional whitening"],
  },
  "Oral & Maxillofacial Surgery": {
    credentials: ["BDS", "MDS Oral & Maxillofacial Surgery", "3D-guided implantology"],
    languages: ["English", "Sinhala", "Tamil"],
    focus: ["Dental implants", "Wisdom teeth", "Surgical planning"],
  },
  Orthodontics: {
    credentials: ["BDS", "MOrth", "Invisalign Platinum Provider"],
    languages: ["English", "Sinhala"],
    focus: ["Invisalign", "Braces", "Bite correction"],
  },
  "Orthodontics & Invisalign": {
    credentials: ["BDS", "MOrth", "Invisalign Platinum Provider"],
    languages: ["English", "Sinhala"],
    focus: ["Invisalign", "Braces", "Bite correction"],
  },
  "General & Family Dentistry": {
    credentials: ["BDS", "15+ years family practice"],
    languages: ["English", "Sinhala"],
    focus: ["Checkups", "Fillings", "Restorative care"],
  },
  "Pediatric Dentistry": {
    credentials: ["BDS", "MSc Paediatric Dentistry"],
    languages: ["English", "Sinhala"],
    focus: ["First visits", "Preventive care", "Gentle paediatric treatment"],
  },
};

const DEFAULT_EXTRAS = {
  credentials: ["BDS", "Hospital-credentialed specialist"],
  languages: ["English", "Sinhala"],
  focus: ["Patient-first care"],
};

const FALLBACK_HOURS: WorkingHours = {
  mon: { start: "09:00", end: "17:00" },
  tue: { start: "09:00", end: "17:00" },
  wed: { start: "09:00", end: "17:00" },
  thu: { start: "09:00", end: "17:00" },
  fri: { start: "09:00", end: "15:00" },
  sat: null,
  sun: null,
};

export const FALLBACK_TEAM: TeamMember[] = [
  {
    id: "fallback-anura",
    name: "Anura Perera",
    specialty: "Cosmetic & Restorative Dentistry",
    bio: "Dr. Perera specializes in smile makeovers, veneers, and whitening, blending artistry with clinical precision to help patients feel confident in their smile.",
    image: TEAM_AVATARS[0],
    ...PROFILE_EXTRAS["Cosmetic & Restorative Dentistry"],
    hours: formatWorkingHours(FALLBACK_HOURS),
  },
  {
    id: "fallback-dilini",
    name: "Dilini Silva",
    specialty: "Oral & Maxillofacial Surgery",
    bio: "Dr. Silva is a board-certified oral surgeon with over a decade of experience in dental implants, wisdom tooth extraction, and 3D-guided surgical planning.",
    image: TEAM_AVATARS[1],
    ...PROFILE_EXTRAS["Oral & Maxillofacial Surgery"],
    hours: formatWorkingHours({
      mon: { start: "08:00", end: "16:00" },
      tue: { start: "08:00", end: "16:00" },
      wed: null,
      thu: { start: "08:00", end: "16:00" },
      fri: { start: "08:00", end: "16:00" },
      sat: { start: "09:00", end: "13:00" },
      sun: null,
    }),
  },
  {
    id: "fallback-kavinda",
    name: "Kavinda Fernando",
    specialty: "Orthodontics",
    bio: "Dr. Fernando helps patients of all ages achieve beautifully aligned smiles using Invisalign and traditional braces, with a focus on personalized treatment timelines.",
    image: TEAM_AVATARS[2],
    ...PROFILE_EXTRAS.Orthodontics,
    hours: formatWorkingHours({
      mon: { start: "10:00", end: "18:00" },
      tue: { start: "10:00", end: "18:00" },
      wed: { start: "10:00", end: "18:00" },
      thu: null,
      fri: { start: "10:00", end: "18:00" },
      sat: { start: "10:00", end: "14:00" },
      sun: null,
    }),
  },
  {
    id: "fallback-nimali",
    name: "Nimali Jayawardena",
    specialty: "General & Family Dentistry",
    bio: "Dr. Jayawardena has spent 15 years providing warm, comprehensive family dental care, from routine checkups to advanced restorative treatment.",
    image: TEAM_AVATARS[3],
    ...PROFILE_EXTRAS["General & Family Dentistry"],
    hours: formatWorkingHours({
      mon: { start: "08:00", end: "16:00" },
      tue: { start: "08:00", end: "16:00" },
      wed: { start: "08:00", end: "16:00" },
      thu: { start: "08:00", end: "16:00" },
      fri: { start: "08:00", end: "16:00" },
      sat: null,
      sun: null,
    }),
  },
  {
    id: "fallback-sachini",
    name: "Sachini Wickramasinghe",
    specialty: "Pediatric Dentistry",
    bio: "Dr. Wickramasinghe creates a calm, welcoming environment for young patients, specializing in preventive care and gentle first-visit experiences for children.",
    image: TEAM_AVATARS[4],
    ...PROFILE_EXTRAS["Pediatric Dentistry"],
    hours: formatWorkingHours({
      mon: { start: "09:00", end: "15:00" },
      tue: null,
      wed: { start: "09:00", end: "15:00" },
      thu: { start: "09:00", end: "15:00" },
      fri: { start: "09:00", end: "15:00" },
      sat: { start: "09:00", end: "12:00" },
      sun: null,
    }),
  },
];

function formatClock(value: string) {
  const [hoursRaw, minutes] = value.split(":");
  const hours = Number(hoursRaw);
  if (!Number.isFinite(hours) || !minutes) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${suffix}`;
}

export function formatWorkingHours(hours: WorkingHours): TeamHourRow[] {
  return DAY_ORDER.map((key) => {
    const slot = hours[key];
    return {
      key,
      label: DAY_LABELS[key],
      value: slot ? `${formatClock(slot.start)} – ${formatClock(slot.end)}` : "Not in clinic",
      isOff: !slot,
    };
  });
}

export function toTeamMembers(
  doctors: Array<{
    id: string;
    specialty: string;
    bio: string;
    image: string | null;
    workingHours: WorkingHours;
    user: { name: string };
  }>
): TeamMember[] {
  if (doctors.length === 0) return FALLBACK_TEAM;

  return doctors.map((doctor, index) => {
    const extras = PROFILE_EXTRAS[doctor.specialty] ?? DEFAULT_EXTRAS;
    return {
      id: doctor.id,
      name: doctor.user.name,
      specialty: doctor.specialty,
      bio: doctor.bio || extras.focus.join(", "),
      image: doctor.image || TEAM_AVATARS[index % TEAM_AVATARS.length],
      credentials: extras.credentials,
      languages: extras.languages,
      focus: extras.focus,
      hours: formatWorkingHours(doctor.workingHours),
    };
  });
}

export function displayDoctorName(name: string) {
  const trimmed = name.replace(/^Dr\.?\s+/i, "");
  return `Dr. ${trimmed}`;
}
