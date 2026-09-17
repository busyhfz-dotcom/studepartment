import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Studepartment — Research intelligence for medicine",
    template: "%s · Studepartment",
  },
  description: "Privacy-first scientific discovery, opportunity intelligence, and trusted research introductions.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
