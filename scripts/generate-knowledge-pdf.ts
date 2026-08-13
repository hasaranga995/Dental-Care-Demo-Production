/**
 * Generates a demo knowledge-base PDF for Dental Care chatbot upload.
 * Run: npx tsx scripts/generate-knowledge-pdf.ts
 */
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const OUT_DIR = path.join(process.cwd(), "public", "demo");
const OUT_FILE = path.join(OUT_DIR, "Dental-Care-Knowledge-Base-2026.pdf");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeSection(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.8);
  doc
    .fontSize(14)
    .fillColor("#0F2C59")
    .font("Helvetica-Bold")
    .text(title, { underline: false });
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(10).fillColor("#1E293B");
}

function bullet(doc: PDFKit.PDFDocument, lines: string[]) {
  for (const line of lines) {
    doc.text(`• ${line}`, { indent: 8, paragraphGap: 2 });
  }
}

async function main() {
  ensureDir(OUT_DIR);

  const doc = new PDFDocument({
    margin: 54,
    size: "A4",
    info: {
      Title: "Dental Care Hospital Services & Knowledge Guide 2026",
      Author: "Dental Care Private Hospital",
      Subject: "Official chatbot / patient knowledge base (DEMO V2026.R1.0)",
    },
  });

  const stream = fs.createWriteStream(OUT_FILE);
  doc.pipe(stream);

  // Cover
  doc
    .fontSize(22)
    .fillColor("#0F2C59")
    .font("Helvetica-Bold")
    .text("Dental Care Private Hospital", { align: "left" });
  doc
    .moveDown(0.3)
    .fontSize(16)
    .fillColor("#00B2D8")
    .text("Official Knowledge Base & Patient Guide 2026");
  doc
    .moveDown(0.4)
    .fontSize(10)
    .fillColor("#64748B")
    .font("Helvetica")
    .text("DEMO (V2026.R1.0) — Client demonstration website knowledge pack")
    .text("Where Modern Dentistry Meets Comfort")
    .text(`Generated for chatbot upload · ${new Date().toISOString().slice(0, 10)}`);

  writeSection(doc, "1. About the Hospital");
  doc.text(
    "Dental Care is a private dental hospital delivering cosmetic, surgical, orthodontic, pediatric, and family dentistry with hospital-grade sterilization and a calm, boutique experience. We combine 3D CT imaging, laser dentistry, same-day CAD/CAM crowns, and board-certified specialists."
  );
  doc.moveDown(0.3);
  bullet(doc, [
    "Legal name: Dental Care Private Hospital",
    "Google rating: 4.9/5 from 1,284+ reviews",
    "Accreditations: ISO 9001:2015 Certified; JCI Ambulatory Care Accredited; National Dental Council Licensed; Autoclave-Verified Sterilization Program",
  ]);

  writeSection(doc, "2. Contact, Location & Access");
  bullet(doc, [
    "Address: 128 Harbor View Avenue, Suite 400, Colombo, Western Province 00300, Sri Lanka",
    "Direct line: +94 11 000 0000",
    "Emergency / WhatsApp hotline: +94 77 123 4567",
    "Email: hello@dentalcare.example",
    "Transit: 2-minute walk from Harbor View Metro Station. Bus routes 04, 12, and 21 stop directly outside our main entrance.",
    "Parking: Complimentary valet parking at the main lobby entrance. 40 secure basement parking bays accessible via Dockside Lane.",
    "Accessibility: 100% wheelchair accessible, private elevator access, and multi-lingual staff (English, Sinhala, Tamil).",
  ]);

  writeSection(doc, "3. Opening Hours");
  bullet(doc, [
    "Monday–Friday: 08:00 – 20:00",
    "Saturday: 09:00 – 17:00",
    "Sunday: 10:00 – 14:00",
    "Outside these hours, call the emergency line for urgent dental trauma, uncontrolled bleeding, or severe swelling.",
  ]);

  writeSection(doc, "4. How to Book an Appointment");
  bullet(doc, [
    "Online: Use Book Appointment on the website (5-step wizard: service → doctor → date/time → details → confirm).",
    "Live Chat: Ask the Dental Care Concierge to check live availability and book (sign-in required to confirm).",
    "Phone: +94 11 000 0000 · WhatsApp hotline: +94 77 123 4567",
    "Patient Dashboard: Signed-in patients can view, reschedule, or cancel upcoming visits (please give 24 hours notice).",
    "Deep links: /book?service=SLUG&date=YYYY-MM-DD&doctor=DOCTOR_ID",
  ]);

  writeSection(doc, "5. Services, Duration & Price Ranges (Demo Pricing)");
  doc.text(
    "Prices below are published demo ranges for the client website. Final estimates are confirmed after clinical examination and insurance verification."
  );
  doc.moveDown(0.3);

  const services: Array<[string, string, string, string]> = [
    ["Cosmetic", "Professional Teeth Whitening", "45–60 min", "$250 – $450"],
    ["Cosmetic", "Porcelain Veneers", "2–3 visits", "$900 – $2,200 per tooth"],
    ["Surgery", "Dental Implants", "Multi-visit", "$1,800 – $4,500 per implant"],
    ["Surgery", "Wisdom Tooth Extraction", "45–90 min", "$200 – $700 per tooth"],
    ["Orthodontics", "Invisalign Clear Aligners", "6–18 months", "$3,000 – $6,500"],
    ["Orthodontics", "Traditional Metal Braces", "12–24 months", "$3,500 – $7,000"],
    ["General", "Comprehensive Checkup & Cleaning", "45–60 min", "$90 – $180"],
    ["General", "Tooth-Colored Fillings", "30–60 min", "$150 – $400 per tooth"],
    ["Pediatric", "Kids' First Dental Visit", "30–45 min", "$60 – $120"],
  ];

  for (const [category, name, duration, price] of services) {
    doc
      .font("Helvetica-Bold")
      .text(`${name} (${category})`)
      .font("Helvetica")
      .text(`Duration: ${duration} · Price range: ${price}`, { indent: 8 });
    doc.moveDown(0.15);
  }

  writeSection(doc, "6. Treatment Highlights");
  bullet(doc, [
    "Whitening: In-office laser whitening; gums protected; shade recorded before/after.",
    "Veneers: Digital smile design, minimal prep, lab-crafted porcelain, bonded and bite-checked.",
    "Implants: 3D CT planning, titanium post placement, osseointegration 3–6 months, custom crown.",
    "Wisdom teeth: Imaging consult, local anesthesia or sedation options, aftercare + follow-up.",
    "Invisalign: Digital 3D scan, 20–22 hours/day wear, check-ins every 6–8 weeks, retainers after.",
    "Braces: Assessment, bracket placement, adjustments every 4–6 weeks, retainer after debonding.",
    "Checkup/cleaning: Exam, X-rays as needed, scaling/polish, personalized home-care plan.",
    "Kids' first visit: Meet & greet, gentle exam, fluoride, parent coaching — no fear-based approach.",
  ]);

  writeSection(doc, "7. Technology & Clinical Standards");
  bullet(doc, [
    "3D CT Cone-Beam Imaging for implants and complex diagnostics",
    "Laser dentistry for reduced discomfort and faster healing",
    "Same-day CAD/CAM crowns",
    "Digital Smile Design previews",
    "Hospital-grade sterilization: ultrasonic decontamination + Class B autoclave, weekly biological indicators",
    "Sedation and pediatric-friendly suites available",
  ]);

  writeSection(doc, "8. Insurance, Financing & Self-Pay");
  bullet(doc, [
    "We work with most major dental insurance providers. Bring your card to the first visit for benefits verification and out-of-pocket estimates before treatment.",
    "Interest-free installment plans available for treatments over $500.",
    "Third-party financing available for larger cases (implants, full-mouth reconstruction).",
    "No insurance? Transparent published price ranges apply, plus a self-pay discount for upfront payment.",
  ]);

  writeSection(doc, "9. First Visit Checklist");
  bullet(doc, [
    "Valid photo ID",
    "Insurance card (if applicable)",
    "List of current medications / medical history",
    "Recent dental X-rays if transferring from another clinic",
    "Arrive 10–15 minutes early for registration",
  ]);

  writeSection(doc, "10. Cancellation & Rescheduling Policy");
  bullet(doc, [
    "Patients may cancel or reschedule from the Patient Dashboard after signing in.",
    "Please provide at least 24 hours' notice so another patient can use the slot.",
    "Repeated late cancellations may require a deposit for future bookings (demo policy).",
  ]);

  writeSection(doc, "11. Emergency Guidance");
  bullet(doc, [
    "Call +94 77 123 4567 immediately for severe pain, dental trauma, uncontrolled bleeding, facial swelling affecting breathing/swallowing, or knocked-out teeth.",
    "For knocked-out permanent teeth: keep the tooth moist (milk or saliva), do not scrub the root, and seek care ASAP.",
    "The Live Chat assistant can help with non-emergency questions and booking, but emergencies should use the phone line.",
  ]);

  writeSection(doc, "12. FAQs (Official Answers)");
  const faqs: Array<[string, string]> = [
    [
      "Do you accept dental insurance?",
      "Yes — most major providers. Bring your card; front desk verifies benefits and estimates out-of-pocket cost before treatment.",
    ],
    [
      "Do you offer payment plans?",
      "Yes — interest-free installments for treatments over $500, plus third-party financing for larger procedures.",
    ],
    [
      "What if I don't have insurance?",
      "Transparent published ranges apply, with a self-pay discount for upfront payment.",
    ],
    [
      "Is laser dentistry painful?",
      "Most patients report less discomfort than drills; minor procedures often need little or no anesthesia.",
    ],
    [
      "How long do whitening or veneers last?",
      "Whitening typically 1–3 years with good habits; porcelain veneers often 10–15+ years with care and checkups.",
    ],
    [
      "Is the clinic safe for children and elderly patients?",
      "Yes — dedicated pediatric suite and accessible rooms with sedation options for anxious or elderly patients.",
    ],
  ];
  for (const [q, a] of faqs) {
    doc.font("Helvetica-Bold").text(`Q: ${q}`);
    doc.font("Helvetica").text(`A: ${a}`);
    doc.moveDown(0.25);
  }

  writeSection(doc, "13. Demo Website Notes for the AI Assistant");
  bullet(doc, [
    "This document is the official uploaded knowledge pack for DEMO (V2026.R1.0).",
    "When answering patients, prefer this PDF for pricing, policies, and service descriptions.",
    "Always use live tools for doctor lists and real open time slots — never invent availability.",
    "Booking confirmation requires a signed-in patient account.",
    "Tone: polite, empathetic, clinical receptionist — clear, calm, and concise.",
  ]);

  doc.moveDown(1);
  doc
    .fontSize(9)
    .fillColor("#64748B")
    .text(
      "© Dental Care Private Hospital · Demo knowledge pack for chatbot upload · Not a substitute for clinical diagnosis.",
      { align: "left" }
    );

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  console.log(`Wrote ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
