import type { Metadata } from "next";
import Link from "next/link";
import { LegalTitle, Section } from "../components";

export const metadata: Metadata = { title: "Gizlilik Politikası — SeaHub" };

export default function PrivacyPage() {
  return (
    <article>
      <LegalTitle title="Gizlilik Politikası" />

      <Section title="1. Toplanan Veriler">
        <p>Platform, aşağıdaki kişisel verileri işlemektedir:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Kimlik:</strong> Ad, soyad, T.C. kimlik numarası (ödeme doğrulama için)
          </li>
          <li>
            <strong>İletişim:</strong> E-posta adresi, telefon numarası
          </li>
          <li>
            <strong>Tekne:</strong> Ruhsat bilgileri, sigorta belgeleri, fotoğraflar
          </li>
          <li>
            <strong>Finansal:</strong> IBAN, ödeme geçmişi (ödeme sağlayıcı üzerinden şifreli)
          </li>
          <li>
            <strong>Kullanım:</strong> Oturum logları, IP adresi, cihaz bilgisi
          </li>
        </ul>
      </Section>

      <Section title="2. Verilerin Kullanım Amacı">
        <ul className="list-disc space-y-1 pl-5">
          <li>Platform hizmetlerinin sunulması ve rezervasyon yönetimi</li>
          <li>Kimlik doğrulama ve dolandırıcılık önleme</li>
          <li>Ödeme ve komisyon hesaplamaları</li>
          <li>Müşteri desteği ve bildirimlerin iletilmesi</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>
      </Section>

      <Section title="3. Veri Paylaşımı">
        <p>Kişisel verileriniz yalnızca şu durumlarda üçüncü taraflarla paylaşılır:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Yasal zorunluluk (mahkeme kararı, resmi talep)</li>
          <li>Ödeme işlemcileri (şifreli iletişim, PCI-DSS uyumlu)</li>
          <li>Rezervasyon onayında misafirin ad ve iletişim bilgisi kaptanla paylaşılır</li>
        </ul>
        <p>Verileriniz pazarlama amacıyla üçüncü taraflara satılmaz veya kiralanmaz.</p>
      </Section>

      <Section title="4. Veri Saklama">
        <p>
          Hesap verileriniz hesap aktif olduğu sürece, finansal kayıtlar yasal zorunluluk gereği{" "}
          <strong>10 yıl</strong> saklanır. Hesap silinme talebinde kişisel veriler 30 gün içinde
          anonim hale getirilir (yasal zorunluluk kapsamındaki kayıtlar hariç).
        </p>
      </Section>

      <Section title="5. Çerezler">
        <p>
          Platform, oturum yönetimi ve analitik için çerez kullanır. Detaylar için{" "}
          <Link href="/legal/cookies" className="text-brand-600 hover:underline">
            Çerez Politikası
          </Link>
          &apos;nı inceleyin.
        </p>
      </Section>

      <Section title="6. Güvenlik">
        <p>
          Verileriniz AES-256 şifreleme ile korunur. Supabase altyapısı ISO 27001 sertifikalıdır.
          Şüpheli erişim durumunda size bildirim yapılır.
        </p>
      </Section>

      <Section title="7. Haklarınız">
        <ul className="list-disc space-y-1 pl-5">
          <li>Verilerinize erişim ve kopyasını talep etme</li>
          <li>Yanlış verilerin düzeltilmesini isteme</li>
          <li>Kişisel verilerinizin silinmesini talep etme (yasal istisnalar saklı)</li>
          <li>Veri işlemeye itiraz etme</li>
        </ul>
        <p>
          Talepler için:{" "}
          <Link href="mailto:privacy@seahub.com" className="text-brand-600 hover:underline">
            privacy@seahub.com
          </Link>
        </p>
      </Section>
    </article>
  );
}
