import type { Metadata } from "next";
import { PlansView } from "@/components/plans/plans-view";
import { CLINIC } from "@/lib/clinic-config";

export const metadata: Metadata = {
  title: `Choose a plan | ${CLINIC.name}`,
  description: "Select Starter or Premium to demo that version of the hospital website.",
};

export default function PlansPage() {
  return <PlansView />;
}
