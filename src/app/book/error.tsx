"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Phone, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic-config";

export default function BookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[book error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F3FAF9] px-4 py-20">
      <div className="w-full max-w-lg rounded-[1.75rem] border border-white/80 bg-white p-8 text-center shadow-[0_22px_60px_-36px_rgba(13,79,92,0.4)] sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground">
          We couldn&apos;t open booking
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please try again, or call the front desk and we will reserve a chair for you.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={reset} className="gap-1.5">
            <RotateCw className="size-4" />
            Try again
          </Button>
          <Button variant="outline" className="gap-1.5" render={<a href={`tel:${CLINIC.phoneRaw}`} />}>
            <Phone className="size-4" />
            {CLINIC.phone}
          </Button>
          <Button variant="ghost" render={<Link href="/" />}>
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
