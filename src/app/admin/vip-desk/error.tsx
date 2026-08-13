"use client";

import { PortalError } from "@/components/dashboard/portal-error";

export default function AdminVipDeskError({
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
      message="We couldn't load the VIP desk. Please try again."
    />
  );
}
