export const DEMO_PLAN_COOKIE = "dh_plan";

export type DemoPlanId = "presence" | "practice" | "premier";

export type PlanFeatureKey =
  | "multiPage"
  | "auth"
  | "booking"
  | "admin"
  | "fullAdmin"
  | "vip"
  | "ai"
  | "whatsapp"
  | "sms";

export type PlanFeatures = Record<PlanFeatureKey, boolean>;

export const PLAN_FEATURES: Record<DemoPlanId, PlanFeatures> = {
  presence: {
    multiPage: false,
    auth: false,
    booking: false,
    admin: false,
    fullAdmin: false,
    vip: false,
    ai: false,
    whatsapp: false,
    sms: false,
  },
  practice: {
    multiPage: true,
    auth: true,
    booking: true,
    admin: true,
    fullAdmin: false,
    vip: false,
    ai: false,
    whatsapp: false,
    sms: false,
  },
  premier: {
    multiPage: true,
    auth: true,
    booking: true,
    admin: true,
    fullAdmin: true,
    vip: true,
    ai: true,
    whatsapp: true,
    sms: true,
  },
};

export const PLAN_DISPLAY_NAME: Record<DemoPlanId, string> = {
  presence: "Basic",
  practice: "Signature",
  premier: "Premium",
};

export type PlanListItem = {
  text: string;
  included: boolean;
  spotlight?: "vip" | "ai" | "whatsapp";
};

export type DemoPlanCatalogItem = {
  id: DemoPlanId;
  name: string;
  eyebrow: string;
  tagline: string;
  cta: string;
  highlighted: boolean;
  badge?: string;
  features: PlanListItem[];
  support: {
    title: string;
    items: string[];
  };
  backups?: {
    title: string;
    items: string[];
  };
};

export const DEMO_PLAN_CATALOG: DemoPlanCatalogItem[] = [
  {
    id: "presence",
    name: "Basic",
    eyebrow: "Digital brochure",
    tagline: "A polished one-page hospital site so patients can find you, trust you, and call.",
    cta: "Launch Basic demo",
    highlighted: false,
    features: [
      { text: "Single-page hospital website", included: true },
      { text: "Hero, services overview, doctors & reviews", included: true },
      { text: "Hours, address, phone & map on the homepage", included: true },
      { text: "Call-to-book (no online scheduling)", included: true },
      { text: "SSL hosting & clinic branding", included: true },
      { text: "Extra pages (Services, About, Team, FAQs, Contact)", included: false },
      { text: "Patient sign-in & dashboard", included: false },
      { text: "Online appointment booking", included: false },
      { text: "Staff / admin portal", included: false },
      { text: "AI Customer care, WhatsApp, SMS & VIP", included: false },
    ],
    support: {
      title: "Customer support",
      items: [
        "Email support for the first month only",
        "Help centre articles",
      ],
    },
  },
  {
    id: "practice",
    name: "Signature",
    eyebrow: "Clinic website",
    tagline: "Every page, online booking, and a staff portal — the operating website for a busy practice.",
    cta: "Launch Signature demo",
    highlighted: false,
    features: [
      { text: "All public pages (Home, Services, About, Team, FAQs, Contact)", included: true },
      { text: "Online appointment booking", included: true },
      { text: "Patient sign-in & personal dashboard", included: true },
      { text: "Email appointment confirmations", included: true },
      { text: "Basic admin: view, update, and cancel bookings", included: true },
      { text: "Doctor portal", included: true },
      { text: "VIP / VVIP patient recognition", included: false },
      { text: "AI Customer care", included: false },
      { text: "WhatsApp AI Bot", included: false },
      { text: "SMS appointment alerts", included: false },
    ],
    support: {
      title: "Customer support",
      items: [
        "Email + phone support",
        "Next-business-day response",
        "Onboarding call & staff walkthrough",
      ],
    },
    backups: {
      title: "Backups & reliability",
      items: ["1-month backup retention"],
    },
  },
  {
    id: "premier",
    name: "Premium",
    eyebrow: "Concierge suite",
    tagline: "The full digital hospital: AI Customer care, WhatsApp, SMS, and white-glove VIP care.",
    cta: "Launch Premium demo",
    highlighted: true,
    badge: "Most Chosen",
    features: [
      { text: "VIP / VVIP patient recognition", included: true, spotlight: "vip" },
      { text: "AI Customer care", included: true, spotlight: "ai" },
      { text: "WhatsApp AI Bot", included: true, spotlight: "whatsapp" },
      { text: "AI knowledge base for the clinic", included: true, spotlight: "ai" },
      { text: "All public pages (Home, Services, About, Team, FAQs, Contact)", included: true },
      { text: "Online appointment booking", included: true },
      { text: "Patient sign-in & personal dashboard", included: true },
      { text: "Email appointment confirmations", included: true },
      { text: "Doctor portal", included: true },
      { text: "Full admin portal", included: true },
      { text: "SMS appointment alerts", included: true },
    ],
    support: {
      title: "Customer support",
      items: ["24/7 customer support", "30-minute critical-issue response"],
    },
    backups: {
      title: "Backups & reliability",
      items: [
        "Daily automated backups",
        "99.99% uptime target",
        "Disaster recovery available on discussion",
      ],
    },
  },
];

export function isDemoPlanId(value: string | undefined | null): value is DemoPlanId {
  return value === "presence" || value === "practice" || value === "premier";
}

export function getPlanFeatures(plan: DemoPlanId | null): PlanFeatures {
  if (!plan) return PLAN_FEATURES.presence;
  return PLAN_FEATURES[plan];
}

export function getPlanCatalogItem(plan: DemoPlanId): DemoPlanCatalogItem {
  const item = DEMO_PLAN_CATALOG.find((entry) => entry.id === plan);
  if (!item) throw new Error(`Unknown demo plan: ${plan}`);
  return item;
}
