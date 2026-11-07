import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { AdminAppLayout } from "../components/AdminAppLayout";
import "./globals.css";

// Ahoy Boats — web sitesiyle aynı yazı tipi (logo için 800 ağırlığı dahil).
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ahoy Admin",
  description: "Ahoy Boats moderasyon ve yönetim paneli",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={manrope.variable}>
      <body>
        <AdminAppLayout>{children}</AdminAppLayout>
      </body>
    </html>
  );
}
