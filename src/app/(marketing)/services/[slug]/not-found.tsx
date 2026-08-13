import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ServiceNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <SearchX className="size-12 text-muted-foreground" />
      <h1 className="mt-6 font-heading text-2xl font-semibold text-foreground">
        We couldn&apos;t find that service
      </h1>
      <p className="mt-2 text-muted-foreground">
        It may have been renamed or is no longer offered. Browse our full list of services below.
      </p>
      <Button className="mt-6" render={<Link href="/services" />}>
        View All Services
      </Button>
    </div>
  );
}
