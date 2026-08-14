import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { DemoPlanProvider } from "@/components/demo/demo-plan-provider";
import { DemoPlanSwitcher } from "@/components/demo/demo-plan-switcher";
import { SiteChatWidget } from "@/components/demo/site-chat-widget";
import { SiteSplash } from "@/components/loading/site-splash";
import { CLINIC } from "@/lib/clinic-config";
import { getDemoPlan } from "@/lib/demo-plan-server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${CLINIC.name} | ${CLINIC.tagline}`,
    template: `%s | ${CLINIC.name}`,
  },
  description: CLINIC.description,
  keywords: [
    "dental clinic",
    "cosmetic dentistry",
    "dental implants",
    "orthodontics",
    "private dental hospital",
  ],
  openGraph: {
    title: `${CLINIC.name} | ${CLINIC.tagline}`,
    description: CLINIC.description,
    siteName: CLINIC.name,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D4F5C",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const plan = await getDemoPlan();

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0D4F5C",
          colorForeground: "#1A3D44",
          borderRadius: "0.5rem",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased [scrollbar-gutter:stable]`}
      >
        <body
          className="flex min-h-full flex-col overflow-x-clip bg-background text-foreground"
          suppressHydrationWarning
        >
          <DemoPlanProvider plan={plan}>
            <SiteSplash />
            {children}
            <SiteChatWidget />
            <DemoPlanSwitcher />
            <Toaster position="top-center" richColors />
          </DemoPlanProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
