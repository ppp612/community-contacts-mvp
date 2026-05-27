import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Community Contacts MVP",
  description: "Lightweight community contact collection and follow-up system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
