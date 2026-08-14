import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getAppointmentsForPatient } from "@/lib/data/appointments";
import {
  PatientDashboardView,
  type DashboardAppointmentCard,
} from "@/components/dashboard/patient-dashboard-view";

export const metadata: Metadata = {
  title: "My Appointments | Dental Care",
};

function toCard(
  appointment: Awaited<ReturnType<typeof getAppointmentsForPatient>>[number]
): DashboardAppointmentCard {
  const status = appointment.status;
  return {
    id: appointment.id,
    serviceName: appointment.serviceName,
    doctorName: appointment.doctorName,
    doctorSpecialty: appointment.doctorSpecialty,
    doctorImage: appointment.doctorImage,
    isoDate: appointment.appointmentDate.toISOString(),
    status:
      status === "confirmed" || status === "pending" || status === "completed" || status === "cancelled"
        ? status
        : "pending",
    notes: appointment.notes,
    bookingChannel: appointment.bookingChannel,
    doctorId: appointment.doctorId,
    priceRange: appointment.servicePriceRange,
    durationMinutes: appointment.durationMinutes,
  };
}

export default async function DashboardPage() {
  const currentUser = await requireUser();
  const appointments = await getAppointmentsForPatient(currentUser);
  const now = new Date();

  const upcoming = appointments
    .filter(
      (appointment) =>
        appointment.appointmentDate >= now &&
        appointment.status !== "cancelled" &&
        appointment.status !== "completed"
    )
    .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
    .map(toCard);

  const history = appointments
    .filter(
      (appointment) =>
        appointment.appointmentDate < now ||
        appointment.status === "cancelled" ||
        appointment.status === "completed"
    )
    .map(toCard);

  return (
    <PatientDashboardView
      firstName={currentUser.name.split(" ")[0] || "there"}
      upcoming={upcoming}
      history={history}
    />
  );
}
