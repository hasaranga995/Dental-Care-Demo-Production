"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#F1F5F9",
          color: "#1E293B",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600 }}>
            Dental Care is temporarily unavailable
          </h1>
          <p style={{ marginTop: "0.75rem", color: "#64748B", maxWidth: 420 }}>
            A critical error occurred. Please refresh the page, or call us directly for
            assistance.
          </p>
        </div>
        <button
          onClick={reset}
          style={{
            padding: "0.65rem 1.5rem",
            borderRadius: "0.5rem",
            backgroundColor: "#0D4F5C",
            color: "#ffffff",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
