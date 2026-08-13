"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProcedureImage } from "@/lib/data/procedure-images";
import { cn } from "@/lib/utils";

function SensitivePhoto({ image }: { image: ProcedureImage }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
        <Image
          src={image.src}
          alt={revealed ? image.alt : ""}
          fill
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
          className={cn(
            "object-cover transition-[filter,transform] duration-500",
            revealed ? "scale-100 blur-0" : "scale-105 blur-2xl brightness-90 saturate-50"
          )}
        />

        {!revealed && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0D4F5C]/45 px-4 text-center text-white backdrop-blur-[2px] transition hover:bg-[#0D4F5C]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            aria-label={`Sensitive clinical photo. ${image.caption}. Click to view.`}
          >
            <span className="grid size-14 place-items-center rounded-full bg-white/15 ring-1 ring-white/40">
              <ShieldAlert className="size-7 text-white" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-wide uppercase">Sensitive content</p>
              <p className="mt-1 max-w-[16rem] text-sm text-white/90">
                Real clinical / procedure photos. Tap to view if you are comfortable.
              </p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0D4F5C] shadow-sm">
              <Eye className="size-4" />
              Click to view
            </span>
          </button>
        )}

        {revealed && (
          <div className="absolute top-3 right-3 z-10">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1.5 bg-white/95 text-foreground shadow-sm hover:bg-white"
              onClick={() => setRevealed(false)}
            >
              <EyeOff className="size-3.5" />
              Hide
            </Button>
          </div>
        )}
      </div>
      <figcaption className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
        {image.caption}
      </figcaption>
    </figure>
  );
}

/**
 * Instagram-style sensitive gallery for live clinical / procedure photos.
 * Images stay blurred until the visitor explicitly chooses to view them.
 */
export function SensitiveProcedureGallery({ images }: { images: ProcedureImage[] }) {
  if (images.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
          <ShieldAlert className="size-5" />
        </span>
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Real procedure results
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These are authentic clinical photos from treatments. They may show teeth, gums, or
            chairside work — hidden by default so you can choose when to look.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {images.map((image) => (
          <SensitivePhoto key={image.src + image.caption} image={image} />
        ))}
      </div>
    </section>
  );
}
