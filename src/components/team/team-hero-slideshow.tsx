import type { ReactNode } from "react";
import Image from "next/image";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=2000&q=80";

export function TeamHeroSlideshow({ children }: { children: ReactNode }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden>
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#071820]/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#071820]/55 via-[#0D4F5C]/25 to-[#071820]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(7,24,32,0.55)_100%)]" />
      </div>
      <div className="page-container relative py-16 text-center sm:py-20 lg:py-24">
        {children}
      </div>
    </section>
  );
}
