import type { Metadata } from "next";
import { getAllServices } from "@/lib/data/services";
import { getAvailableDoctors } from "@/lib/data/doctors";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { BookingView } from "@/components/booking/booking-view";

export const metadata: Metadata = {
  title: "Book an Appointment | Dental Care",
  description:
    "Reserve your visit at Dental Care in a few steps — choose a treatment, clinician, and time.",
};

interface BookPageProps {
  searchParams: Promise<{ service?: string; date?: string; doctor?: string }>;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const [services, doctors, currentUser] = await Promise.all([
    getAllServices(),
    getAvailableDoctors(),
    getOrCreateCurrentUser(),
  ]);

  return (
    <BookingView
      services={services}
      doctors={doctors}
      initialServiceSlug={params.service}
      initialDate={params.date}
      initialDoctorId={params.doctor}
      defaultName={currentUser?.name ?? ""}
      defaultEmail={currentUser?.email ?? ""}
      defaultPhone={currentUser?.phone ?? ""}
    />
  );
}
