import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function CashbackProgramBanner() {
  return (
    <section
      className="cashback-section cashback-program-banner"
      id="seahub-cashback"
      aria-labelledby="cashback-program-heading"
    >
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
            <p className="cashback-miles-eyebrow">SeaHub Cashback</p>
            <h2 id="cashback-program-heading" className="cashback-miles-headline">
              Her onaylı rezervasyonda geri kazanın
            </h2>
            <p className="cashback-miles-sub">
              İlk kiralamada %5&apos;i seçin veya tekrar eden rezervasyonlarda %15 cashback alın — bakiyeniz otomatik işlenir.
            </p>
          </div>

          <div className="cashback-miles-right">
            <div className="cashback-miles-brand">
              <span className="cashback-miles-icon">
                <Sparkles size={22} strokeWidth={2.2} color="#ffffff" aria-hidden />
              </span>
              <div className="cashback-miles-brand-copy">
                <div className="cashback-miles-btns">
                  <Link href="/cashback" className="cashback-miles-btn">
                    Cashback&apos;i keşfet
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
