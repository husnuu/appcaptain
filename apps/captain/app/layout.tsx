import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { AuthProvider } from "../components/auth-provider";
import { QueryProvider } from "../lib/providers/QueryProvider";
import "./globals.css";

const GTM_ID = "GTM-P8NPGM38";

// Ahoy Boats — web sitesiyle aynı yazı tipi (logo için 800 ağırlığı dahil).
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ahoy Kaptan Paneli",
  description: "Teknelerini, rezervasyonlarını ve kazançlarını yönet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={manrope.variable}>
      <head>
        {/* Google Tag Manager — head'de mümkün olan en üst konumda yüklenir */}
        <Script id="gtm-base" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body>
        {/* Google Tag Manager (noscript) — JS kapalıysa devreye girer */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="gtm"
          />
        </noscript>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
