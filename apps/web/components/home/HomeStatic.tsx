import Image from 'next/image'
import Link from 'next/link'
import {
  Anchor,
  ArrowRight,
  Headset,
  Sailboat,
  ShieldCheck,
  Ship,
  Sunset,
  UserRoundCheck,
  Waves,
} from 'lucide-react'
import { Logo } from './Logo'
import { BOAT_TYPES, EXPERIENCES, MARQUEE, TRUST_FEATURES } from './content'

export function BoatTypeCards() {
  return BOAT_TYPES.map(b => (
    <Link key={b.title} href={b.href} className="sh-tcard">
      <div className="sh-tcard-img">
        <Image src={b.img} alt={b.title} fill sizes="(max-width: 860px) 78vw, 296px" />
      </div>
      <h3 className="sh-tcard-title">{b.title}</h3>
      <p className="sh-tcard-meta">{b.meta}</p>
    </Link>
  ))
}

export function ExperienceCards() {
  return EXPERIENCES.map(x => (
    <Link key={x.title} href={x.href} className="sh-tcard">
      <div className="sh-tcard-img">
        <span className="sh-badge">{x.badge}</span>
        <Image src={x.img} alt={x.title} fill sizes="(max-width: 860px) 78vw, 296px" />
      </div>
      <h3 className="sh-tcard-title">{x.title}</h3>
      <p className="sh-tcard-desc">{x.desc}</p>
    </Link>
  ))
}

export function CashbackCard() {
  return (
    <div className="sh-cash-wrap">
      <div className="sh-container">
        <div className="sh-cash">
          <Image
            className="sh-cash-yacht"
            src="/home/cashback-yacht.webp"
            alt="Denizde hızla ilerleyen lüks motoryat"
            width={803}
            height={472}
          />
          <div className="sh-cash-copy">
            <div className="sh-cash-brand">
              <Logo />
              <span className="sh-cash-chip">Cashback</span>
            </div>
            <h2 className="sh-cash-title">
              Her onaylı rezervasyonda
              <br />
              %15’e varan cashback
            </h2>
            <p className="sh-cash-desc">
              İlk kiralamada %5’i seç ya da tekrar eden rezervasyonlarda %15 cashback al—bakiye otomatik olarak işlenir.
            </p>
            <Link href="/cashback" className="sh-btn sh-btn--white">
              Cashback’i keşfet <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const MARQUEE_ICONS = { sailboat: Sailboat, anchor: Anchor, ship: Ship, sunset: Sunset, waves: Waves }

export function DiscoverBanner() {
  const items = [...MARQUEE, ...MARQUEE]
  return (
    <div className="sh-disc-wrap">
      <div className="sh-container">
        <div className="sh-disc">
          <Image src="/home/discover.webp" alt="" fill sizes="1280px" />
          <div className="sh-disc-body">
            <h2 className="sh-disc-title">
              Ahoy ile yeni
              <br />
              deneyimlere yelken aç
            </h2>
            <p className="sh-disc-desc">
              Ege ve Akdeniz kıyılarındaki tekne ve deneyimleri keşfet, Ahoy’a katılarak kişiye özel fırsatlara hemen ulaş.
            </p>
            <div className="sh-disc-ctas">
              <Link href="/tekne-kiralama" className="sh-btn sh-btn--white">
                Hemen aramıza katıl <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <Link href="/#neden-ahoy" className="sh-btn sh-btn--glass">
                Neden Ahoy
              </Link>
            </div>
          </div>
          <div className="sh-marquee" aria-hidden="true">
            <div className="sh-marquee-track">
              {items.map((m, i) => {
                const Icon = MARQUEE_ICONS[m.icon]
                return (
                  <span key={i} className="sh-marquee-item">
                    <Icon size={22} strokeWidth={1.6} />
                    {m.text}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TRUST_ICONS = { shield: ShieldCheck, ship: Ship, headset: Headset, user: UserRoundCheck }

export function TrustBlock() {
  return (
    <section className="sh-sect sh-sect--cream sh-trust-wrap" id="neden-ahoy" aria-labelledby="trust-title">
      <div className="sh-container">
        <div className="sh-trust">
          <Image className="sh-trust-yacht" src="/home/trust-yacht.webp" alt="" width={589} height={397} />
          <div className="sh-trust-copy">
            <h2 className="sh-trust-title" id="trust-title">
              Deniz deneyiminizi
              <br />
              zahmetsiz hale getiriyoruz.
            </h2>
            <p className="sh-trust-desc">
              <b>Güvenli Rezervasyon, Sorunsuz Deneyim —</b> Doğrulanmış tekneler, güvenli ödeme ve 7/24 destek ile Ahoy’da
              rezervasyonunu gönül rahatlığıyla tamamla.
            </p>
          </div>
          <div className="sh-trust-list">
            {TRUST_FEATURES.map(f => {
              const Icon = TRUST_ICONS[f.icon]
              return (
                <div key={f.title} className="sh-tfeat">
                  <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                  <h3 className="sh-tfeat-title">{f.title}</h3>
                  <p className="sh-tfeat-desc">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
