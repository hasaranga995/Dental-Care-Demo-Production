import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { doctors, users, type Doctor, type User, type WorkingHours } from "@/db/schema";
import { getCached, setCached } from "@/lib/redis";

export interface DoctorWithUser extends Omit<Doctor, "workingHours"> {
  workingHours: WorkingHours;
  user: Pick<User, "id" | "name" | "email" | "phone">;
}

export async function getAvailableDoctors(): Promise<DoctorWithUser[]> {
  const cacheKey = "doctors:available";
  const cached = await getCached<DoctorWithUser[]>(cacheKey);
  if (cached) return cached;

  try {
    const rows = await db
      .select({
        id: doctors.id,
        userId: doctors.userId,
        specialty: doctors.specialty,
        bio: doctors.bio,
        image: doctors.image,
        workingHours: doctors.workingHours,
        isAvailable: doctors.isAvailable,
        createdAt: doctors.createdAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(eq(doctors.isAvailable, true));

    const parsed: DoctorWithUser[] = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      specialty: row.specialty,
      bio: row.bio,
      image: row.image,
      workingHours: (row.workingHours as WorkingHours) ?? {},
      isAvailable: row.isAvailable,
      createdAt: row.createdAt,
      user: { id: row.userId, name: row.userName, email: row.userEmail, phone: row.userPhone },
    }));

    await setCached(cacheKey, parsed, 300);
    return parsed;
  } catch (error) {
    console.warn("[data/doctors] getAvailableDoctors failed, returning empty list:", error);
    return [];
  }
}

export async function getDoctorById(id: string): Promise<DoctorWithUser | null> {
  const all = await getAvailableDoctors();
  return all.find((doctor) => doctor.id === id) ?? null;
}

export async function getDoctorByUserId(userId: string): Promise<Doctor | null> {
  try {
    const [row] = await db.select().from(doctors).where(eq(doctors.userId, userId)).limit(1);
    return row ?? null;
  } catch (error) {
    console.warn(`[data/doctors] getDoctorByUserId(${userId}) failed:`, error);
    return null;
  }
}
