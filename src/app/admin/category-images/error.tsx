"use client";

import { PortalError } from "@/components/dashboard/portal-error";

export default function AdminCategoryImagesError({
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
      message="We couldn't load the service tile images manager. Please try again."
    />
  );
}
