import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { getSiteUrl } from "@/config/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Travelora | Journeys beyond ordinary",
  description:
    "Curated journeys across South India, thoughtfully designed for travellers who seek more.",
  ...(siteUrl
    ? {
        metadataBase: siteUrl,
        alternates: { canonical: siteUrl.toString() },
      }
    : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ivory text-charcoal">{children}</body>
    </html>
  );
}
