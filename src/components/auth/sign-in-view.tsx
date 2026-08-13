"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth, useClerk, useSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { ToothLogo } from "@/components/tooth-logo";
import {
  AppleIcon,
  AUTH_FIELD_CLASS,
  AUTH_SOCIAL_BTN,
  AuthShell,
  FacebookIcon,
  getClerkErrorMessage,
  GoogleIcon,
  toAbsoluteUrl,
  type OAuthStrategy,
} from "@/components/auth/auth-shared";
import { CLINIC } from "@/lib/clinic-config";
import { cn } from "@/lib/utils";

const REMEMBER_KEY = "dental-care-remember-email";
const DEFAULT_REDIRECT = "/";

export function SignInView() {
  const router = useRouter();
  const clerk = useClerk();
  const { isLoaded: isAuthLoaded } = useAuth();
  const { signIn, errors } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<OAuthStrategy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(DEFAULT_REDIRECT);

  const clerkReady = isAuthLoaded && clerk.loaded && Boolean(signIn);
  const busy = isSubmitting || Boolean(oauthLoading);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setRedirectUrl(params.get("redirect_url") || DEFAULT_REDIRECT);

      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      // ignore
    }
  }, []);

  function persistRememberPreference() {
    try {
      if (rememberMe) {
        window.localStorage.setItem(REMEMBER_KEY, email.trim());
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      // ignore
    }
  }

  async function navigateAfterAuth(decorateUrl: (path: string) => string) {
    persistRememberPreference();
    const url = decorateUrl(redirectUrl);
    if (url.startsWith("http")) {
      window.location.href = url;
      return;
    }
    router.push(url);
    router.refresh();
  }

  async function handleEmailSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clerkReady) return;

    setLocalError(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        setLocalError(error.message || "Unable to sign in. Please check your email and password.");
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) return;
            await navigateAfterAuth(decorateUrl);
          },
        });
        return;
      }

      if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
        setLocalError("Additional verification is required for this account. Please try again shortly.");
        return;
      }

      setLocalError("Sign-in could not be completed. Please try again.");
    } catch (err) {
      setLocalError(getClerkErrorMessage(err, "Unable to sign in right now. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOAuth(strategy: OAuthStrategy) {
    if (!clerkReady || !clerk.client) return;

    setLocalError(null);
    setOauthLoading(strategy);

    try {
      await clerk.client.signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: toAbsoluteUrl("/sso-callback"),
        redirectUrlComplete: toAbsoluteUrl(redirectUrl),
      });
    } catch (err) {
      setLocalError(
        getClerkErrorMessage(
          err,
          "Social sign-in failed. Enable this provider in the Clerk dashboard, or try email."
        )
      );
      setOauthLoading(null);
    }
  }

  const fieldError =
    localError ||
    errors?.fields?.identifier?.message ||
    errors?.fields?.password?.message ||
    null;

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        <Link href="/" className="group relative mb-3.5 inline-flex">
          <motion.span
            aria-hidden
            className="absolute -inset-1.5 rounded-2xl bg-brand-teal/30 blur-md"
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.96, 1.05, 0.96] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative grid size-11 place-items-center rounded-xl bg-brand-navy text-brand-teal shadow-md shadow-brand-navy/25">
            <ToothLogo className="size-6" />
          </span>
        </Link>

        <h1 className="font-heading text-xl font-semibold tracking-tight text-brand-navy">Welcome Back</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Sign in to manage appointments &amp; records.
        </p>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void handleOAuth("oauth_google")}
          disabled={!clerkReady || busy}
          className={AUTH_SOCIAL_BTN}
          aria-label="Continue with Google"
          title="Continue with Google"
        >
          {oauthLoading === "oauth_google" ? (
            <Loader2 className="size-4 animate-spin text-brand-navy" />
          ) : (
            <GoogleIcon className="size-5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => void handleOAuth("oauth_apple")}
          disabled={!clerkReady || busy}
          className={AUTH_SOCIAL_BTN}
          aria-label="Continue with Apple"
          title="Continue with Apple"
        >
          {oauthLoading === "oauth_apple" ? (
            <Loader2 className="size-4 animate-spin text-brand-navy" />
          ) : (
            <AppleIcon className="size-5 text-brand-navy" />
          )}
        </button>

        <button
          type="button"
          onClick={() => void handleOAuth("oauth_facebook")}
          disabled={!clerkReady || busy}
          className={AUTH_SOCIAL_BTN}
          aria-label="Continue with Facebook"
          title="Continue with Facebook"
        >
          {oauthLoading === "oauth_facebook" ? (
            <Loader2 className="size-4 animate-spin text-brand-navy" />
          ) : (
            <FacebookIcon className="size-5" />
          )}
        </button>
      </div>

      <div className="my-4 flex items-center gap-2.5">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">or email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={(event) => void handleEmailSignIn(event)} className="space-y-3">
        <div>
          <label htmlFor="sign-in-email" className="mb-1 block text-[11px] font-medium text-foreground/80">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="sign-in-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={AUTH_FIELD_CLASS}
            />
          </div>
        </div>

        <div>
          <label htmlFor="sign-in-password" className="mb-1 block text-[11px] font-medium text-foreground/80">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="sign-in-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              className={cn(AUTH_FIELD_CLASS, "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-brand-navy"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-3.5 rounded border-border text-brand-teal focus:ring-brand-teal/30"
            />
            Remember me
          </label>
          <Link
            href="/sign-in#forgot"
            className="font-medium text-brand-teal transition-colors hover:text-brand-navy"
          >
            Forgot?
          </Link>
        </div>

        {fieldError ? (
          <p className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs text-red-600" role="alert">
            {fieldError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!clerkReady || busy}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-navy text-sm font-semibold text-white shadow-md shadow-brand-navy/20 transition-all hover:bg-brand-navy/90 active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Sign In
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        No account?{" "}
        <Link href="/book" className="font-semibold text-brand-navy hover:text-brand-teal">
          Book as Guest
        </Link>{" "}
        ·{" "}
        <Link href="/sign-up" className="font-semibold text-brand-teal hover:text-brand-navy">
          Register
        </Link>
      </p>

      <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <ShieldCheck className="size-3 text-brand-teal" />
        Secure · {CLINIC.name}
      </div>
    </AuthShell>
  );
}
