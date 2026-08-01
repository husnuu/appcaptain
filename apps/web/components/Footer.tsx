import Link from 'next/link'

const COL_SEAHUB = [
  { label: 'Hakkımızda',           href: '#' },
  { label: 'Neden SeaHub?',         href: '#' },
  { label: 'Arkadaşını Davet Et',   href: '#' },
  { label: 'Müşteri Yorumları',     href: '#' },
  { label: 'Yardım',                href: '#' },
  { label: 'Cashback Programı',     href: '/cashback' },
  { label: 'Kariyer',               href: '#' },
  { label: 'Tekne Sahipleri',       href: '#' },
  { label: 'Basın',                 href: '#' },
  { label: 'Blog',                  href: '/blog' },
  { label: 'İletişim',              href: '#' },
]

const COL_DESTINATIONS = [
  { label: 'Göcek Tekne Kiralama',      href: '/tekne-kiralama' },
  { label: 'Bodrum Tekne Kiralama',     href: '/tekne-kiralama' },
  { label: 'Marmaris Tekne Kiralama',   href: '/tekne-kiralama' },
  { label: 'Çeşme Tekne Kiralama',      href: '/tekne-kiralama' },
  { label: 'Antalya Tekne Kiralama',    href: '/tekne-kiralama' },
  { label: 'Fethiye Tekne Kiralama',    href: '/tekne-kiralama' },
  { label: 'İstanbul Tekne Kiralama',   href: '/tekne-kiralama' },
  { label: 'Yunanistan Tekne Kiralama', href: '/tekne-kiralama' },
  { label: 'Tüm Destinasyonlar',        href: '/tekne-kiralama' },
]

const COL_OPTIONS = [
  { label: 'Yelkenli Kiralama',        href: '/tekne-kiralama' },
  { label: 'Gulet Kiralama',           href: '/tekne-kiralama' },
  { label: 'Motor Yat Kiralama',       href: '/tekne-kiralama' },
  { label: 'Katamaran Kiralama',       href: '/tekne-kiralama' },
  { label: 'Sürat Teknesi Kiralama',   href: '/tekne-kiralama' },
  { label: 'Kaptanlı Tekne Kiralama',  href: '/tekne-kiralama' },
  { label: 'Bareboat Kiralama',        href: '/tekne-kiralama' },
  { label: 'Lüks Yat Kiralama',        href: '/tekne-kiralama' },
  { label: 'Tüm Seçenekler',           href: '/tekne-kiralama' },
]

const COL_COMMUNITY = [
  { label: 'Denizci Forumu',   href: '/forum' },
  { label: 'Deniz Rehberi',    href: '/blog' },
  { label: 'Rota Haritası',    href: '/#map-section' },
  { label: 'Kaptanlık Eğitimi', href: '#' },
]

const SOCIAL = [
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">

        {/* ── Top grid ── */}
        <div className="footer-top-grid">

          {/* ── Left: Contact block ── */}
          <div className="footer-contact-col">
            {/* Logo */}
            <div className="footer-logo">
              <svg viewBox="0 0 32 32" fill="none" width="28" height="28" aria-hidden="true">
                <path d="M16 4C16 4 8 10 8 18C8 22.4 11.6 26 16 26C20.4 26 24 22.4 24 18C24 10 16 4 16 4Z" fill="#0097A7"/>
                <path d="M10 20C10 20 13 17 16 17C19 17 22 20 22 20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="16" cy="18" r="2" fill="white"/>
                <path d="M8 26L24 26" stroke="#0097A7" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="footer-logo-text">SeaHub</span>
            </div>

            <p className="footer-tagline">Türkiye&apos;nin deniz deneyim platformu</p>

            {/* Phone */}
            <div className="footer-contact-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.45 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>
              </svg>
              <div>
                <div className="footer-phone">0850 433 9070</div>
                <div className="footer-contact-sub">09:00 – 18:00 (İstanbul, UTC+3)<br/>Türkçe · İngilizce</div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="footer-contact-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              <div>
                <div className="footer-contact-label">WhatsApp</div>
                <div className="footer-phone">0850 433 9070</div>
              </div>
            </div>

            {/* E-mail */}
            <div className="footer-contact-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <div>
                <div className="footer-contact-label">E-posta</div>
                <a href="mailto:info@seahub.com.tr" className="footer-email">info@seahub.com.tr</a>
              </div>
            </div>

            {/* Payment badges */}
            <div className="footer-payments">
              <span className="footer-pay-badge">VISA</span>
              <span className="footer-pay-badge footer-pay-badge--mc">MC</span>
              <span className="footer-pay-badge footer-pay-badge--tr">İyzico</span>
              <span className="footer-pay-badge footer-pay-badge--ssl">SSL</span>
            </div>

            {/* Social */}
            <div className="footer-social">
              {SOCIAL.map(s => (
                <a key={s.label} href={s.href} className="footer-social-btn" aria-label={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Right: link columns ── */}
          <div className="footer-links-grid">
            <div>
              <p className="footer-col-title">SeaHub</p>
              {COL_SEAHUB.map(item => (
                <Link key={item.label} href={item.href} className="footer-link">{item.label}</Link>
              ))}
            </div>
            <div>
              <p className="footer-col-title">Destinasyonlar</p>
              {COL_DESTINATIONS.map(item => (
                <Link key={item.label} href={item.href} className="footer-link">{item.label}</Link>
              ))}
            </div>
            <div>
              <p className="footer-col-title">Kiralama Seçenekleri</p>
              {COL_OPTIONS.map(item => (
                <Link key={item.label} href={item.href} className="footer-link">{item.label}</Link>
              ))}
            </div>
            <div>
              <p className="footer-col-title">Topluluk</p>
              {COL_COMMUNITY.map(item => (
                <Link key={item.label} href={item.href} className="footer-link">{item.label}</Link>
              ))}
              <div className="footer-col-spacer" />
              <p className="footer-col-title" style={{ marginTop: 24 }}>Destek</p>
              <Link href="#" className="footer-link">Yardım Merkezi</Link>
              <Link href="#" className="footer-link">Güvenlik</Link>
              <Link href="#" className="footer-link">İptal Politikası</Link>
              <Link href="#" className="footer-link">KVKK Aydınlatma</Link>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © 2026 SeaHub, Inc. ·&nbsp;
            <Link href="#">Gizlilik Politikası</Link> ·&nbsp;
            <Link href="#">Kullanım Koşulları</Link> ·&nbsp;
            <Link href="#">Site Haritası</Link> ·&nbsp;
            <Link href="#">Çerez Tercihleri</Link>
          </p>
          <div className="footer-legal">
            <Link href="#">Türkçe (TR)</Link>
            <Link href="#">₺ TRY</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
