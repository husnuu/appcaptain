import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function CashbackSection() {
  return (
    <section className="cashback-section" id="genis-tekne-agi" aria-labelledby="fleet-banner-heading">
      <div className="cashback-miles-banner">
        <svg
          className="cashback-miles-svg-bg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 152"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 48 C220 18 440 74 720 48 S1220 20 1440 52"
            stroke="rgba(0,174,239,0.28)"
            strokeWidth="1.25"
            strokeDasharray="5 9"
            fill="none"
          />
          <path
            d="M0 74 C320 92 580 44 900 64 S1280 82 1440 70"
            stroke="rgba(0,174,239,0.2)"
            strokeWidth="1"
            strokeDasharray="4 11"
            fill="none"
          />
          <path
            d="M0 102 C260 68 520 112 840 82 S1260 104 1440 92"
            stroke="rgba(0,174,239,0.14)"
            strokeWidth="1"
            strokeDasharray="7 14"
            fill="none"
          />
        </svg>

        <div className="cashback-miles-inner">
          <div className="cashback-miles-left">
            <p className="cashback-miles-eyebrow">SeaHub</p>
            <h2 id="fleet-banner-heading" className="cashback-miles-headline">
              Geniş Tekne Ağı
            </h2>
            <p className="cashback-miles-sub">
              12.000 tekne ve 500 deneyim ile deniz ekosisteminin ev sahibi olmanızı sağlayan içerikler, limanlardan
              rotalara tek yerde. Kiralama ve deneyimleri keşfedin, rezervasyonu bir arada yönetin.
            </p>
          </div>

          <div className="cashback-miles-right">
            <div className="cashback-miles-brand">
              <span className="cashback-miles-icon">
                <Sparkles size={22} strokeWidth={2.2} color="#ffffff" aria-hidden />
              </span>
              <div className="cashback-miles-brand-copy">
                <div className="cashback-miles-btns">
                  <Link href="/listing" className="cashback-miles-btn">
                    Tekneleri keşfet
                  </Link>
                  <Link href="/deneyimler" className="cashback-miles-btn">
                    Deneyimleri keşfet
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
