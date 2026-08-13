import { CLINIC } from "@/lib/clinic-config";

export interface ClinicFaq {
  category: string;
  question: string;
  answer: string;
}

/**
 * Shared FAQ corpus used by the public FAQ page and the Dental Care chatbot
 * system prompt / knowledge tools.
 */
export const CLINIC_FAQS: ClinicFaq[] = [
  {
    category: "Insurance & Financing",
    question: "Do you accept dental insurance?",
    answer:
      "Yes — we work with most major dental insurance providers. Bring your insurance card to your first visit and our front desk will verify your benefits and estimate your out-of-pocket cost before treatment begins.",
  },
  {
    category: "Insurance & Financing",
    question: "Do you offer payment plans or financing?",
    answer: `Absolutely. ${CLINIC.name} offers interest-free installment plans for treatments over $500, as well as third-party financing options for larger procedures like implants or full-mouth reconstructions.`,
  },
  {
    category: "Insurance & Financing",
    question: "What happens if I don't have insurance?",
    answer:
      "No problem. We offer a transparent, published price range for every service (see our Services page) and a self-pay discount for upfront payment.",
  },
  {
    category: "Appointments",
    question: "How do I book an appointment?",
    answer:
      "You can book online through our website booking wizard, or ask our Live Chat assistant to check availability and book for you (sign-in required to confirm). Use the 'Book Appointment' button anywhere on the site for the full 5-step flow.",
  },
  {
    category: "Appointments",
    question: "Can I reschedule or cancel my appointment?",
    answer:
      "Yes, sign in and visit your Patient Dashboard to reschedule or cancel any upcoming appointment. We kindly ask for at least 24 hours' notice.",
  },
  {
    category: "Appointments",
    question: "What should I bring to my first visit?",
    answer:
      "Please bring a valid photo ID, your insurance card (if applicable), a list of current medications, and any recent dental X-rays if you're transferring from another clinic.",
  },
  {
    category: "Treatments",
    question: "Is laser dentistry painful?",
    answer:
      "Most patients report significantly less discomfort with laser dentistry compared to traditional drills, often without the need for anesthesia for minor procedures.",
  },
  {
    category: "Treatments",
    question: "How long do cosmetic results like whitening or veneers last?",
    answer:
      "Professional whitening typically lasts 1-3 years with good habits, while porcelain veneers can last 10-15+ years with proper care and regular checkups.",
  },
  {
    category: "Safety & Hygiene",
    question: "What sterilization protocols do you follow?",
    answer:
      "Every instrument goes through ultrasonic decontamination and Class B autoclave sterilization, verified weekly with biological indicators. See our About page for the full protocol.",
  },
  {
    category: "Safety & Hygiene",
    question: "Is the clinic safe for children and elderly patients?",
    answer:
      "Yes — we have a dedicated pediatric suite with gentle, kid-friendly staff, plus accessible treatment rooms and sedation options for elderly or anxious patients.",
  },
];
