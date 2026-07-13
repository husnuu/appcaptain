import type { Metadata } from "next";
import Link from "next/link";
import { LegalTitle, Section } from "../components";

export const metadata: Metadata = { title: "Çerez Politikası — SeaHub" };

const ROWS: Array<[string, string, string, string]> = [
  ["sb-auth-token", "Zorunlu", "Supabase oturum yönetimi", "Oturum"],
  ["captain_prefs", "İşlevsel", "Dil ve arayüz tercihleri", "1 yıl"],
  ["_vercel_jwt", "Zorunlu", "Deployment doğrulama", "Oturum"],
  ["analytics_id", "Analitik", "Anonim kullanım istatistiği", "1 yıl"],
];

export default function CookiesPage() {
  return (
    <article>
      <LegalTitle title="Çerez Politikası" />

      <Section title="Çerez Nedir?">
        <p>
          Çerezler, ziyaret ettiğiniz web sitesi tarafından tarayıcınıza yerleştirilen küçük metin
          dosyalarıdır. Oturum bilgilerinizi hatırlamak, tercihlerinizi kaydetmek ve platformun
          doğru çalışmasını sağlamak amacıyla kullanılır.
        </p>
      </Section>

      <Section title="Kullandığımız Çerezler">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                  Çerez Adı
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Tür</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Amaç</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Süre</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([name, type, purpose, duration], i) => (
                <tr key={name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-200 px-3 py-2 font-mono text-xs">{name}</td>
                  <td className="border border-gray-200 px-3 py-2">{type}</td>
                  <td className="border border-gray-200 px-3 py-2">{purpose}</td>
                  <td className="border border-gray-200 px-3 py-2">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Çerez Yönetimi">
        <p>
          Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz. Ancak zorunlu çerezlerin
          kapatılması durumunda platform işlevleri kısmen veya tamamen çalışmayabilir.
        </p>
        <p>Tarayıcı bazlı çerez ayarları:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Google Chrome
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/tr/kb/cerezleri-etkinlestirme-ve-devre-disi-birakma"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a
              href="https://support.apple.com/tr-tr/guide/safari/sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Safari
            </a>
          </li>
        </ul>
      </Section>

      <Section title="İletişim">
        <p>
          Çerez uygulamalarımız hakkında sorularınız için:{" "}
          <Link href="mailto:privacy@seahub.com" className="text-brand-600 hover:underline">
            privacy@seahub.com
          </Link>
        </p>
      </Section>
    </article>
  );
}
