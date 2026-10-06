import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteUrl, siteDescription, siteName, siteTagline } from "@/lib/site";
import "./globals.css";
import "./theme.css";
import { MotionRuntime } from "@/components/design/motion-runtime";

const sans = localFont({
  src: "./fonts/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-sans",
  display: "swap",
});

const mono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/ibm-plex-mono-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#080e20",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteName} · ${siteTagline}`,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    siteName,
    title: `${siteName} · ${siteTagline}`,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} · ${siteTagline}`,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}><MotionRuntime />{children}</body>
    </html>
  );
}
