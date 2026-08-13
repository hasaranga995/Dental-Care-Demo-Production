import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { services, type Service, type ServiceFaq, type TreatmentStep } from "@/db/schema";
import { getCached, setCached } from "@/lib/redis";

export { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/data/service-categories";

export interface ServiceWithParsed extends Omit<Service, "treatmentSteps" | "faqs"> {
  treatmentSteps: TreatmentStep[];
  faqs: ServiceFaq[];
}

function parseService(service: Service): ServiceWithParsed {
  return {
    ...service,
    treatmentSteps: (service.treatmentSteps as TreatmentStep[]) ?? [],
    faqs: (service.faqs as ServiceFaq[]) ?? [],
  };
}

/**
 * Every DB-backed public data helper degrades gracefully (returns an empty
 * list) if the database isn't reachable yet — e.g. before `.env.local` has
 * real Neon credentials, or during a `next build` run in a sandboxed CI
 * environment without network access.
 */
export async function getAllServices(): Promise<ServiceWithParsed[]> {
  const cacheKey = "services:all";
  const cached = await getCached<ServiceWithParsed[]>(cacheKey);
  if (cached) return cached;

  try {
    const rows = await db.select().from(services).orderBy(asc(services.name));
    const parsed = rows.map(parseService);
    await setCached(cacheKey, parsed, 600);
    return parsed;
  } catch (error) {
    console.warn("[data/services] getAllServices failed, returning empty list:", error);
    return [];
  }
}

export async function getFeaturedServices(): Promise<ServiceWithParsed[]> {
  const all = await getAllServices();
  const featured = all.filter((service) => service.featured);
  return featured.length > 0 ? featured : all.slice(0, 6);
}

export async function getServiceBySlug(slug: string): Promise<ServiceWithParsed | null> {
  const cacheKey = `services:slug:${slug}`;
  const cached = await getCached<ServiceWithParsed>(cacheKey);
  if (cached) return cached;

  try {
    const [row] = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
    if (!row) return null;
    const parsed = parseService(row);
    await setCached(cacheKey, parsed, 600);
    return parsed;
  } catch (error) {
    console.warn(`[data/services] getServiceBySlug(${slug}) failed:`, error);
    return null;
  }
}

export async function getServicesByCategory(
  category: string
): Promise<ServiceWithParsed[]> {
  const all = await getAllServices();
  if (category === "All") return all;
  return all.filter((service) => service.category === category);
}
