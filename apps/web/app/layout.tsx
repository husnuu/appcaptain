import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GetYourBoat — Rent boats & yachts",
  description: "Search, book and set sail.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
