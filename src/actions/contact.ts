"use server";

import { headers } from "next/headers";
import { contactFormSchema } from "@/lib/validations";
import { sendContactFormNotification } from "@/lib/resend";
import { rateLimit } from "@/lib/redis";

export type ContactFieldErrors = Partial<
  Record<"name" | "email" | "phone" | "subject" | "message", string>
>;

export interface ContactActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: ContactFieldErrors;
}

export const initialContactActionState: ContactActionState = {
  status: "idle",
  message: "",
};

export async function submitContactForm(
  _prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const headerList = await headers();
  const identifier = headerList.get("x-forwarded-for") ?? "anonymous";

  const { success: withinLimit } = await rateLimit(`contact:${identifier}`, 5, 300);
  if (!withinLimit) {
    return {
      status: "error",
      message: "You're submitting too many messages. Please try again in a few minutes.",
    };
  }

  const raw = {
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    phone: normalizeContactPhone(formData.get("phone")?.toString() ?? ""),
    subject: formData.get("subject")?.toString() ?? "",
    message: formData.get("message")?.toString() ?? "",
    preferredChannel: formData.get("preferredChannel")?.toString() ?? "email",
  };

  const parsed = contactFormSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: ContactFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactFieldErrors;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please fix the errors below and try again.",
      fieldErrors,
    };
  }

  try {
    await sendContactFormNotification(parsed.data);
  } catch (error) {
    console.error("[contact action] Failed to send notification email:", error);
    return {
      status: "error",
      message: "Something went wrong sending your message. Please call us directly instead.",
    };
  }

  return {
    status: "success",
    message:
      "Message received! Our receptionist Sanduni will respond within 15 minutes.",
  };
}

function normalizeContactPhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("94")) return `+${digits}`;
  if (digits.startsWith("0")) return `+94${digits.slice(1)}`;
  return `+94${digits}`;
}
