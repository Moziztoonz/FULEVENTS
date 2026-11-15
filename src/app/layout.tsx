import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import { MobileNav } from "@/components/MobileNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Campus Events · FULAFIA",
    template: "%s · Campus Events FULAFIA",
  },
  description:
    "Find events happening at Federal University of Lafia, register in a few taps and keep your ticket on your phone.",
  openGraph: {
    title: "Campus Events · FULAFIA",
    description: "Discover events at Federal University of Lafia and get your tickets.",
    type: "website",
  },
};

// Every page reads live database rows and the session cookie, so nothing is
// pre-rendered at build time.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#0e6b45",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${jakarta.variable} ${instrument.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="with-mobile-nav flex-1">
          {children}
        </main>
        <SiteFooter />
        <MobileNav user={user ? { role: user.role } : null} />
      </body>
    </html>
  );
}
