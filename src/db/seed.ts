/**
 * Idempotent database seed script for local development and demos.
 *
 * Usage: `npm run db:seed` (requires a real `DATABASE_URL` in `.env.local`).
 *
 * Seeds:
 *  - A realistic catalogue of services across every category.
 *  - A handful of doctor accounts with varied specialties & working hours.
 *  - One admin account.
 *
 * Doctor/admin rows use placeholder Clerk ids (`seed_*`) since they aren't
 * backed by real Clerk accounts. To actually sign in as one of them, sign up
 * normally with the same email, then use `setUserRole()` (or update the
 * `role` column directly) to promote that real account.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const schema = await import("./schema");
  const { users, doctors, services } = schema;
  const { eq } = await import("drizzle-orm");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local before seeding.");
  }

  const db = drizzle(neon(databaseUrl), { schema });

  console.log("Seeding Dental Care database...\n");

  // ---------------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------------
  const serviceRows = [
    {
      name: "Professional Teeth Whitening",
      slug: "teeth-whitening",
      category: "Cosmetic" as const,
      description: "In-office laser whitening for a brighter smile in under an hour.",
      fullDetails:
        "Our advanced laser whitening system lifts years of staining from coffee, wine, and tobacco in a single, comfortable in-office visit. A dentist-supervised gel formula is calibrated to your enamel sensitivity, delivering a visibly brighter smile — typically 4 to 8 shades lighter — without the sensitivity common to over-the-counter kits.",
      priceRange: "$250 – $450",
      durationMinutes: 60,
      icon: "Sparkles",
      featured: true,
      treatmentSteps: [
        { title: "Shade Assessment", description: "We photograph and record your baseline tooth shade for comparison." },
        { title: "Protective Barrier", description: "Gums are isolated with a protective resin to shield soft tissue." },
        { title: "Laser Activation", description: "A whitening gel is applied and activated with our in-office laser in short cycles." },
        { title: "Final Polish & Shade Check", description: "Teeth are polished and compared against your baseline shade." },
      ],
      faqs: [
        { question: "How long do results last?", answer: "With good oral hygiene and limited staining foods, results typically last 12–24 months." },
        { question: "Will it hurt?", answer: "Most patients feel mild, temporary sensitivity that resolves within a day." },
      ],
    },
    {
      name: "Porcelain Veneers",
      slug: "porcelain-veneers",
      category: "Cosmetic" as const,
      description: "Ultra-thin custom shells that transform shape, size, and color.",
      fullDetails:
        "Porcelain veneers are hand-crafted, ultra-thin ceramic shells bonded to the front of your teeth to correct chips, gaps, discoloration, or uneven shape. Using digital smile design, we preview your new smile before any preparation begins, ensuring the final result matches your goals precisely.",
      priceRange: "$900 – $2,200 per tooth",
      durationMinutes: 90,
      icon: "Sparkles",
      featured: true,
      treatmentSteps: [
        { title: "Digital Smile Design", description: "We simulate your new smile digitally so you can preview the result." },
        { title: "Minimal Preparation", description: "A thin layer of enamel is gently prepared to make room for the veneer." },
        { title: "Custom Fabrication", description: "Veneers are hand-crafted in a dental lab to match your desired shade and shape." },
        { title: "Bonding & Finishing", description: "Veneers are bonded, polished, and checked for a natural bite." },
      ],
      faqs: [
        { question: "Are veneers reversible?", answer: "Traditional veneers require minor enamel removal and are considered a permanent cosmetic investment." },
        { question: "How long do veneers last?", answer: "With proper care, porcelain veneers typically last 10–15 years." },
      ],
    },
    {
      name: "Dental Implants",
      slug: "dental-implants",
      category: "Surgery" as const,
      description: "Permanent titanium root replacement for missing teeth.",
      fullDetails:
        "Dental implants replace missing teeth at the root, preserving jawbone density and restoring full chewing function. Using 3D CT-guided planning, our oral surgeons place a biocompatible titanium post that fuses with your jawbone, topped with a natural-looking crown.",
      priceRange: "$1,800 – $4,500 per implant",
      durationMinutes: 120,
      icon: "Scissors",
      featured: true,
      treatmentSteps: [
        { title: "3D CT Scan & Planning", description: "A detailed 3D scan maps your jawbone for precise, guided implant placement." },
        { title: "Implant Placement", description: "The titanium implant post is placed under local anesthesia or sedation." },
        { title: "Osseointegration", description: "Over 3–6 months, the implant fuses naturally with the surrounding bone." },
        { title: "Crown Placement", description: "A custom crown is attached, matching your natural tooth color and shape." },
      ],
      faqs: [
        { question: "Is the procedure painful?", answer: "Most patients report less discomfort than a tooth extraction, managed with local anesthesia and aftercare." },
        { question: "How long do implants last?", answer: "With good hygiene, implants can last a lifetime — the crown may need replacement after 15–20 years." },
      ],
    },
    {
      name: "Wisdom Tooth Extraction",
      slug: "wisdom-tooth-extraction",
      category: "Surgery" as const,
      description: "Safe, comfortable removal of impacted or problematic wisdom teeth.",
      fullDetails:
        "Impacted or misaligned wisdom teeth can cause pain, crowding, and infection. Our oral surgeons use advanced imaging to plan a precise, minimally invasive extraction, with sedation options available for maximum comfort.",
      priceRange: "$200 – $700 per tooth",
      durationMinutes: 45,
      icon: "Scissors",
      featured: false,
      treatmentSteps: [
        { title: "Imaging & Consultation", description: "Panoramic X-rays assess tooth position and root proximity to nerves." },
        { title: "Anesthesia or Sedation", description: "We select the most comfortable option for your case, from local anesthesia to IV sedation." },
        { title: "Extraction", description: "The tooth is carefully removed, minimizing trauma to surrounding tissue." },
        { title: "Recovery Guidance", description: "You'll receive detailed aftercare instructions and a follow-up check." },
      ],
      faqs: [
        { question: "How long is recovery?", answer: "Most patients recover within 3–5 days, with full healing in about two weeks." },
        { question: "Do all wisdom teeth need removal?", answer: "Not always — we'll assess whether yours are impacted, causing crowding, or otherwise problematic." },
      ],
    },
    {
      name: "Invisalign Clear Aligners",
      slug: "invisalign",
      category: "Orthodontics" as const,
      description: "Virtually invisible aligners to straighten teeth on your schedule.",
      fullDetails:
        "Invisalign uses a custom series of clear, removable aligners to gradually shift your teeth into alignment — without brackets or wires. We use digital scanning to plan your entire treatment from day one to your final smile.",
      priceRange: "$3,000 – $6,500",
      durationMinutes: 45,
      icon: "Braces",
      featured: true,
      treatmentSteps: [
        { title: "Digital 3D Scan", description: "A precise digital scan replaces uncomfortable molds and maps your treatment plan." },
        { title: "Custom Aligner Series", description: "You receive a series of custom aligners, worn 20–22 hours per day." },
        { title: "Progress Check-ins", description: "Brief visits every 6–8 weeks track your progress and issue new aligner sets." },
        { title: "Retention", description: "A retainer preserves your new smile once treatment is complete." },
      ],
      faqs: [
        { question: "How long does treatment take?", answer: "Most cases take 12–18 months, though mild cases may finish sooner." },
        { question: "Can I eat normally?", answer: "Yes — aligners are removable, so there are no food restrictions." },
      ],
    },
    {
      name: "Traditional Metal Braces",
      slug: "metal-braces",
      category: "Orthodontics" as const,
      description: "Reliable, effective correction for complex bite and alignment issues.",
      fullDetails:
        "For more complex orthodontic cases, traditional metal braces remain the gold standard, offering precise, predictable control over tooth movement. Our orthodontists use low-profile brackets and modern wire technology for a more comfortable experience than braces of the past.",
      priceRange: "$3,500 – $7,000",
      durationMinutes: 60,
      icon: "Braces",
      featured: false,
      treatmentSteps: [
        { title: "Orthodontic Assessment", description: "X-rays and impressions determine the ideal treatment plan for your bite." },
        { title: "Bracket Placement", description: "Brackets are bonded to each tooth and connected with an archwire." },
        { title: "Periodic Adjustments", description: "Visits every 4–6 weeks fine-tune wire tension to guide tooth movement." },
        { title: "Debonding & Retainer", description: "Braces are removed and a retainer is fitted to maintain your new smile." },
      ],
      faqs: [
        { question: "Do braces hurt?", answer: "You may feel mild pressure for a few days after adjustments, which subsides quickly." },
        { question: "How long is treatment?", answer: "Typically 18–30 months depending on the complexity of your case." },
      ],
    },
    {
      name: "Comprehensive Checkup & Cleaning",
      slug: "checkup-and-cleaning",
      category: "General" as const,
      description: "Routine exam, professional cleaning, and cavity screening.",
      fullDetails:
        "Our comprehensive checkup includes a full oral exam, digital X-rays when needed, professional scaling and polishing, and a personalized hygiene plan — the foundation of long-term oral health.",
      priceRange: "$90 – $180",
      durationMinutes: 45,
      icon: "Stethoscope",
      featured: true,
      treatmentSteps: [
        { title: "Oral Examination", description: "A thorough check of teeth, gums, and soft tissue for early warning signs." },
        { title: "Digital X-rays", description: "As needed, to detect issues not visible to the eye." },
        { title: "Professional Cleaning", description: "Scaling and polishing removes plaque and surface stains." },
        { title: "Personalized Plan", description: "We discuss findings and tailor a home-care routine to your needs." },
      ],
      faqs: [
        { question: "How often should I visit?", answer: "We recommend a checkup and cleaning every six months for most patients." },
        { question: "Will X-rays be taken every visit?", answer: "Only as clinically necessary — typically once a year for most healthy adults." },
      ],
    },
    {
      name: "Tooth-Colored Fillings",
      slug: "tooth-colored-fillings",
      category: "General" as const,
      description: "Composite resin fillings that blend naturally with your smile.",
      fullDetails:
        "We replace old metal fillings — or treat new cavities — with tooth-colored composite resin that bonds directly to your tooth structure, restoring strength while remaining virtually invisible.",
      priceRange: "$150 – $400 per tooth",
      durationMinutes: 30,
      icon: "Stethoscope",
      featured: false,
      treatmentSteps: [
        { title: "Numbing", description: "The area is gently numbed for a comfortable procedure." },
        { title: "Decay Removal", description: "Any decayed tissue is carefully removed." },
        { title: "Composite Bonding", description: "Tooth-colored resin is layered, shaped, and cured with a curing light." },
        { title: "Bite Check", description: "The filling is polished and your bite is checked for comfort." },
      ],
      faqs: [
        { question: "How long do fillings last?", answer: "Composite fillings typically last 7–10 years with good oral care." },
        { question: "Is the procedure painful?", answer: "No — local anesthesia keeps the area comfortable throughout." },
      ],
    },
    {
      name: "Kids' First Dental Visit",
      slug: "kids-first-visit",
      category: "Pediatric" as const,
      description: "A gentle, welcoming introduction to dental care for children.",
      fullDetails:
        "Designed for children's first dental experiences, this gentle visit builds comfort and trust through age-appropriate explanations, a painless exam, and — when appropriate — a light cleaning and fluoride treatment.",
      priceRange: "$60 – $120",
      durationMinutes: 30,
      icon: "Baby",
      featured: true,
      treatmentSteps: [
        { title: "Meet & Greet", description: "Your child explores our kid-friendly room and meets their dentist." },
        { title: "Gentle Exam", description: "A quick, painless look at teeth and gums, explained in kid-friendly terms." },
        { title: "Fluoride Treatment", description: "A quick fluoride application helps protect developing enamel." },
        { title: "Parent Consultation", description: "We share tips on brushing, diet, and habits for healthy smiles." },
      ],
      faqs: [
        { question: "When should my child's first visit be?", answer: "The American Dental Association recommends a first visit by age one or within six months of the first tooth." },
        { question: "What if my child is nervous?", answer: "Our team specializes in making first visits fun, calm, and positive." },
      ],
    },
    {
      name: "Pediatric Sealants & Fluoride",
      slug: "pediatric-sealants",
      category: "Pediatric" as const,
      description: "Protective sealants and fluoride to prevent childhood cavities.",
      fullDetails:
        "Dental sealants form a protective barrier over the chewing surfaces of back teeth, where cavities are most common in children. Paired with a professional fluoride treatment, this is one of the most effective ways to prevent decay in growing smiles.",
      priceRange: "$40 – $90 per tooth",
      durationMinutes: 20,
      icon: "Baby",
      featured: false,
      treatmentSteps: [
        { title: "Cleaning", description: "Teeth are cleaned and dried in preparation for sealant application." },
        { title: "Sealant Application", description: "A liquid resin is painted onto the grooves of back teeth." },
        { title: "Curing", description: "A curing light hardens the sealant in seconds." },
        { title: "Fluoride Varnish", description: "A fluoride varnish is applied to strengthen enamel." },
      ],
      faqs: [
        { question: "How long do sealants last?", answer: "Sealants can protect teeth for up to 5–10 years with routine checkups." },
        { question: "Is fluoride safe for kids?", answer: "Yes — professional fluoride treatments use safe, monitored amounts appropriate for a child's age." },
      ],
    },
  ];

  for (const service of serviceRows) {
    await db.insert(services).values(service).onConflictDoNothing({ target: services.slug });
  }
  console.log(`✓ Seeded ${serviceRows.length} services`);

  // ---------------------------------------------------------------------
  // Doctors (+ their user accounts)
  // ---------------------------------------------------------------------
  const doctorRows = [
    {
      clerkId: "seed_doctor_anura_perera",
      email: "dr.perera@dentalcare.example",
      legacyEmails: ["dr.okafor@dentalcare.example"],
      name: "Anura Perera",
      specialty: "Cosmetic & Restorative Dentistry",
      bio: "Dr. Perera specializes in smile makeovers, veneers, and whitening, blending artistry with clinical precision to help patients feel confident in their smile.",
      workingHours: {
        mon: { start: "09:00", end: "17:00" },
        tue: { start: "09:00", end: "17:00" },
        wed: { start: "09:00", end: "17:00" },
        thu: { start: "09:00", end: "17:00" },
        fri: { start: "09:00", end: "15:00" },
        sat: null,
        sun: null,
      },
    },
    {
      clerkId: "seed_doctor_dilini_silva",
      email: "dr.silva@dentalcare.example",
      legacyEmails: ["dr.chen@dentalcare.example"],
      name: "Dilini Silva",
      specialty: "Oral & Maxillofacial Surgery",
      bio: "Dr. Silva is a board-certified oral surgeon with over a decade of experience in dental implants, wisdom tooth extraction, and 3D-guided surgical planning.",
      workingHours: {
        mon: { start: "08:00", end: "16:00" },
        tue: { start: "08:00", end: "16:00" },
        wed: null,
        thu: { start: "08:00", end: "16:00" },
        fri: { start: "08:00", end: "16:00" },
        sat: { start: "09:00", end: "13:00" },
        sun: null,
      },
    },
    {
      clerkId: "seed_doctor_kavinda_fernando",
      email: "dr.fernando@dentalcare.example",
      legacyEmails: ["dr.sharma@dentalcare.example"],
      name: "Kavinda Fernando",
      specialty: "Orthodontics",
      bio: "Dr. Fernando helps patients of all ages achieve beautifully aligned smiles using Invisalign and traditional braces, with a focus on personalized treatment timelines.",
      workingHours: {
        mon: { start: "10:00", end: "18:00" },
        tue: { start: "10:00", end: "18:00" },
        wed: { start: "10:00", end: "18:00" },
        thu: null,
        fri: { start: "10:00", end: "18:00" },
        sat: { start: "10:00", end: "14:00" },
        sun: null,
      },
    },
    {
      clerkId: "seed_doctor_nimali_jayawardena",
      email: "dr.jayawardena@dentalcare.example",
      legacyEmails: ["dr.oconnor@dentalcare.example"],
      name: "Nimali Jayawardena",
      specialty: "General & Family Dentistry",
      bio: "Dr. Jayawardena has spent 15 years providing warm, comprehensive family dental care, from routine checkups to advanced restorative treatment.",
      workingHours: {
        mon: { start: "08:00", end: "16:00" },
        tue: { start: "08:00", end: "16:00" },
        wed: { start: "08:00", end: "16:00" },
        thu: { start: "08:00", end: "16:00" },
        fri: { start: "08:00", end: "16:00" },
        sat: null,
        sun: null,
      },
    },
    {
      clerkId: "seed_doctor_sachini_wickramasinghe",
      email: "dr.wickramasinghe@dentalcare.example",
      legacyEmails: ["dr.reyes@dentalcare.example"],
      name: "Sachini Wickramasinghe",
      specialty: "Pediatric Dentistry",
      bio: "Dr. Wickramasinghe creates a calm, welcoming environment for young patients, specializing in preventive care and gentle first-visit experiences for children.",
      workingHours: {
        mon: { start: "09:00", end: "15:00" },
        tue: null,
        wed: { start: "09:00", end: "15:00" },
        thu: { start: "09:00", end: "15:00" },
        fri: { start: "09:00", end: "15:00" },
        sat: { start: "09:00", end: "12:00" },
        sun: null,
      },
    },
  ];

  for (const doctor of doctorRows) {
    const lookupEmails = [doctor.email, ...(doctor.legacyEmails ?? [])];
    let user: typeof users.$inferSelect | null = null;

    for (const email of lookupEmails) {
      user =
        (await db.select().from(users).where(eq(users.email, email)).limit(1))[0] ?? null;
      if (user) break;
    }

    if (!user) {
      const [userRow] = await db
        .insert(users)
        .values({
          clerkId: doctor.clerkId,
          email: doctor.email,
          name: doctor.name,
          role: "doctor",
        })
        .onConflictDoNothing({ target: users.email })
        .returning();
      user =
        userRow ??
        (await db.select().from(users).where(eq(users.email, doctor.email)).limit(1))[0];
    }

    if (!user) continue;

    // Keep demo names localized even when the seed is re-run against an existing DB.
    await db
      .update(users)
      .set({ name: doctor.name, email: doctor.email, clerkId: doctor.clerkId })
      .where(eq(users.id, user.id));

    const [existingDoctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.userId, user.id))
      .limit(1);

    if (!existingDoctor) {
      await db.insert(doctors).values({
        userId: user.id,
        specialty: doctor.specialty,
        bio: doctor.bio,
        workingHours: doctor.workingHours,
        isAvailable: true,
      });
    } else {
      await db
        .update(doctors)
        .set({
          specialty: doctor.specialty,
          bio: doctor.bio,
          workingHours: doctor.workingHours,
          isAvailable: true,
        })
        .where(eq(doctors.id, existingDoctor.id));
    }
  }
  console.log(`✓ Seeded ${doctorRows.length} doctors`);

  // ---------------------------------------------------------------------
  // Admin account
  // ---------------------------------------------------------------------
  await db
    .insert(users)
    .values({
      clerkId: "seed_admin_front_desk",
      email: "admin@dentalcare.example",
      name: "Front Desk Admin",
      role: "admin",
    })
    .onConflictDoNothing({ target: users.email });
  console.log("✓ Seeded 1 admin account");

  console.log("\nSeed complete! Note: doctor/admin accounts use placeholder Clerk ids.");
  console.log(
    "To log in as one of them locally, sign up with the matching email above, then update"
  );
  console.log("that user's `role` column (or call `setUserRole()`) to link the accounts.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
