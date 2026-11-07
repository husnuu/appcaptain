import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Headset, MessageCircle, Sailboat } from 'lucide-react'
import { EdHero, LinedColumns, PhotoBanner } from '@/components/pages/Editorial'

export const metadata: Metadata = {
  title: 'Hakkımızda — Ahoy',
  description:
    'Ahoy; güvenilir kaptanları ve deniz tutkunlarını tek platformda buluşturarak tekne kiralamayı ve deniz deneyimlerini kolay, şeffaf ve güvenli hale getirir.',
}

const CAPTAIN_APP_URL = process.env.NEXT_PUBLIC_CAPTAIN_URL ?? 'https://appcaptain-captain.vercel.app'

const NUMBERS = [
  { value: '8.333', unit: 'km', label: 'Türkiye’nin kıyı şeridi' },
  { value: '4', unit: 'deniz', label: 'Karadeniz, Marmara, Ege ve Akdeniz' },
  { value: '%15', unit: '', label: 'Onaylı rezervasyonlarda cashback' },
  { value: '7/24', unit: '', label: 'Türkçe ve İngilizce destek' },
]

const VALUES = [
  { title: 'Önce güven', text: 'Her ilan yayına girmeden önce incelenir; belgeler ve koşullar açıkça paylaşılır.' },
  { title: 'Şeffaflık', text: 'Fiyatı, dahil olanları ve kuralları rezervasyondan önce görürsün. Sürpriz yok.' },
  { title: 'Denize saygı', text: 'Koyları ve deniz yaşamını koruyan, sorumlu bir deniz turizmini destekliyoruz.' },
  { title: 'Yerel kaptanlar', text: 'Bölgesini en iyi tanıyan kaptanların işlerini büyütmelerine destek oluyoruz.' },
]

const ROUTES = ['Göcek', 'Bodrum', 'Marmaris', 'Fethiye', 'Kaş', 'Çeşme', 'Antalya']

export default function HakkimizdaPage() {
  return (
    <div className="sh-home sh-ed">
      <EdHero
        l1="Mavi kıyıları"
        l2="herkes için açıyoruz."
        lede="Ahoy, Türkiye’nin dört bir yanındaki kaptanları ve deniz tutkunlarını tek bir güvenilir platformda buluşturur."
        image="/pages/sailboat.webp"
        alt="Yeşil bir tepenin önünden geçen Türk bayraklı yelkenli"
        primary={{ href: '/tekne-kiralama', label: 'Tekneleri keşfet' }}
        secondary={{ href: '/neden-ahoy', label: 'Neden Ahoy?' }}
      />

      {/* ---------- neden varız ---------- */}
      <section className="sh-sect sh-sect--white sh-ed-sect">
        <div className="sh-container sh-ed-story">
          <div className="sh-ed-story-photo">
            {/* Fotoğraf: Unsplash (txbXuzTJdSA) — Unsplash Lisansı */}
            <Image src="/pages/fishing.webp" alt="Sakin denizde ilerleyen renkli bir balıkçı teknesi" fill sizes="(max-width: 860px) 100vw, 520px" />
          </div>
          <div className="sh-ed-story-text">
            <h2 className="sh-h2">Neden varız?</h2>
            <p className="sh-ed-big">
              Denize açılmak bir ayrıcalık değil, herkesin yaşayabileceği bir deneyim olmalı. Biz bu deneyimi bir otel rezervasyonu kadar kolay hale
              getirmek için çalışıyoruz.
            </p>
            <p>
              Doğru tekneyi bulmak, kaptanla anlaşmak, fiyatı ve koşulları netleştirmek çoğu zaman telefon trafiği ve belirsizlik demek. Ahoy’da ilanlar
              incelenir, koşullar baştan yazılıdır, ödeme ise ancak kaptan onayından sonra alınır.
            </p>
            <p>
              Kaptanlar için de aynı kolaylığı istiyoruz: teknesini kolayca listeleyen, takvimini ve taleplerini tek panelden yöneten yerel
              işletmeler.
            </p>
            <p className="sh-ed-sign">— Ahoy ekibi</p>
          </div>
        </div>

        <div className="sh-container">
          <ul className="sh-ed-numbers" aria-label="Rakamlarla">
            {NUMBERS.map(n => (
              <li key={n.label}>
                <b>
                  {n.value}
                  {n.unit && <small>{n.unit}</small>}
                </b>
                <span>{n.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- değerler ---------- */}
      <section className="sh-sect sh-sect--cream sh-ed-sect">
        <div className="sh-container">
          <div className="sh-section-head">
            <div>
              <h2 className="sh-h2">Değerlerimiz</h2>
              <p className="sh-sub">Her kararımızda ve her yeni özellikte bu dört ilkeye bağlı kalıyoruz.</p>
            </div>
          </div>
          <LinedColumns items={VALUES} numbered />
        </div>
      </section>

      {/* ---------- misafirler & kaptanlar ---------- */}
      <section className="sh-sect sh-sect--white sh-ed-sect">
        <div className="sh-container">
          <div className="sh-section-head">
            <div>
              <h2 className="sh-h2">Denizin iki yakası</h2>
              <p className="sh-sub">Misafirlere güvenli bir rezervasyon, kaptanlara işlerini büyütecek araçlar.</p>
            </div>
          </div>
          <div className="sh-ed-sides">
            <Link href="/tekne-kiralama" className="sh-ed-side">
              <Image src="/home/auth-boat.webp" alt="" fill sizes="(max-width: 860px) 100vw, 624px" />
              <span className="sh-ed-side-label">Misafirler için</span>
              <span className="sh-ed-side-title">
                Hayalindeki tekne,
                <br />
                birkaç tıkla.
              </span>
              <span className="sh-btn sh-btn--white">Tekneleri keşfet</span>
            </Link>
            <a href={CAPTAIN_APP_URL} className="sh-ed-side">
              {/* Fotoğraf: Unsplash (_OWGGyAOu-s) — Unsplash Lisansı */}
              <Image src="/pages/captain.webp" alt="" fill sizes="(max-width: 860px) 100vw, 624px" />
              <span className="sh-ed-side-label">Kaptanlar için</span>
              <span className="sh-ed-side-title">
                Tekneni listele,
                <br />
                takvimini doldur.
              </span>
              <span className="sh-btn sh-btn--white">Kaptan paneline git</span>
            </a>
          </div>

          <div className="sh-ed-routes">
            <p className="sh-ed-routes-label">Popüler rotalar</p>
            <p className="sh-ed-routes-list">
              {ROUTES.map((r, i) => (
                <span key={r}>
                  <Link href={`/tekne-kiralama?city=${encodeURIComponent(r)}`}>{r}</Link>
                  {i < ROUTES.length - 1 && <i aria-hidden="true">·</i>}
                </span>
              ))}
            </p>
            <Link href="/tekne-kiralama" className="sh-link-arrow">
              Tüm tekneleri gör <ArrowRight size={18} strokeWidth={1.6} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- iletişim ---------- */}
      <section className="sh-sect sh-sect--cream sh-ed-sect" id="iletisim">
        <div className="sh-container sh-ed-contact-wrap">
          <div>
            <h2 className="sh-h2">Bize ulaş</h2>
            <p className="sh-sub">Rezervasyon, iş birliği ya da merak ettiğin her şey için buradayız.</p>
          </div>
          <ul className="sh-ed-contact">
            <li>
              <span className="sh-ed-contact-ico">
                <Headset size={22} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span>
                <small>Çağrı merkezi</small>
                <a href="tel:08504339070">0850 433 9070</a>
              </span>
            </li>
            <li>
              <span className="sh-ed-contact-ico">
                <MessageCircle size={22} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span>
                <small>WhatsApp destek hattı</small>
                <a href="https://wa.me/908504339071">0850 433 9071</a>
              </span>
            </li>
            <li>
              <span className="sh-ed-contact-ico">
                <Sailboat size={22} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span>
                <small>Kaptan mısın?</small>
                <a href={CAPTAIN_APP_URL}>İlanını oluştur</a>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="sh-sect sh-sect--white sh-ed-end">
        <PhotoBanner
          title={
            <>
              Bir sonraki rotan
              <br />
              seni bekliyor
            </>
          }
          text="Güvenilir kaptanlar ve sana uygun teknelerle denize açılmak için doğru yerdesin."
          primary={{ href: '/tekne-kiralama', label: 'Tekneleri keşfet' }}
          secondary={{ href: CAPTAIN_APP_URL, label: 'Kaptan ol', external: true }}
        />
      </section>
    </div>
  )
}
