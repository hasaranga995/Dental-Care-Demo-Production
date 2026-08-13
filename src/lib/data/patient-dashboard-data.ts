export const PATIENT_DASHBOARD_DATA = {
  patient: {
    name: "Rusiru",
    tier: "VIP",
    notes: "Prefers private waiting bay; offer tea on arrival.",
    phone: "++1-555-0017",
    email: "hasaranga995@gmail.com",
  },
  upcomingAppointments: [
    {
      id: "app-001",
      service: "Dental Implants",
      doctor: "Dr. Anura Perera",
      specialty: "Cosmetic & Restorative",
      date: "Thu, Aug 20, 2026",
      time: "11:30 AM",
      status: "confirmed",
      doctorImage:
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "app-002",
      service: "Kids' First Dental Visit",
      doctor: "Dr. Anura Perera",
      specialty: "General Dentistry",
      date: "Mon, Aug 17, 2026",
      time: "1:30 PM",
      status: "pending",
      doctorImage:
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
    },
  ],
  historyAppointments: [
    {
      id: "hist-001",
      service: "Comprehensive Checkup & Cleaning",
      doctor: "Dr. Nimali Jayawardena",
      date: "Wed, Aug 12, 2026",
      time: "2:00 PM",
      status: "pending",
      channelNote: "Booked via Lumina AI Concierge",
    },
    {
      id: "hist-002",
      service: "Comprehensive Checkup & Cleaning",
      doctor: "Dr. Anura Perera",
      date: "Tue, Aug 11, 2026",
      time: "9:30 AM",
      status: "pending",
    },
    {
      id: "hist-003",
      service: "Dental Implants",
      doctor: "Dr. Anura Perera",
      date: "Mon, Aug 10, 2026",
      time: "11:30 AM",
      status: "pending",
    },
    {
      id: "hist-004",
      service: "Invisalign Clear Aligners",
      doctor: "Dr. Dilini Silva",
      date: "Mon, Aug 10, 2026",
      time: "10:30 AM",
      status: "pending",
    },
  ],
} as const;

export const DOCTOR_AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80";
