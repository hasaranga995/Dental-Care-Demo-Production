"use client";

import { PortalError } from "@/components/dashboard/portal-error";

export default function AdminBannersError({
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
      message="We couldn't load the banners manager. Please try again."
    />
  );
}
