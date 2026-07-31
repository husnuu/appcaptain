import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  Percent,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'SeaHub Cashback Programı — Her rezervasyonda geri kazanın',
  description:
    'Onaylı tekne ve deneyim rezervasyonlarınızda SeaHub Cashback ile ilk kiralamada %5, sonrakilerde %15\'e varan bakiye kazanın. Ek ücret yok.',
}

const STEPS = [
  {
    n: 1,
    title: 'Rezervasyon yapın',
    desc: 'Tekne kiralama veya deneyim seçin; ödemeyi SeaHub üzerinden tamamlayın.',
    Icon: CalendarCheck,
  },
  {
    n: 2,
    title: 'Ödeme onaylansın',
    desc: 'İşlem güvenli ödeme altyapısıyla tamamlanınca cashback hesaplanır.',
    Icon: CreditCard,
  },
  {
    n: 3,
    title: 'Cüzdana işlensin',
    desc: 'Kazanılan tutar SeaHub cüzdanınıza otomatik yansır; ekstra başvuru gerekmez.',
    Icon: Wallet,
  },
  {
    n: 4,
    title: 'Sonraki seferde kullanın',
    desc: 'Bakiyenizi bir sonraki uygun rezervasyonda indirim olarak kullanın.',
    Icon: Sparkles,
  },
]

const FAQ = [
  {
    q: 'Cashback ne zaman tanımlanır?',
    a: 'Rezervasyon ödemesi başarıyla tamamlandıktan ve iptal süresi geçtikten sonra uygun işlemlerde bakiyenize işlenir.',
  },
  {
    q: 'Her rezervasyonda aynı oran mı geçerli?',
    a: 'Program kapsamında ilk onaylı kiralamanızda %5; ikinci ve sonraki uygun işlemlerde daha yüksek oranlar uygulanabilir (ör. %15). Güncel koşullar hesabınızda görüntülenir.',
  },
  {
    q: 'İptal veya değişiklikte ne olur?',
    a: 'İptal veya kısmi iade kuralları iş ortağı ve iptal politikasına göre değişir; cashback yalnızca geçerli ve tamamlanmış işlemler için hesaplanır.',
  },
]

export default function CashbackProgramPage() {
  return (
    <div className="cb-page">
      <section className="cb-hero" aria-labelledby="cb-hero-title">
        <div className="cb-hero-bg" aria-hidden="true" />
        <div className="cb-hero-inner">
          <p className="cb-eyebrow">
            <Sparkles size={14} strokeWidth={2.5} aria-hidden />
            SeaHub Cashback
          </p>
          <h1 id="cb-hero-title" className="cb-title">
            Her onaylı rezervasyonda geri kazanın
          </h1>
          <p className="cb-lede">
            Ödemeniz tamamlanınca bakiyenize cashback yansır; bir sonraki tekne veya deneyim rezervasyonunda kullanırsınız.
            Ek ücret yok — uygun işlemlerde otomatik hesaplanır.
          </p>
          <div className="cb-hero-actions">
            <Link href="/tekne-kiralama" className="cb-btn cb-btn--primary">
              Tekne ara
              <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
            </Link>
            <Link href="/deneyimler" className="cb-btn cb-btn--ghost">
              Deneyimlere göz at
            </Link>
          </div>
        </div>
      </section>

      <section className="cb-shell" aria-labelledby="cb-tiers-title">
        <h2 id="cb-tiers-title" className="cb-section-title">
          Oranlar nasıl işler?
        </h2>
        <p className="cb-section-lede">
          Program, deniz ekosistemindeki ilk ve tekrarlayan rezervasyonlarınızı ödüllendirir. Oranlar kampanya ve iş ortağına göre güncellenebilir.
        </p>
        <div className="cb-tier-grid">
          <article className="cb-tier-card">
            <div className="cb-tier-badge">
              <Percent size={18} strokeWidth={2.2} aria-hidden />
              İlk uygun kiralama
            </div>
            <p className="cb-tier-pct">%5</p>
            <p className="cb-tier-desc">
              SeaHub üzerinden tamamladığınız ilk onaylı rezervasyonda cashback oranı.
            </p>
          </article>
          <article className="cb-tier-card cb-tier-card--accent">
            <div className="cb-tier-badge cb-tier-badge--light">
              <Sparkles size={18} strokeWidth={2.2} aria-hidden />
              İkinci ve sonrası
            </div>
            <p className="cb-tier-pct">%15</p>
            <p className="cb-tier-desc">
              Aynı hesapla devam eden uygun kiralamalarda artan geri kazanım — sadakat için tasarlandı.
            </p>
          </article>
        </div>
      </section>

      <section className="cb-shell cb-steps-wrap" aria-labelledby="cb-steps-title">
        <h2 id="cb-steps-title" className="cb-section-title">
          Nasıl çalışır?
        </h2>
        <ol className="cb-steps">
          {STEPS.map(({ n, title, desc, Icon }) => (
            <li key={n} className="cb-step">
              <div className="cb-step-ico" aria-hidden>
                <Icon size={22} strokeWidth={1.85} />
              </div>
              <div className="cb-step-body">
                <span className="cb-step-num">{n}</span>
                <h3 className="cb-step-title">{title}</h3>
                <p className="cb-step-desc">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="cb-shell">
        <div className="cb-trust-grid">
          <div className="cb-trust-card">
            <ShieldCheck className="cb-trust-icon" size={28} strokeWidth={1.75} aria-hidden />
            <h3 className="cb-trust-title">Güvenli ödeme</h3>
            <p className="cb-trust-text">
              Ödemeler şifreli altyapı üzerinden işlenir; cashback yalnızca tamamlanmış ve uygun rezervasyonlar için hesaplanır.
            </p>
          </div>
          <div className="cb-trust-card">
            <Wallet className="cb-trust-icon" size={28} strokeWidth={1.75} aria-hidden />
            <h3 className="cb-trust-title">Tek cüzdan</h3>
            <p className="cb-trust-text">
              Bakiyenizi hesabınızdan takip edin; uygun sonraki rezervasyonlarda kolayca kullanın.
            </p>
          </div>
        </div>
      </section>

      <section className="cb-shell cb-faq" aria-labelledby="cb-faq-title">
        <h2 id="cb-faq-title" className="cb-section-title">
          Sıkça sorulanlar
        </h2>
        <ul className="cb-faq-list">
          {FAQ.map(item => (
            <li key={item.q} className="cb-faq-item">
              <p className="cb-faq-q">{item.q}</p>
              <p className="cb-faq-a">{item.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="cb-bottom-cta" aria-label="Rezervasyona başlayın">
        <div className="cb-bottom-inner">
          <h2 className="cb-bottom-title">Cashback kazanmaya hazır mısınız?</h2>
          <p className="cb-bottom-text">
            Bugün bir rota veya deneyim seçin; onaylı işlemlerde geri kazanım hesabınıza işlensin.
          </p>
          <Link href="/tekne-kiralama" className="cb-bottom-btn">
            Kiralamaya başla
            <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </section>

      <p className="cb-legal">
        SeaHub Cashback oranları ve koşulları kampanya dönemlerine göre değişebilir. Kesin kurallar rezervasyon sırasında ve hesap
        sözleşmenizde yer alır.
      </p>
    </div>
  )
}
