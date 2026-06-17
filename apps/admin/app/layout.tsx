import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GetYourBoat — Admin",
  description: "Moderation and management console",
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
