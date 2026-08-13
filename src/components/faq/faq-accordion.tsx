"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export interface FaqEntry {
  category: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  faqs: FaqEntry[];
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return faqs;
    const lower = query.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(lower) ||
        faq.answer.toLowerCase().includes(lower) ||
        faq.category.toLowerCase().includes(lower)
    );
  }, [faqs, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, FaqEntry[]>();
    for (const faq of filtered) {
      const list = map.get(faq.category) ?? [];
      list.push(faq);
      map.set(faq.category, list);
    }
    return map;
  }, [filtered]);

  return (
    <div>
      <div className="relative mx-auto max-w-lg">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search FAQs, insurance, financing..."
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          No results for &ldquo;{query}&rdquo;. Try a different search or{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact us
          </a>
          .
        </p>
      ) : (
        <div className="mx-auto mt-10 max-w-3xl space-y-10">
          {Array.from(grouped.entries()).map(([category, entries]) => (
            <div key={category}>
              <Badge variant="secondary" className="mb-3">
                {category}
              </Badge>
              <Accordion>
                {entries.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`${category}-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
