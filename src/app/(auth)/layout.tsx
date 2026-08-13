import type { ReactNode } from "react";

/**
 * Auth pages own their full-viewport layout (single centered card).
 * No split-panel chrome here.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
