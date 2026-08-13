"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PortalError({
  error,
  reset,
  message,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  message?: string;
}) {
  useEffect(() => {
    console.error("[portal error]", error);
  }, [error]);

  return (
    <Card className="flex flex-col items-center gap-4 p-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <div>
        <p className="font-heading text-lg font-semibold text-foreground">
          Something went wrong
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {message ?? "We couldn't load this page. Please try again."}
        </p>
      </div>
      <Button onClick={reset} className="gap-1.5">
        <RotateCw className="size-4" />
        Try Again
      </Button>
    </Card>
  );
}
