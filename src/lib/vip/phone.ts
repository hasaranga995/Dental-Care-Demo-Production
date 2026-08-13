/**
 * Phone normalization used as the cross-channel patient identity key.
 *
 * A patient may reach us as `077 123 4567` on a web form, `+94771234567`
 * from WhatsApp, or `+44 7700 900123` as an expat VIP. All formats must
 * resolve to a stable E.164 key — and that key must preserve the country
 * code, otherwise a UK `+44 771…` collides with a Sri Lankan `+94 771…`.
 */
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/** Default when a number has no country prefix (local Sri Lankan forms). */
export const DEFAULT_COUNTRY = "LK" as const satisfies CountryCode;
export const DEFAULT_COUNTRY_CODE = "94";

/**
 * Converts any input into bare E.164 digits (no `+`).
 * Returns an empty string when the number cannot be parsed as a valid phone.
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";

  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Prefer an explicit international form when a `+` or `00` is present.
  const internationalCandidate = trimmed.startsWith("00")
    ? `+${trimmed.slice(2)}`
    : trimmed;

  const parsed =
    parsePhoneNumberFromString(internationalCandidate) ||
    parsePhoneNumberFromString(trimmed, DEFAULT_COUNTRY);

  if (!parsed || !parsed.isValid()) {
    // Last-resort digit cleanup for already-digit WhatsApp sender ids that
    // libphonenumber occasionally rejects (e.g. short Meta test numbers).
    const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
    return digits.length >= 10 && digits.length <= 15 ? digits : "";
  }

  return parsed.number.replace(/^\+/, "");
}

/**
 * Indexed lookup key: the full E.164 digit string (country code included).
 * This is what stops Sri Lankan, Maldivian, UK, and Gulf numbers from
 * colliding on a shared national subscriber portion.
 */
export function phoneMatchKey(raw: string | null | undefined): string {
  return normalizePhone(raw);
}

/** Both identity columns for a `users` / subscriber write. */
export function phoneIdentity(raw: string | null | undefined): {
  phoneNormalized: string | null;
  phoneKey: string | null;
} {
  const phoneNormalized = normalizePhone(raw);
  if (!phoneNormalized) return { phoneNormalized: null, phoneKey: null };
  return { phoneNormalized, phoneKey: phoneNormalized };
}

/** `94771234567` → `+94 77 123 4567` for display in admin and alerts. */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  const normalized = normalizePhone(raw);
  if (!normalized) return raw?.trim() || "";

  const parsed = parsePhoneNumberFromString(`+${normalized}`);
  if (parsed) {
    return parsed.formatInternational();
  }

  return `+${normalized}`;
}

export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const keyA = phoneMatchKey(a);
  const keyB = phoneMatchKey(b);
  return Boolean(keyA && keyB && keyA === keyB);
}
