import Link from "next/link";
import { Compass, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToothLogo } from "@/components/tooth-logo";
import { CLINIC } from "@/lib/clinic-config";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-6 text-center">
      <ToothLogo className="size-14 text-primary/40" />
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          404 · Page Not Found
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          The page you&apos;re looking for may have moved or no longer exists. Let&apos;s get you
          back on track.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="gap-1.5" render={<Link href="/" />}>
          <Compass className="size-4" />
          Back to Home
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="gap-1.5"
          render={<a href={`tel:${CLINIC.phoneRaw}`} />}
        >
          <Phone className="size-4" />
          Call {CLINIC.name}
        </Button>
      </div>
    </div>
  );
}
