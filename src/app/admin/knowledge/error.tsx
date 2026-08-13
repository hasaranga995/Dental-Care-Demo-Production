"use client";

import { PortalError } from "@/components/dashboard/portal-error";

export default function AdminKnowledgeError({
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
      message="We couldn't load the AI knowledge base manager. Please try again."
    />
  );
}
