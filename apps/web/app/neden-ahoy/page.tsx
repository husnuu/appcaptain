import type { Metadata } from 'next'
import { CashbackCard, TrustBlock } from '@/components/home/HomeStatic'
import { EdHero, FaqList, LinedColumns, PhotoBanner } from '@/components/pages/Editorial'
import HowItWorks from '@/components/pages/HowItWorks'

export const metadata: Metadata = {
  title: 'Neden Ahoy? — Güvenle tekne kirala',
  description:
    'Doğrulanmış kaptanlar, incelenmiş ilanlar, kaptan onayından sonra ödeme ve %15’e varan cashback ile Ahoy’da tekne kiralamak neden daha kolay ve güvenli?',
}

const PROMISES = [
  { title: 'İncelenmiş ilanlar', text: 'Her ilan yayına girmeden önce ekibimiz tarafından incelenir; ruhsat ve sigorta belgeleri Ahoy’a yüklenir.' },
  { title: 'Ödeme onaydan sonra', text: 'Talep gönderirken hiçbir ücret ödemezsin. Ödeme, kaptan talebini onayladıktan sonra alınır.' },
  { title: 'Açık koşullar', text: 'Fiyat, fiyata dahil olanlar, iptal politikası ve tekne kuralları rezervasyondan önce ilanda yazar.' },
]

const FAQ = [
  {
    q: 'Rezervasyonum nasıl kesinleşiyor?',
    a: 'Tarihini ve kişi sayısını seçip talep gönderirsin. Kaptan talebini onayladığında rezervasyonun kesinleşir. “Anında rezervasyon” etiketli teknelerde onay beklemeden kesinleşir.',
  },
  {
    q: 'Ödeme ne zaman alınıyor?',
    a: 'Talep gönderirken ödeme yapmazsın. Kaptan talebini onayladıktan sonra, ilanda yazan ödeme koşuluna göre (ör. %20 ön ödeme) ödeme alınır.',
  },
  {
    q: 'Kaptanlar ve tekneler nasıl doğrulanıyor?',
    a: 'Kaptanlar ilan yayınlanmadan önce ruhsat ve sigorta gibi tekne belgelerini Ahoy’a yükler. İlanlar ekibimiz tarafından incelendikten sonra yayına alınır.',
  },
  {
    q: 'İptal etmem gerekirse ne olur?',
    a: 'Her ilanda kaptanın belirlediği iptal politikası (esnek, orta veya katı) geçerlidir ve ilan sayfasında yazar. Bir sorun yaşarsan destek ekibimiz yanındadır.',
  },
  {
    q: 'Cashback nasıl çalışıyor?',
    a: 'Onaylanan rezervasyonlarda tutarın %5 ile %15 arası Ahoy bakiyene eklenir; bir sonraki kiralamanda kullanabilirsin.',
  },
  {
    q: 'Rezervasyondan önce kaptanla konuşabilir miyim?',
    a: 'Evet. İlan sayfasındaki “Kaptana mesaj gönder” ile soru sorabilir, yanıtları Mesajlarım sayfasından takip edebilirsin.',
  },
]

export default function NedenAhoyPage() {
  return (
    <div className="sh-home sh-ed">
      <EdHero
        l1="Denize açılmanın"
        l2="en güvenli yolu."
        lede="Doğrulanmış kaptanlar, incelenmiş ilanlar ve açık koşullarla tekne kiralamak artık bir otel rezervasyonu kadar kolay."
        image="/pages/bay.webp"
        alt="Yeşil tepelerle çevrili koyda demirli tekneler"
        primary={{ href: '/tekne-kiralama', label: 'Tekneleri keşfet' }}
        secondary={{ href: '#nasil-calisir', label: 'Nasıl çalışır?' }}
      />

      {/* ---------- açılış metni ---------- */}
      <section className="sh-sect sh-sect--white sh-ed-sect">
        <div className="sh-container">
          <p className="sh-ed-statement">
            Tekne kiralamak; doğru kaptanı bulmak, fiyatı netleştirmek ve içinin rahat etmesi demek.{' '}
            <span>Ahoy bu üçünü tek yerde topluyor.</span>
          </p>
          <LinedColumns items={PROMISES} />
        </div>
      </section>

      {/* ---------- ana sayfadaki güven paneli ---------- */}
      <TrustBlock />

      {/* ---------- nasıl çalışır ---------- */}
      <section className="sh-sect sh-sect--white sh-ed-sect" id="nasil-calisir">
        <div className="sh-container">
          <div className="sh-section-head">
            <div>
              <h2 className="sh-h2">Nasıl çalışır?</h2>
              <p className="sh-sub">Keşfetmekten demir almaya kadar dört adım.</p>
            </div>
          </div>
          <HowItWorks />
          <div className="sh-ed-gap" />
          <CashbackCard />
        </div>
      </section>

      {/* ---------- sık sorulanlar ---------- */}
      <section className="sh-sect sh-sect--cream sh-ed-sect">
        <div className="sh-container sh-ed-faq">
          <div>
            <h2 className="sh-h2">Sık sorulan sorular</h2>
            <p className="sh-sub">Rezervasyon, ödeme ve iptal hakkında merak edilenler.</p>
            <p className="sh-ed-help">
              Başka bir sorun mu var? <a href="https://wa.me/908504339071">WhatsApp’tan yaz</a> ya da <a href="tel:08504339070">0850 433 9070</a>’i ara.
            </p>
          </div>
          <FaqList items={FAQ} />
        </div>
      </section>

      <section className="sh-sect sh-sect--white sh-ed-end">
        <PhotoBanner
          title={
            <>
              Rotanı çizmeye
              <br />
              hazır mısın?
            </>
          }
          text="Eşsiz koylar, güvenilir kaptanlar ve sana uygun tekneler seni bekliyor."
          primary={{ href: '/tekne-kiralama', label: 'Tekneleri keşfet' }}
          secondary={{ href: '/deneyimler', label: 'Deneyimler' }}
        />
      </section>
    </div>
  )
}
