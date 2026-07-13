import type { Metadata } from "next";
import Link from "next/link";
import { LegalTitle, Section } from "../components";

export const metadata: Metadata = { title: "Kullanım Koşulları — SeaHub" };

export default function TermsPage() {
  return (
    <article>
      <LegalTitle title="Kullanım Koşulları" />

      <Section title="1. Taraflar ve Kapsam">
        <p>
          Bu Kullanım Koşulları, SeaHub platformunu işleten SeaHub Teknoloji A.Ş.
          (&quot;Platform&quot;) ile platforma kayıtlı tekne sahipleri / kaptanlar
          (&quot;Kaptan&quot;) arasındaki ilişkiyi düzenlemektedir. Platforma kayıt olarak bu
          koşulları kabul etmiş sayılırsınız.
        </p>
      </Section>

      <Section title="2. Platform Hizmetleri">
        <p>SeaHub aşağıdaki hizmetleri sunar:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Tekne listeleme ve yönetim paneli</li>
          <li>Rezervasyon talep ve yönetim sistemi</li>
          <li>Misafir-kaptan iletişim altyapısı</li>
          <li>Ödeme aracılık hizmeti</li>
          <li>Takvim ve müsaitlik yönetimi</li>
        </ul>
        <p>
          SeaHub bir kiralama şirketi değildir; kiralama işlemi doğrudan Kaptan ile misafir
          arasında gerçekleşir. Platform yalnızca aracı konumundadır.
        </p>
      </Section>

      <Section title="3. Kaptan Yükümlülükleri">
        <ul className="list-disc space-y-1 pl-5">
          <li>Tekne bilgilerinin eksiksiz ve doğru girilmesi</li>
          <li>Geçerli sigorta, mülkiyet belgesi ve yasal izinlerin temini</li>
          <li>Rezervasyon taleplerine 24 saat içinde yanıt verilmesi</li>
          <li>
            Onaylanan rezervasyonlarda teknenin belirtilen tarih ve koşullarda hazır
            bulundurulması
          </li>
          <li>Platform üzerinden gelen misafirlerle platform dışı anlaşma yapılmaması</li>
        </ul>
      </Section>

      <Section title="4. Komisyon ve Ödeme">
        <p>
          Platform, her tamamlanan rezervasyon üzerinden brüt kiralama bedelinin{" "}
          <strong>%15&apos;i</strong> oranında hizmet komisyonu tahsil eder. Kaptanın net kazancı
          (brüt — komisyon) rezervasyon tamamlanmasından itibaren <strong>3-5 iş günü</strong>{" "}
          içinde bildirilen banka hesabına aktarılır.
        </p>
        <p>
          Misafir tarafından yapılan ödemeler platform üzerinden güvence altına alınır; rezervasyon
          başlamadan önce kaptana ödeme yapılmaz.
        </p>
      </Section>

      <Section title="5. İptal Politikası">
        <p>
          İptal koşulları tekne listeleme sırasında kaptan tarafından belirlenir (Esnek / Orta /
          Katı). Seçilen politika misafirlere ilan sayfasında açıkça gösterilir. Kaptan kaynaklı
          iptallerde misafire tam iade yapılır ve kaptana uyarı puanı uygulanır.
        </p>
      </Section>

      <Section title="6. Hesap Askıya Alma ve Sonlandırma">
        <p>Platform aşağıdaki durumlarda kaptan hesabını askıya alabilir veya sonlandırabilir:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Yanlış veya yanıltıcı tekne bilgisi paylaşımı</li>
          <li>Birden fazla onaylı rezervasyonu iptal etme</li>
          <li>Misafirlerden gelen doğrulanmış şikayetler</li>
          <li>Yasal mevzuata aykırı faaliyet</li>
        </ul>
      </Section>

      <Section title="7. Sorumluluk Sınırlaması">
        <p>
          SeaHub, teknenin fiziksel durumu, teknik arızalar veya deniz koşulları nedeniyle oluşan
          zararlardan sorumlu tutulamaz. Platform, kiralama ilişkisinin tarafı değildir; aracılık
          hizmeti sunmaktadır. Misafir güvenliği kaptanın sorumluluğundadır.
        </p>
      </Section>

      <Section title="8. Uygulanacak Hukuk">
        <p>
          Bu sözleşme Türk Hukuku&apos;na tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra
          Daireleri yetkilidir.
        </p>
      </Section>

      <Section title="9. İletişim">
        <p>
          Hukuki talepler ve bildirimler için:{" "}
          <Link href="mailto:legal@seahub.com" className="text-brand-600 hover:underline">
            legal@seahub.com
          </Link>
        </p>
      </Section>
    </article>
  );
}
