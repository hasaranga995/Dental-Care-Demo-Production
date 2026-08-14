"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth, useClerk, useSignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { ToothLogo } from "@/components/tooth-logo";
import {
  AppleIcon,
  AUTH_FIELD_CLASS,
  AUTH_SOCIAL_BTN,
  AuthShell,
  FacebookIcon,
  getClerkErrorMessage,
  GoogleIcon,
  splitFullName,
  toAbsoluteUrl,
  usernameFromEmail,
  type OAuthStrategy,
} from "@/components/auth/auth-shared";
import { CLINIC } from "@/lib/clinic-config";
import { cn } from "@/lib/utils";

const DEFAULT_REDIRECT = "/";

export function SignUpView() {
  const router = useRouter();
  const clerk = useClerk();
  const { isLoaded: isAuthLoaded } = useAuth();
  const { signUp, errors } = useSignUp();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(true);
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<OAuthStrategy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(DEFAULT_REDIRECT);

  const clerkReady = isAuthLoaded && clerk.loaded && Boolean(signUp);
  const busy = isSubmitting || Boolean(oauthLoading);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setRedirectUrl(params.get("redirect_url") || DEFAULT_REDIRECT);
    } catch {
      // ignore
    }
  }, []);

  async function navigateAfterAuth(decorateUrl: (path: string) => string) {
    const url = decorateUrl(redirectUrl);
    if (url.startsWith("http")) {
      window.location.href = url;
      return;
    }
    router.push(url);
    router.refresh();
  }

  function buildUsername(suffix = "") {
    const base = usernameFromEmail(email || signUp.emailAddress || "", fullName);
    return `${base}${suffix}`.slice(0, 30);
  }

  /** Fill Clerk-required profile fields before email verification (username/legal/name). */
  async function fillMissingProfileFields() {
    if (signUp.status !== "missing_requirements") return null;

    const missing = signUp.missingFields.filter(
      (field) =>
        field === "legal_accepted" ||
        field === "first_name" ||
        field === "last_name" ||
        field === "username"
    );
    if (missing.length === 0) return null;

    const patch: {
      legalAccepted?: boolean;
      firstName?: string;
      lastName?: string;
      username?: string;
    } = {};

    if (missing.includes("legal_accepted")) patch.legalAccepted = true;

    if (missing.includes("first_name") || missing.includes("last_name")) {
      const names = splitFullName(fullName);
      if (missing.includes("first_name")) patch.firstName = names.firstName;
      if (missing.includes("last_name")) patch.lastName = names.lastName || names.firstName;
    }

    if (missing.includes("username")) {
      patch.username = buildUsername();
    }

    let { error } = await signUp.update(patch);

    if (error && patch.username) {
      const retry = await signUp.update({
        ...patch,
        username: buildUsername(`_${Date.now().toString(36).slice(-4)}`),
      });
      error = retry.error;
    }

    if (error) {
      return error.message || "Could not finish the required sign-up fields.";
    }

    return null;
  }

  async function finalizeSignUp() {
    const { error } = await signUp.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) return;
        await navigateAfterAuth(decorateUrl);
      },
    });
    if (error) {
      setLocalError(error.message || "Account verified, but the session could not be started.");
      return false;
    }
    return true;
  }

  async function completeIfReady() {
    if (signUp.status === "complete") {
      return finalizeSignUp();
    }

    const fillError = await fillMissingProfileFields();
    if (fillError) {
      setLocalError(fillError);
      return false;
    }

    if (signUp.status === "complete") {
      return finalizeSignUp();
    }

    // Email still needs a code — not an error during the create step
    if (signUp.unverifiedFields.includes("email_address")) {
      return false;
    }

    if (signUp.missingFields.length > 0) {
      setLocalError(`Sign-up still needs: ${signUp.missingFields.join(", ")}.`);
    } else {
      setLocalError("Sign-up could not be finished. Please try again.");
    }
    return false;
  }

  async function startEmailVerification() {
    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) {
      setLocalError(sent.error.message || "Could not send the verification code.");
      return false;
    }
    setPendingVerification(true);
    setCode("");
    return true;
  }

  async function handleEmailSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clerkReady) return;

    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (!legalAccepted) {
      setLocalError("Please accept the terms to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { firstName, lastName } = splitFullName(fullName);
      let username = usernameFromEmail(email, fullName);
      let { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
        username,
        firstName,
        lastName: lastName || firstName,
        legalAccepted: true,
      });

      // Username collision — retry once with a unique suffix
      if (error && /username|identifier|taken|exists/i.test(error.message || "")) {
        username = buildUsername(`_${Date.now().toString(36).slice(-4)}`);
        ({ error } = await signUp.password({
          emailAddress: email.trim(),
          password,
          username,
          firstName,
          lastName: lastName || firstName,
          legalAccepted: true,
        }));
      }

      if (error) {
        setLocalError(error.message || "Unable to create your account. Please try again.");
        return;
      }

      // Username/legal must be set before verifying email, or Clerk can keep email unverified
      const fillError = await fillMissingProfileFields();
      if (fillError) {
        setLocalError(fillError);
        return;
      }

      if (await completeIfReady()) return;

      if (signUp.unverifiedFields.includes("email_address")) {
        await startEmailVerification();
        return;
      }

      setLocalError("Sign-up needs another step. Please try again, or use a social account.");
    } catch (err) {
      setLocalError(getClerkErrorMessage(err, "Unable to create your account right now. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clerkReady) return;

    setLocalError(null);
    setIsSubmitting(true);

    try {
      const hadMissingProfile = signUp.missingFields.some((field) =>
        ["legal_accepted", "first_name", "last_name", "username"].includes(field)
      );

      // Username/legal must exist before email verify, or Clerk keeps email unverified
      const fillError = await fillMissingProfileFields();
      if (fillError) {
        setLocalError(fillError);
        return;
      }

      // Updating profile fields can reset email verification — send a fresh code
      if (hadMissingProfile && signUp.unverifiedFields.includes("email_address")) {
        await startEmailVerification();
        setLocalError("Account details were saved. Enter the new verification code we just emailed you.");
        return;
      }

      const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (error) {
        setLocalError(error.message || "That code is not valid. Please try again.");
        return;
      }

      if (signUp.status === "complete") {
        await finalizeSignUp();
        return;
      }

      const afterVerifyFill = await fillMissingProfileFields();
      if (afterVerifyFill) {
        setLocalError(afterVerifyFill);
        return;
      }

      if (signUp.status === "complete") {
        await finalizeSignUp();
        return;
      }

      if (signUp.unverifiedFields.includes("email_address")) {
        await startEmailVerification();
        setLocalError("Please enter the new verification code we just emailed you.");
        return;
      }

      if (signUp.missingFields.length > 0) {
        setLocalError(`Sign-up still needs: ${signUp.missingFields.join(", ")}.`);
        return;
      }

      setLocalError("Verification succeeded, but the account could not be finished. Please try again.");
    } catch (err) {
      setLocalError(getClerkErrorMessage(err, "Could not verify that code. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!clerkReady) return;
    setLocalError(null);
    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) {
      setLocalError(sent.error.message || "Could not resend the code.");
    }
  }

  async function handleOAuth(strategy: OAuthStrategy) {
    if (!clerkReady || !clerk.client) return;

    setLocalError(null);
    setOauthLoading(strategy);

    try {
      await clerk.client.signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: toAbsoluteUrl("/sso-callback"),
        redirectUrlComplete: toAbsoluteUrl(redirectUrl),
      });
    } catch (err) {
      setLocalError(
        getClerkErrorMessage(
          err,
          "Social sign-up failed. Enable this provider in the Clerk dashboard, or try email."
        )
      );
      setOauthLoading(null);
    }
  }

  const fieldError =
    localError ||
    errors?.fields?.emailAddress?.message ||
    errors?.fields?.password?.message ||
    errors?.fields?.firstName?.message ||
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

        <h1 className="font-heading text-xl font-semibold tracking-tight text-brand-navy">
          {pendingVerification ? "Check your email" : "Create your account"}
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {pendingVerification
            ? `We sent a 6-digit code to ${email}.`
            : "Register to book visits and view your records."}
        </p>
      </div>

      {!pendingVerification ? (
        <>
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

          <form onSubmit={(event) => void handleEmailSignUp(event)} className="space-y-3">
            <div>
              <label htmlFor="sign-up-name" className="mb-1 block text-[11px] font-medium text-foreground/80">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="sign-up-name"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Amaya Perera"
                  className={AUTH_FIELD_CLASS}
                />
              </div>
            </div>

            <div>
              <label htmlFor="sign-up-email" className="mb-1 block text-[11px] font-medium text-foreground/80">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="sign-up-email"
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
              <label htmlFor="sign-up-password" className="mb-1 block text-[11px] font-medium text-foreground/80">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="sign-up-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
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

            <div>
              <label htmlFor="sign-up-confirm" className="mb-1 block text-[11px] font-medium text-foreground/80">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="sign-up-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat password"
                  className={AUTH_FIELD_CLASS}
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-left text-[11px] leading-snug text-muted-foreground">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(event) => setLegalAccepted(event.target.checked)}
                className="mt-0.5 size-3.5 shrink-0 rounded border-border text-brand-teal focus:ring-brand-teal/30"
              />
              <span>
                I agree to the Terms of Service and Privacy Policy for {CLINIC.name}.
              </span>
            </label>

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
              Create account
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={(event) => void handleVerify(event)} className="mt-5 space-y-3">
          <div>
            <label htmlFor="sign-up-code" className="mb-1 block text-[11px] font-medium text-foreground/80">
              Verification code
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="sign-up-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6-digit code"
                className={AUTH_FIELD_CLASS}
              />
            </div>
          </div>

          {fieldError ? (
            <p className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs text-red-600" role="alert">
              {fieldError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!clerkReady || busy || code.trim().length < 4}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-navy text-sm font-semibold text-white shadow-md shadow-brand-navy/20 transition-all hover:bg-brand-navy/90 active:scale-[0.99] disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Verify email
          </button>

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={busy}
            className="w-full text-center text-xs font-medium text-brand-teal hover:text-brand-navy"
          >
            Resend code
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link href="/sign-in" className="font-semibold text-brand-teal hover:text-brand-navy">
          Sign in
        </Link>
      </p>

      <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <ShieldCheck className="size-3 text-brand-teal" />
        Secure · {CLINIC.name}
      </div>

      <div id="clerk-captcha" />
    </AuthShell>
  );
}
