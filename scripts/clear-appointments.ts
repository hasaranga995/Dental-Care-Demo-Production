/**
 * Deletes all appointments and related VIP-alert rows.
 * Keeps users (patients), doctors, and services.
 *
 * Usage: `npx tsx scripts/clear-appointments.ts`
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { neon } = await import("@neondatabase/serverless");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local first.");
  }

  const sql = neon(databaseUrl);

  const [before] = await sql`
    SELECT
      (SELECT count(*)::int FROM appointments) AS appointments,
      (SELECT count(*)::int FROM vip_alerts) AS vip_alerts,
      (SELECT count(*)::int FROM vip_alert_deliveries) AS vip_alert_deliveries,
      (SELECT count(*)::int FROM users WHERE role = 'patient') AS patients
  `;

  console.log("Before:", before);

  // Child rows first so missing ON DELETE CASCADE never blocks the wipe.
  const deliveries = await sql`DELETE FROM vip_alert_deliveries RETURNING id`;
  const alerts = await sql`DELETE FROM vip_alerts RETURNING id`;
  const bookings = await sql`DELETE FROM appointments RETURNING id`;

  const [after] = await sql`
    SELECT
      (SELECT count(*)::int FROM appointments) AS appointments,
      (SELECT count(*)::int FROM vip_alerts) AS vip_alerts,
      (SELECT count(*)::int FROM vip_alert_deliveries) AS vip_alert_deliveries,
      (SELECT count(*)::int FROM users WHERE role = 'patient') AS patients
  `;

  console.log(
    `Deleted ${bookings.length} appointment(s), ${alerts.length} VIP alert(s), ${deliveries.length} delivery row(s).`
  );
  console.log("After:", after);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
