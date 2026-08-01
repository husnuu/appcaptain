import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'
import NavWrapper from '@/components/NavWrapper'
import Footer from '@/components/Footer'
import MobileNav from '@/components/MobileNav'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SeaHub — Tekneler, Yelkenliler ve Deniz Deneyimleri',
  description: 'Lüks yatlar, yelkenliler ve eşsiz deniz deneyimleri. Hayalinizdeki deniz tatilini rezerve edin.',
  keywords: 'tekne kiralama, yelkenli, yat kiralama, deniz deneyimi, bodrum, marmaris',
  openGraph: {
    title: 'SeaHub — Türkiye\'nin Deniz Platformu',
    description: 'Yelkenliden lüks yata, dalış turundan gün batımı deneyimine.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        <NavWrapper />
        <main>{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  )
}
