import type { Metadata } from "next";
import { SignUpView } from "@/components/auth/sign-up-view";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Dental Care patient account.",
};

export default function SignUpPage() {
  return <SignUpView />;
}
