import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { AdminAppLayout } from "../components/AdminAppLayout";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-serif",
  display: "swap",
});

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
    <html lang="tr" className={playfair.variable}>
      <body>
        <AdminAppLayout>{children}</AdminAppLayout>
      </body>
    </html>
  );
}
