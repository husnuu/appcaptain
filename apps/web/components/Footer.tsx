import Image from 'next/image'
import Link from 'next/link'
import { Globe, Headset } from 'lucide-react'
import { Logo } from '@/components/home/Logo'

const CAPTAIN_APP_URL = process.env.NEXT_PUBLIC_CAPTAIN_URL ?? 'https://appcaptain-captain.vercel.app'

const TOP_LINKS = [
  { label: 'Keşfet', href: '/#lokasyonlar' },
  { label: 'Tekne Kirala', href: '/tekne-kiralama' },
  { label: 'Deneyimler', href: '/deneyimler' },
  { label: 'Neden Ahoy', href: '/neden-ahoy' },
  { label: 'Kaptan Paneli', href: CAPTAIN_APP_URL },
]

const COLUMNS = [
  {
    title: 'Ahoy',
    links: [
      { label: 'Neden Ahoy?', href: '/neden-ahoy' },
      { label: 'Basında Biz', href: '#' },
      { label: 'Kariyer', href: '#' },
      { label: 'Tekne Sahipleri', href: '/charter-firmalari' },
    ],
  },
  {
    title: 'Keşfet',
    links: [
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'Arkadaşını Davet Et', href: '#' },
      { label: 'Müşteri Yorumları', href: '#' },
      { label: 'Blog', href: '/blog' },
      { label: 'İletişim', href: '/hakkimizda#iletisim' },
    ],
  },
  {
    title: 'Topluluk',
    links: [
      { label: 'Denizci Forumu', href: '/forum' },
      { label: 'Deniz Rehberi', href: '/blog' },
      { label: 'Rota Haritası', href: '/#map-section' },
      { label: 'Kaptanlık Eğitimi', href: '/kaptanlar' },
    ],
  },
  {
    title: 'Destek',
    links: [
      { label: 'Yardım Merkezi', href: '#' },
      { label: 'Güvenlik', href: '#' },
      { label: 'Ahoy Cashback', href: '/cashback' },
      { label: 'İptal Politikası', href: '#' },
      { label: 'KVKK Aydınlatma', href: '#' },
    ],
  },
]

const SOCIAL = [
  { label: 'Facebook', icon: 'fb' },
  { label: 'Instagram', icon: 'ig' },
  { label: 'X', icon: 'x' },
  { label: 'LinkedIn', icon: 'in' },
  { label: 'YouTube', icon: 'yt' },
]

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.03c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.1-1.47-1.1-2.8 0-1.33.7-1.99.95-2.26.25-.27.54-.34.72-.34h.52c.17 0 .39-.06.61.47.24.56.79 1.92.86 2.06.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.89 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.58.75 1.85.88.27.14.45.2.52.32.07.11.07.66-.17 1.33Z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="sh-footer" role="contentinfo">
      <div className="sh-container">
        <div className="sh-ft-top">
          <div className="sh-ft-top-left">
            <Link href="/" aria-label="Ahoy ana sayfa">
              <Logo />
            </Link>
            <nav className="sh-ft-nav" aria-label="Alt menü">
              {TOP_LINKS.map(l => (
                <Link key={l.label} href={l.href}>{l.label}</Link>
              ))}
            </nav>
          </div>
          <div className="sh-ft-social">
            {SOCIAL.map(s => (
              <a key={s.icon} href="#" aria-label={s.label}>
                <Image src={`/home/social-${s.icon}.png`} alt="" fill sizes="25px" />
              </a>
            ))}
          </div>
        </div>

        <div className="sh-ft-cols">
          {COLUMNS.map(col => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="sh-ft-contact">
          <div className="sh-ft-phones">
            <div className="sh-ft-phone">
              <span className="sh-ft-phone-ico"><Headset size={22} strokeWidth={1.8} aria-hidden="true" /></span>
              <div>
                <small>Çağrı merkezi</small>
                <a href="tel:08504339070">0850 433 9070</a>
              </div>
            </div>
            <div className="sh-ft-phone">
              <span className="sh-ft-phone-ico"><WhatsAppIcon /></span>
              <div>
                <small>WhatsApp Destek Hattı</small>
                <a href="https://wa.me/908504339071">0850 433 9071</a>
              </div>
            </div>
          </div>
          <div className="sh-ft-pay">
            <Image src="/home/pay-visa.png" alt="Visa" width={77} height={33} />
            <Image src="/home/pay-iyzico.png" alt="iyzico" width={79} height={35} />
          </div>
        </div>

        <div className="sh-ft-bottom">
          <p className="sh-ft-legal">
            © 2026 Ahoy Boats, Inc. <i>·</i>
            <Link href="#">Gizlilik Politikası</Link> <i>·</i>
            <Link href="#">Kullanım Koşulları</Link> <i>·</i>
            <Link href="#">Site Haritası</Link> <i>·</i>
            <Link href="#">Çerez Tercihleri</Link>
          </p>
          <div className="sh-ft-locale">
            <span><Globe size={24} strokeWidth={1.6} aria-hidden="true" /> Türkçe (TR)</span>
            <span>₺ TRY</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
