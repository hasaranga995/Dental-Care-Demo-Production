import { normalizePhone } from "@/lib/vip/phone";

/**
 * Title-cases a personal name: `anne perera` → `Anne Perera`.
 * Handles hyphenated parts (`anne-marie` → `Anne-Marie`) and
 * apostrophes (`o'brien` → `O'Brien`).
 */
export function formatPersonName(raw: string | null | undefined): string {
  const trimmed = raw?.trim().replace(/\s+/g, " ") ?? "";
  if (!trimmed) return "";

  return trimmed
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part
            .split("'")
            .map((token) =>
              token ? token.charAt(0).toUpperCase() + token.slice(1).toLowerCase() : token
            )
            .join("'")
        )
        .join("-")
    )
    .join(" ");
}

export function formatPatientEmail(raw: string | null | undefined): string {
  return raw?.trim().toLowerCase() ?? "";
}

/** Real inbox we can email — not placeholders or internal +p tags. */
export function isPublicPatientEmail(value: string | null | undefined): value is string {
  const email = formatPatientEmail(value);
  if (!email || !email.includes("@")) return false;
  if (email.endsWith("@no-email.local")) return false;
  if (email.endsWith("@patients.dentalcare.local")) return false;
  if (/\+p\d+/.test(email.split("@")[0] ?? "")) return false;
  return true;
}

/**
 * Canonical stored mobile: E.164 with a leading plus.
 * `0712345678`, `94712345678`, and `+94 71 234 5678` all become `+94712345678`.
 * Returns a trimmed original if the number cannot be parsed.
 */
export function formatPhoneForStorage(raw: string | null | undefined): string {
  const normalized = normalizePhone(raw);
  if (normalized) return `+${normalized}`;
  return raw?.trim() ?? "";
}
