import type { SVGProps } from "react";

/**
 * lucide-react no longer ships brand/logo icons, so these lightweight
 * outline marks are used for social links instead.
 */

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M15 4h-2.5A4.5 4.5 0 0 0 8 8.5V11H6v3h2v6h3v-6h2.5l.5-3H11V8.5c0-.55.45-1 1-1H15V4Z" />
    </svg>
  );
}

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 12h-8" />
    </svg>
  );
}
