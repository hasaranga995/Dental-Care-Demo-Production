import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

/**
 * Completes Google / Apple / Facebook OAuth redirects from the custom Sign-In card.
 */
export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-brand-teal" />
      <p className="text-sm">Completing sign-in…</p>
      <AuthenticateWithRedirectCallback />
      {/* Required when OAuth transfers into a sign-up with bot protection */}
      <div id="clerk-captcha" />
    </div>
  );
}
