import type { Metadata } from "next";
import { TeamView } from "@/components/team/team-view";
import { getAvailableDoctors } from "@/lib/data/doctors";
import { toTeamMembers } from "@/lib/data/team";
import { CLINIC } from "@/lib/clinic-config";

export const metadata: Metadata = {
  title: "Meet the Team",
  description: `Meet the board-certified specialists at ${CLINIC.name} — credentials, clinic hours, languages, and clinical focus for every doctor.`,
};

export default async function TeamPage() {
  const doctors = await getAvailableDoctors();
  const members = toTeamMembers(doctors);

  return <TeamView members={members} />;
}
