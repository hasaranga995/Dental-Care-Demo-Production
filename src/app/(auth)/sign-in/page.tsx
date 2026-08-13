import type { Metadata } from "next";
import { SignInView } from "@/components/auth/sign-in-view";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Dental Care patient account.",
};

export default function SignInPage() {
  return <SignInView />;
}
