"use client";

import { PortalError } from "@/components/dashboard/portal-error";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PortalError
      error={error}
      reset={reset}
      message="We couldn't load the admin dashboard. Please try again."
    />
  );
}
