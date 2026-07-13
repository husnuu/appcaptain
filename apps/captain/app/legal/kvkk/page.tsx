import type { Metadata } from "next";
import Link from "next/link";
import { LegalTitle, Section } from "../components";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni — SeaHub" };

const ROWS: Array<[string, string, string]> = [
  ["Kimlik (ad, soyad)", "Hesap oluşturma, kimlik doğrulama", "Sözleşme ifası"],
  ["İletişim (e-posta, tel)", "Bildirimler, müşteri desteği", "Sözleşme ifası"],
  ["Finansal (IBAN)", "Ödeme ve komisyon transferi", "Sözleşme ifası"],
  ["Tekne belgeleri", "Platform güvenilirliği", "Meşru menfaat"],
  ["Log verileri", "Güvenlik, dolandırıcılık önleme", "Meşru menfaat"],
];

export default function KvkkPage() {
  return (
    <article>
      <LegalTitle title="KVKK Kapsamında Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni" />

      <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm text-blue-800">
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, SeaHub
          Teknoloji A.Ş. olarak Veri Sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaç
          ve kapsamda işlemekteyiz.
        </p>
      </div>

      <Section title="1. Veri Sorumlusu">
        <p>
          <strong>SeaHub Teknoloji A.Ş.</strong>
          <br />
          Adres: [Şirket Adresi], İstanbul, Türkiye
          <br />
          E-posta:{" "}
          <Link href="mailto:kvkk@seahub.com" className="text-brand-600 hover:underline">
            kvkk@seahub.com
          </Link>
          <br />
          KEP: seahub@hs03.kep.tr
        </p>
      </Section>

      <Section title="2. İşlenen Kişisel Veriler ve İşleme Amaçları">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                  Veri Kategorisi
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                  İşleme Amacı
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                  Hukuki Dayanak
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([cat, purpose, basis], i) => (
                <tr key={cat} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-200 px-3 py-2">{cat}</td>
                  <td className="border border-gray-200 px-3 py-2">{purpose}</td>
                  <td className="border border-gray-200 px-3 py-2">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. Kişisel Verilerin Aktarılması">
        <p>
          Kişisel verileriniz; ödeme hizmeti sağlayıcıları, yasal talep eden resmi kurumlar ve
          onaylanan rezervasyonlarda misafirlerle (ad ve iletişim bilgisi) paylaşılabilir. Yurt dışı
          aktarım söz konusu ise KVKK&apos;nın 9. maddesi çerçevesinde gerekli güvenceler sağlanır.
        </p>
      </Section>

      <Section title="4. Kişisel Verilerin Saklanma Süresi">
        <p>
          Hesap verileri hesabın aktif olduğu süre boyunca, finansal kayıtlar ise Vergi Usul Kanunu
          gereği <strong>10 yıl</strong> saklanır. Diğer veriler işleme amacı ortadan kalktığında
          silinir.
        </p>
      </Section>

      <Section title="5. KVKK Kapsamındaki Haklarınız">
        <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse bilgi talep etme</li>
          <li>Amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içi / yurt dışında aktarıldığı üçüncü kişileri öğrenme</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
          <li>Silinmesini veya yok edilmesini isteme</li>
          <li>Düzeltme/silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme</li>
          <li>Münhasıran otomatik sistemler ile analiz edilmesine itiraz etme</li>
          <li>Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme</li>
        </ul>
        <p>
          Başvuru:{" "}
          <Link href="mailto:kvkk@seahub.com" className="text-brand-600 hover:underline">
            kvkk@seahub.com
          </Link>{" "}
          adresine kimliğinizi doğrulayan belge ile yazılı başvuru yapabilirsiniz. Başvurular en geç{" "}
          <strong>30 gün</strong> içinde yanıtlanır.
        </p>
      </Section>
    </article>
  );
}
