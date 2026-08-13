import { cn } from "@/lib/utils";

export function ToothLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <path
        d="M24 6c-4.2 0-6.6 2.4-9 2.4-3.6 0-6.8 3-6.8 8.4 0 5.2 1.6 9.6 2.8 14.4.9 3.6 1.6 8.4 4.4 8.4 3 0 3-6.8 4.6-11.6.6-1.8 1.6-2.8 3-2.8s2.4 1 3 2.8C27.6 33.2 27.6 40 30.6 40c2.8 0 3.5-4.8 4.4-8.4 1.2-4.8 2.8-9.2 2.8-14.4 0-5.4-3.2-8.4-6.8-8.4-2.4 0-4.8-2.4-9-2.4Z"
        fill="currentColor"
      />
    </svg>
  );
}
