import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { AuthProvider } from "../components/auth-provider";
import { QueryProvider } from "../lib/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SEAHUB Captain",
  description: "Manage your boats, reservations and earnings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
