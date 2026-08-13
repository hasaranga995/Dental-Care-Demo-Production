import type { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div
        data-page-reveal
        className="flex min-h-screen flex-col pt-16 sm:pt-[4.25rem]"
      >
        <main className="w-full min-w-0 flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
