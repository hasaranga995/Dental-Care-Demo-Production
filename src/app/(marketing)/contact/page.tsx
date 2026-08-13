import type { Metadata } from "next";
import { ContactView } from "@/components/contact/contact-view";

export const metadata: Metadata = {
  title: "Contact & Emergency Care",
  description:
    "Reach Dental Care Private Hospital 24/7 — concierge desk, emergency hotline, WhatsApp, valet parking, and Colombo Medical District directions.",
};

export default function ContactPage() {
  return <ContactView />;
}
