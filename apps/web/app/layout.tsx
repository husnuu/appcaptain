import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import MobileNav from '@/components/MobileNav'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

/** Display: başlıklar için modern/minimal geometric — Manrope */
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
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
    <html lang="tr" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  )
}
