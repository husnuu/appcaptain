import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "../components/auth-provider";
import { QueryProvider } from "../lib/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GetYourBoat — Captain",
  description: "Manage your boats, reservations and earnings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
