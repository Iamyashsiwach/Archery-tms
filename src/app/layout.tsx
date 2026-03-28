import type { Metadata } from "next";
import { Barlow_Condensed, DM_Mono } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import "./globals.css";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Archery Tournament Management",
  description: "Judge scoring, live leaderboard, elimination matches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background font-heading text-primary"
        suppressHydrationWarning
      >
        <SupabaseProvider>
          <SiteNav />
          <main className="flex-1">{children}</main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
