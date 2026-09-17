import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Studepartment · Medical Research Intelligence",
    template: "%s · Studepartment",
  },
  description: "Privacy-first scientific intelligence for medical research discovery, opportunity analysis, and trusted collaboration.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
