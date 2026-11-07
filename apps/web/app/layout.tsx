import type { Metadata } from 'next'
import { Inter, Manrope, Source_Serif_4 } from 'next/font/google'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'
import './seahub.css'
import './seahub-pages.css'
import NavWrapper from '@/components/NavWrapper'
import Footer from '@/components/Footer'
import MobileNav from '@/components/MobileNav'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

// Figma tasarımı: gövde/başlık Manrope, vurgu başlıkları ve logo serif.
const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ahoy Boats — Tekne Kiralama ve Deniz Deneyimleri',
  description: 'Lüks yatlar, yelkenliler ve eşsiz deniz deneyimleri. Hayalinizdeki deniz tatilini rezerve edin.',
  keywords: 'tekne kiralama, yelkenli, yat kiralama, deniz deneyimi, bodrum, marmaris',
  openGraph: {
    title: 'Ahoy — Türkiye\'nin Deniz Platformu',
    description: 'Yelkenliden lüks yata, dalış turundan gün batımı deneyimine.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${manrope.variable} ${sourceSerif.variable}`}>
      <body>
        <NavWrapper />
        <main>{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  )
}
