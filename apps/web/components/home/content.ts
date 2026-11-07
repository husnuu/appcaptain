// Ana sayfa içerikleri — Figma tasarımındaki metin ve görseller.
// Görseller public/home/ altında (tasarımdan 2x çözünürlükte kesildi).

export const HERO_SUGGESTIONS = [
  { label: 'Göcek', sub: 'Muğla, Türkiye' },
  { label: 'Bodrum', sub: 'Muğla, Türkiye' },
  { label: 'Marmaris', sub: 'Muğla, Türkiye' },
  { label: 'Fethiye', sub: 'Muğla, Türkiye' },
  { label: 'Kaş', sub: 'Antalya, Türkiye' },
  { label: 'Çeşme', sub: 'İzmir, Türkiye' },
]

export const PROMOS = [
  { img: '/home/promo-boat.webp', title: ['Özgürce keşfet,', 'tatilini değerli kıl.'], cta: 'Hemen tekne kirala', href: '/tekne-kiralama' },
  { img: '/home/promo-experience.webp', title: ['Sıra dışı anlara', 'şahit ol.'], cta: 'Deneyimleri keşfet', href: '/deneyimler' },
  { img: '/home/promo-location.webp', title: ['Görmediğin', 'mekanları gör.'], cta: 'Lokasyonlara göz at', href: '/#lokasyonlar' },
]

export const BOAT_TYPES = [
  { img: '/home/boat-motoryat.webp', title: 'Motoryat', meta: '850 tekne mevcut', href: '/tekne-kiralama?type=motoryacht' },
  { img: '/home/boat-gulet.webp', title: 'Gulet', meta: '400 tekne mevcut', href: '/tekne-kiralama?type=gulet' },
  { img: '/home/boat-katamaran.webp', title: 'Katamaran', meta: '275 tekne mevcut', href: '/tekne-kiralama?type=catamaran' },
  { img: '/home/boat-yelkenli.webp', title: 'Yelkenli', meta: '380 tekne mevcut', href: '/tekne-kiralama?type=sailboat' },
]

export const EXPERIENCES = [
  { img: '/home/exp-gunbatimi.webp', badge: '52 deneyim mevcut', title: 'Gün Batımı Turu', desc: 'Yelkenler altında eşsiz bir gün batımı anısı edinin', href: '/deneyimler' },
  { img: '/home/exp-dalis.webp', badge: '37 deneyim mevcut', title: 'Dalış Kursu', desc: 'Sualtı dünyasını profesyonel rehberlerle keşfedin', href: '/deneyimler' },
  { img: '/home/exp-adalar.webp', badge: '44 deneyim mevcut', title: 'Adalar', desc: 'Saklı koyları ve el değmemiş adaları birlikte gezin', href: '/deneyimler' },
  { img: '/home/exp-balikcilik.webp', badge: '24 deneyim mevcut', title: 'Balıkçılık Dersi', desc: 'Sabah saatlerinde sessiz koyda geleneksel balıkçılık deneyimleyin', href: '/deneyimler' },
]

export interface HomeLocation {
  slug: string
  name: string
  region: string
  img: string
  thumbs: [string, string]
  rentals: number
  experiences: number
  large?: boolean
}

export const LOCATIONS: HomeLocation[] = [
  { slug: 'marmaris', name: 'Marmaris', region: 'Muğla, Türkiye', img: '/home/loc-marmaris.webp', thumbs: ['/home/loc-marmaris-t1.webp', '/home/loc-marmaris-t2.webp'], rentals: 287, experiences: 64, large: true },
  { slug: 'bodrum', name: 'Bodrum', region: 'Muğla, Türkiye', img: '/home/loc-bodrum.webp', thumbs: ['/home/loc-bodrum-t1.webp', '/home/loc-bodrum-t2.webp'], rentals: 113, experiences: 48, large: true },
  { slug: 'aksu', name: 'Aksu', region: 'Antalya, Türkiye', img: '/home/loc-aksu.webp', thumbs: ['/home/loc-aksu-t1.webp', '/home/loc-aksu-t2.webp'], rentals: 189, experiences: 37 },
  { slug: 'fethiye', name: 'Fethiye', region: 'Muğla, Türkiye', img: '/home/loc-fethiye.webp', thumbs: ['/home/loc-fethiye-t1.webp', '/home/loc-fethiye-t2.webp'], rentals: 136, experiences: 52 },
  { slug: 'kas', name: 'Kaş', region: 'Antalya, Türkiye', img: '/home/loc-kas.webp', thumbs: ['/home/loc-kas-t1.webp', '/home/loc-kas-t2.webp'], rentals: 212, experiences: 44 },
]

export const PLAN_STEPS = [
  {
    title: 'Haritadan tekne veya deneyim keşfet',
    desc: 'Ege ve Akdeniz kıyılarındaki tekne ve deneyimleri harita üzerinden keşfet, ikonlara tıklayarak seçenekleri anında görüntüle.',
  },
  {
    title: 'Hızlı ve güvenli rezervasyon',
    desc: 'Tek hesapla tüm rezervasyonlarını yönet. Kaptanınla mesajlaş, e-biletini indir ve ödemeni güvenle yap.',
  },
  {
    title: 'Rehber eşliğinde aktiviteler',
    desc: 'Sertifikalı rehberler ve yerel uzmanlarla unutulmaz anlar yaşa. Her deneyim güvenlik standartlarına uygun.',
  },
]

export const MARQUEE = [
  { icon: 'sailboat', text: 'Hayalindeki Tekneyi Kirala' },
  { icon: 'anchor', text: "Türkiye'nin Popüler Koylarını Keşfet" },
  { icon: 'ship', text: 'Sana Uygun Tekneyi Kolayca Bul' },
  { icon: 'sunset', text: 'Gün Batımından Dalışa, Her Şey Denizde' },
  { icon: 'waves', text: 'Deniz Tutkunları İçin Tek Adres' },
] as const

export const TRUST_FEATURES = [
  {
    icon: 'shield',
    title: 'Onaylı Kaptanlar',
    desc: 'Tüm kaptanlarımız lisanslı, kimlik doğrulamalı ve deneyim geçmişleri kontrol edilmiş bireylerdir.',
  },
  {
    icon: 'ship',
    title: 'Sigortalı Tekneler',
    desc: 'Platformumuzdaki tüm tekneler kapsamlı deniz sigortasına sahiptir. Olası durumlarda tam koruma altındasınız.',
  },
  {
    icon: 'headset',
    title: '7/24 Destek Hattı',
    desc: 'Denizde veya karada, gece veya gündüz — uzman destek ekibimiz her an ulaşılabilir. Türkçe ve İngilizce hizmet.',
  },
  {
    icon: 'user',
    title: 'Misafir Koruması',
    desc: 'Son dakika iptallerinde tam iade garantisi. Güvenli ödeme ve kişisel verilerin şifreli koruması.',
  },
] as const

export const TESTIMONIALS = [
  {
    name: 'Ahmet Yıldız',
    role: 'CEO',
    company: 'Mavi Rüzgar Yatçılık',
    avatar: '/home/avatar-ahmet.webp',
    quote: 'Rezervasyonlarımız düzenli; müşteri erişimi ve dijital altyapı gerçekten işimizi kolaylaştırdı.',
    stat: '%27',
    statDesc: 'Tatil günlerinde daha hızlı rezervasyon ve randevu.',
    tone: 'blue',
  },
  {
    name: 'Selin Çelik',
    role: 'Görevli',
    company: 'Ege Deniz Akademisi',
    avatar: '/home/avatar-selin.webp',
    quote: 'Deneyim turlarımızı listeledikten sonra doluluk belirgin şekilde arttı; entegrasyon sorunsuzdu.',
    stat: '%50',
    statDesc: 'Daha fazla doluluk oranı ve hızlı entegrasyon süreci.',
    tone: 'green',
  },
] as const

export const BLOG_POSTS = [
  { img: '/home/blog-1.webp', title: 'İlk Kez Yelkenli Kiralayacaklar İçin 10 Altın İpucu', date: '24 Nisan 2026', href: '/blog/yelkenli-kiralama-ipuclari' },
  { img: '/home/blog-2.webp', title: "Bodrum'dan Göcek'e:\nEge'nin 15 Gizli Koyu", date: '30 Nisan 2026', href: '/blog/ege-gizli-koylar' },
  // Tasarımda bu kartın yalnızca sol kısmı görünüyor; görsel o yüzden kısmi (partial).
  { img: '/home/blog-3.webp', title: "Kaş'ta Dalış:\nAkdeniz'in En İyi Dalış Noktaları", date: '12 Mayıs 2026', href: '/blog/kas-dalis', partial: true },
]

type LinkItem = { title: string; sub: string; href: string }

const boat = (title: string, sub: string): LinkItem => ({ title, sub, href: '/tekne-kiralama' })
const exp = (title: string, sub: string): LinkItem => ({ title, sub, href: '/deneyimler' })
const city = (title: string, sub: string): LinkItem => ({ title, sub, href: `/tekne-kiralama?city=${encodeURIComponent(title)}` })

export const POPULAR_SEARCH_TABS: { key: string; label: string; items: LinkItem[] }[] = [
  {
    key: 'boat',
    label: 'Tekne tipi',
    items: [
      boat('Katamaran', '850 tekne mevcut'), boat('Sürat Teknesi', '250 tekne mevcut'), boat('Dalış Teknesi', '120 tekne mevcut'), boat('Gulet', '160 tekne mevcut'),
      boat('Lüks Yat', '44 yat mevcut'), boat('Açık Deniz Yatı', '62 yat mevcut'), boat('Yelkenli', '12 yelkenli mevcut'), boat('Parti Teknesi', '67 tekne mevcut'),
      boat('Kıç Kokpit Yelkenli', '8 yelkenli mevcut'), boat('Motor Yat', '14 yat mevcut'), boat('Balıkçı Teknesi', '21 tekne mevcut'), boat('Kamarota Yat', '55 yat mevcut'),
    ],
  },
  {
    key: 'experience',
    label: 'Deneyim tipi',
    items: [
      exp('Gün Batımı Turu', '52 deneyim mevcut'), exp('Dalış Kursu', '37 deneyim mevcut'), exp('Ada Turu', '44 deneyim mevcut'), exp('Balıkçılık Dersi', '24 deneyim mevcut'),
      exp('Şnorkel Turu', '31 deneyim mevcut'), exp('Yelken Eğitimi', '18 deneyim mevcut'), exp('Tekne Partisi', '26 deneyim mevcut'), exp('Yoga Turu', '9 deneyim mevcut'),
    ],
  },
  {
    key: 'destinations',
    label: 'Popüler destinasyonlar',
    items: [
      city('Göcek', 'Muğla'), city('Bodrum', 'Muğla'), city('Marmaris', 'Muğla'), city('Fethiye', 'Muğla'),
      city('Kaş', 'Antalya'), city('Kemer', 'Antalya'), city('Çeşme', 'İzmir'), city('Datça', 'Muğla'),
    ],
  },
  {
    key: 'rental',
    label: 'Kiralama türü',
    items: [
      boat('Kaptanlı Kiralama', 'Kaptan ve mürettebat dahil'), boat('Kaptansız Kiralama', 'Bareboat, lisans gerekli'), boat('Günlük Kiralama', 'Sabahtan akşama'), boat('Haftalık Kiralama', 'Mavi yolculuk'),
      boat('Saatlik Kiralama', 'Kısa turlar için'), boat('Kabin Kiralama', 'Kabin bazlı rezervasyon'), boat('Organizasyon', 'Doğum günü ve kutlamalar'), boat('Kurumsal Etkinlik', 'Şirket gezileri'),
    ],
  },
  {
    key: 'location',
    label: 'Konuma göre',
    items: [
      city('Muğla', 'Bodrum, Marmaris, Göcek'), city('Antalya', 'Kaş, Kemer, Aksu'), city('İzmir', 'Çeşme, Urla'), city('Aydın', 'Kuşadası, Didim'),
      city('Balıkesir', 'Ayvalık'), city('Çanakkale', 'Bozcaada, Gökçeada'), city('İstanbul', 'Boğaz turları'), city('Mersin', 'Kızkalesi'),
    ],
  },
]

export const POPULAR_RENTAL_LOCATIONS: LinkItem[] = [
  city('Bodrum', 'Göcek'), city('Marmaris', 'Datça'), city('Göcek', 'Kaş'), city('Bozcaada', 'Çanakkale'),
  city('Kaş', 'Antalya'), city('Fethiye', 'Marmaris'), city('Bodrum', 'Marmaris'), city('Gökçeada', 'Çanakkale'),
  city('İzmir', 'Çeşme'), city('Datça', 'Bodrum'), city('Didim', 'Kuşadası'), city('Ayvalık', 'Midilli'),
]
