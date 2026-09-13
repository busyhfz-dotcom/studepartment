import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studepartment",
  description: "Scientific intelligence for medical research discovery and collaboration.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
