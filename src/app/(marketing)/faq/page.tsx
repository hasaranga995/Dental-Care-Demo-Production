import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { FaqAccordion } from "@/components/faq/faq-accordion";
import { CLINIC_FAQS } from "@/lib/data/faqs";
import { CLINIC } from "@/lib/clinic-config";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers to common questions about appointments, insurance, financing, and what to expect at Dental Care.",
};

export default function FaqPage() {
  return (
    <div className="page-container py-12 sm:py-16">
      <div className="text-center">
        <Badge variant="secondary" className="mb-3">
          Help Center
        </Badge>
        <h1 className="text-balance font-heading text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Search or browse answers about insurance, financing, appointments, and what to expect
          at {CLINIC.name}.
        </p>
      </div>

      <div className="mt-10">
        <FaqAccordion faqs={CLINIC_FAQS} />
      </div>
    </div>
  );
}
