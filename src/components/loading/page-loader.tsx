import { DentalLoader } from "@/components/loading/dental-loader";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
  label?: string;
  /** Compact height for nested route segments vs full-viewport splash. */
  fullScreen?: boolean;
}

/**
 * Shared page/route loading state with the branded dental animation.
 */
export function PageLoader({
  className,
  label = "Preparing your smile…",
  fullScreen = true,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center bg-background",
        fullScreen ? "min-h-[min(70vh,32rem)] py-16" : "py-20",
        className
      )}
    >
      <DentalLoader size="lg" label={label} />
    </div>
  );
}
