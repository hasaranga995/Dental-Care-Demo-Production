import "server-only";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { phoneIdentity, phoneMatchKey } from "@/lib/vip/phone";
import { formatPatientEmail, formatPersonName, formatPhoneForStorage } from "@/lib/format-contact";

export type AppRole = "patient" | "doctor" | "admin";

/**
 * Looks up the Postgres `users` row for a given Clerk user id.
 */
export async function getDbUserByClerkId(clerkId: string): Promise<User | null> {
  const [row] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return row ?? null;
}

/**
 * Returns the Postgres user row for the currently signed-in Clerk user,
 * auto-provisioning it (role defaults to "patient") on first access. This
 * makes the app resilient even if the `/api/webhooks/clerk` endpoint hasn't
 * been configured yet (e.g. during local development).
 */
export async function getOrCreateCurrentUser(): Promise<User | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const existing = await getDbUserByClerkId(clerkUser.id);
  if (existing) return existing;

  const email = formatPatientEmail(
    clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkUser.id}@no-email.local`
  );
  const name = formatPersonName(
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
      email.split("@")[0]
  );
  const roleFromMetadata = (clerkUser.publicMetadata?.role as AppRole | undefined) ?? "patient";
  const phoneRaw = clerkUser.phoneNumbers[0]?.phoneNumber ?? null;
  const phone = phoneRaw ? formatPhoneForStorage(phoneRaw) : null;

  const [created] = await db
    .insert(users)
    .values({
      clerkId: clerkUser.id,
      email,
      name,
      role: roleFromMetadata,
      phone,
      ...phoneIdentity(phone),
    })
    .onConflictDoNothing({ target: users.clerkId })
    .returning();

  if (created) return created;

  // Row was created concurrently between the select and insert; fetch it.
  return getDbUserByClerkId(clerkUser.id);
}

/**
 * Requires an authenticated user, redirecting to sign-in otherwise. Returns
 * the Postgres user row.
 */
export async function requireUser(): Promise<User> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await getOrCreateCurrentUser();
  if (!dbUser) {
    redirect("/sign-in");
  }

  return dbUser;
}

/**
 * Requires an authenticated user with one of the given roles. Redirects
 * unauthenticated users to sign-in, and unauthorized users to their default
 * home route.
 */
export async function requireRole(allowedRoles: AppRole[]): Promise<User> {
  const dbUser = await requireUser();

  if (!allowedRoles.includes(dbUser.role)) {
    redirect(defaultRouteForRole(dbUser.role));
  }

  return dbUser;
}

/**
 * Finds or creates a patient row for WhatsApp / walk-in bookings that are
 * not tied to a Clerk session.
 *
 * Lookup order is deliberate: synthetic clerk id, then normalized phone, then
 * email. The phone step is what lets a patient an admin marked as VIP months
 * ago be recognized when they message from WhatsApp for the first time —
 * without it we'd silently create a second, standard-tier record.
 */
export async function getOrCreateWhatsAppPatient(input: {
  phone: string;
  name: string;
  email: string;
}): Promise<User> {
  const email = formatPatientEmail(input.email);
  const identity = phoneIdentity(input.phone);
  const name = formatPersonName(input.name);
  const phone = formatPhoneForStorage(input.phone);
  const digits = identity.phoneNormalized || input.phone.replace(/\D/g, "");
  const clerkId = `whatsapp_${digits || "unknown"}`;

  async function reuse(existing: User): Promise<User> {
    const patch = {
      name: name || existing.name,
      phone: phone || existing.phone,
      ...identity,
    };

    try {
      await db
        .update(users)
        .set({ ...patch, email: email || existing.email })
        .where(eq(users.id, existing.id));
      return { ...existing, ...patch, email: email || existing.email };
    } catch {
      // A different record already owns this email — keep the existing one.
      await db.update(users).set(patch).where(eq(users.id, existing.id));
      return { ...existing, ...patch };
    }
  }

  const [byClerk] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (byClerk?.role === "patient") return reuse(byClerk);

  const key = phoneMatchKey(input.phone);
  if (key) {
    const [byPhone] = await db.select().from(users).where(eq(users.phoneKey, key)).limit(1);
    if (byPhone && byPhone.role === "patient") return reuse(byPhone);
  }

  if (email) {
    const [byEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (byEmail?.role === "patient") return reuse(byEmail);
  }

  const emailToInsert = await uniquePatientEmail(email, digits);

  try {
    const [created] = await db
      .insert(users)
      .values({
        clerkId,
        email: emailToInsert,
        name,
        role: "patient",
        phone,
        ...identity,
      })
      .onConflictDoNothing({ target: users.clerkId })
      .returning();

    if (created) return created;
  } catch (error) {
    console.warn("[auth] WhatsApp patient insert conflict:", error);
  }

  const [again] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (again?.role === "patient") return again;

  if (email) {
    const [byEmailAgain] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (byEmailAgain?.role === "patient") return byEmailAgain;
  }

  const [byUniqueEmail] = await db.select().from(users).where(eq(users.email, emailToInsert)).limit(1);
  if (byUniqueEmail?.role === "patient") return reuse(byUniqueEmail);

  throw new Error("Could not create a WhatsApp patient record.");
}

/** Emails are unique. If a doctor/admin already owns the address, tag a patient copy. */
async function uniquePatientEmail(preferred: string, digits: string): Promise<string> {
  if (!preferred) {
    return digits ? `guest.${digits}@patients.dentalcare.local` : `guest.${Date.now()}@patients.dentalcare.local`;
  }

  const [owner] = await db.select({ role: users.role }).from(users).where(eq(users.email, preferred)).limit(1);
  if (!owner || owner.role === "patient") return preferred;

  const at = preferred.lastIndexOf("@");
  const local = at > 0 ? preferred.slice(0, at) : preferred;
  const domain = at > 0 ? preferred.slice(at + 1) : "patients.dentalcare.local";
  const tagged = `${local}+p${digits || "guest"}@${domain}`;

  const [taggedOwner] = await db.select({ id: users.id }).from(users).where(eq(users.email, tagged)).limit(1);
  if (!taggedOwner) return tagged;

  return `${local}+p${digits || "guest"}.${Date.now()}@${domain}`;
}

export function defaultRouteForRole(role: AppRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "doctor":
      return "/doctor-portal";
    default:
      return "/dashboard";
  }
}

/**
 * Promotes/demotes a user's role in both Postgres and Clerk's
 * `publicMetadata` (kept in sync so `proxy.ts` can gate `/admin` and
 * `/doctor-portal` without a database round-trip).
 */
export async function setUserRole(userId: string, role: AppRole): Promise<void> {
  const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
  if (!updated) return;

  const client = await clerkClient();
  await client.users.updateUserMetadata(updated.clerkId, {
    publicMetadata: { role },
  });
}
