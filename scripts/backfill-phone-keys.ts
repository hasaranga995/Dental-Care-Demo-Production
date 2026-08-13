/**
 * Re-keys `users.phone_normalized` / `users.phone_key` (and staff subscribers)
 * to full E.164 via libphonenumber-js.
 *
 * Safe to re-run. Replaces the old "last 9 digits" keys so UK/Maldives/Gulf
 * numbers no longer collide with Sri Lankan ones.
 *
 * Usage: `npm run db:backfill-phones`
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { eq, isNotNull } = await import("drizzle-orm");
  const schema = await import("../src/db/schema");
  const { phoneIdentity } = await import("../src/lib/vip/phone");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local first.");
  }

  const db = drizzle(neon(databaseUrl), { schema });
  const { users, staffAlertSubscribers } = schema;

  const patientRows = await db
    .select({
      id: users.id,
      phone: users.phone,
      name: users.name,
      phoneKey: users.phoneKey,
    })
    .from(users)
    .where(isNotNull(users.phone));

  console.log(`Re-keying ${patientRows.length} patient/user phone(s)…`);

  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const row of patientRows) {
    const identity = phoneIdentity(row.phone);
    if (!identity.phoneKey) {
      skipped += 1;
      console.warn(`  skipped ${row.name}: "${row.phone}" is not a usable number`);
      continue;
    }

    if (row.phoneKey === identity.phoneKey) {
      unchanged += 1;
      continue;
    }

    await db.update(users).set(identity).where(eq(users.id, row.id));
    updated += 1;
    console.log(`  ${row.name}: ${row.phoneKey ?? "(none)"} → ${identity.phoneKey}`);
  }

  const staffRows = await db.select().from(staffAlertSubscribers);
  console.log(`\nRe-keying ${staffRows.length} staff subscriber phone(s)…`);

  let staffUpdated = 0;
  for (const row of staffRows) {
    const identity = phoneIdentity(row.phone);
    if (!identity.phoneKey || row.phoneKey === identity.phoneKey) continue;

    await db
      .update(staffAlertSubscribers)
      .set({ phone: identity.phoneNormalized!, phoneKey: identity.phoneKey })
      .where(eq(staffAlertSubscribers.id, row.id));
    staffUpdated += 1;
    console.log(`  staff ${row.name || row.phone}: ${row.phoneKey} → ${identity.phoneKey}`);
  }

  console.log(
    `\nDone. Patients updated ${updated}, unchanged ${unchanged}, skipped ${skipped}. Staff updated ${staffUpdated}.`
  );
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
