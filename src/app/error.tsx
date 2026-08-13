"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Phone, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic-config";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </div>
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          We hit an unexpected error loading this page. Please try again, or call us directly if
          the problem continues.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset} className="gap-1.5">
          <RotateCw className="size-4" />
          Try Again
        </Button>
        <Button size="lg" variant="outline" className="gap-1.5" render={<Link href="/" />}>
          Back to Home
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="gap-1.5"
          render={<a href={`tel:${CLINIC.phoneRaw}`} />}
        >
          <Phone className="size-4" />
          {CLINIC.phone}
        </Button>
      </div>
    </div>
  );
}
