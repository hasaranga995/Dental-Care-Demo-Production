import type { Metadata } from "next";
import { AboutView } from "@/components/about/about-view";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Discover Dental Care Private Hospital — hospital-grade CBCT imaging, digital scanning, laser dentistry, CAD/CAM milling, and boutique patient care.",
};

export default function AboutPage() {
  return <AboutView />;
}
