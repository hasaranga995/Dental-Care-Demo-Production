"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function SupportDeskError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/support]", error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <h2 className="font-heading text-lg font-semibold text-red-900">Support Desk unavailable</h2>
      <p className="mt-2 text-sm text-red-800">
        We couldn&apos;t load the support desk. Please try again.
      </p>
      <Button onClick={reset} className="mt-4" variant="outline">
        Retry
      </Button>
    </div>
  );
}
