"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export function signedOutSignInHref(destination = "/book") {
  return `/sign-in?redirect_url=${encodeURIComponent(destination)}`;
}

/** Sends signed-out visitors to sign-in first; signed-in users go straight to booking. */
export const BookAppointmentLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<typeof Link>
>(function BookAppointmentLink({ href = "/book", ...props }, ref) {
  const { isSignedIn } = useAuth();
  const dest = typeof href === "string" ? href : "/book";
  return <Link ref={ref} href={isSignedIn ? dest : signedOutSignInHref(dest)} {...props} />;
});
