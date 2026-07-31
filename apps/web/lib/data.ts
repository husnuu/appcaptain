// ============================================================
// Static data layer — ready for Sanity swap
//
// TODO: Replace each function with a Sanity GROQ query, e.g.:
//   import { client } from '@/sanity/lib/client'
//   import { groq } from 'next-sanity'
//   export async function getBoatTypes() {
//     return client.fetch(groq`*[_type == "boatType"] | order(order asc)`)
//   }
// ============================================================

import type {
  BoatType, Experience, Location,
  Testimonial, BlogPost, BlogPostFull, BlogCategory,
  EcosystemFeature, TrustFeature,
} from '@/types/content'

// ── Boat Types (Kiralama browse) ──────────────────────────────
export function getBoatTypes(): BoatType[] {
  return [
    { id: 'gulet',     emoji: '🏮', name: 'Gulet',          description: 'Geniş yaşam alanlarıyla geleneksel mavi yolculuk deneyimi',    count: 58,  href: '/listing', image: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=500&q=80' },
    { id: 'sail',      emoji: '⛵', name: 'Yelkenli',        description: 'Rüzgar odaklı, daha doğal ve sportif seyir deneyimi',           count: 348, href: '/listing', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=500&q=80' },
    { id: 'catamaran', emoji: '🚤', name: 'Katamaran',       description: 'Geniş güverte ve dengeli konfor arayanlar için ideal',          count: 92,  href: '/listing', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=500&q=80' },
    { id: 'motor',     emoji: '🛥️', name: 'Motor Yat',       description: 'Hız ve konforu bir araya getiren deniz yolculuğu',              count: 214, href: '/listing', image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=500&q=80' },
    { id: 'speed',     emoji: '💨', name: 'Sürat Teknesi',   description: 'Adrenalin ve özgürlük için tasarlanmış hızlı tekne',            count: 167, href: '/listing', image: 'https://images.unsplash.com/photo-1520942702018-0862200e6873?auto=format&fit=crop&w=500&q=80' },
    { id: 'luxury',    emoji: '👑', name: 'Lüks Yat',        description: 'Beş yıldızlı hizmet ve eşsiz konforu denizde yaşayın',         count: 43,  href: '/listing', image: 'https://images.unsplash.com/photo-1548514168-f14ddaa5fc70?auto=format&fit=crop&w=500&q=80' },
    { id: 'party',     emoji: '🥳', name: 'Parti Teknesi',   description: 'Arkadaşlarla unutulmaz deniz partisi için mükemmel seçim',      count: 76,  href: '/listing', image: 'https://images.unsplash.com/photo-1527824404775-dce343a93dc2?auto=format&fit=crop&w=500&q=80' },
    { id: 'fishing',   emoji: '🎣', name: 'Balıkçı Tekne',   description: 'Sessiz koylarda balık tutmanın keyfini çıkarın',               count: 131, href: '/listing', image: 'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?auto=format&fit=crop&w=500&q=80' },
    { id: 'dive',      emoji: '🤿', name: 'Dalış Teknesi',   description: 'Sualtı dünyasını keşfetmek için donanımlı tekne',              count: 49,  href: '/listing', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80' },
  ]
}

// ── Experiences (Deneyim browse) ─────────────────────────────
export function getExperiences(): Experience[] {
  return [
    { id: 'sunset',   emoji: '🌅', name: 'Gün Batımı Turu',    description: 'Yelkenler altında eşsiz bir gün batımı anısı edinin',         count: 52, href: '/deneyimler', image: 'https://images.unsplash.com/photo-1540946491917-7897cdda40e4?auto=format&fit=crop&w=500&q=80' },
    { id: 'dive',     emoji: '🤿', name: 'Dalış Kursu',         description: 'Sualtı dünyasını profesyonel rehberlerle keşfedin',           count: 37, href: '/deneyimler', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=500&q=80' },
    { id: 'islands',  emoji: '🏝️', name: 'Adalar Turu',        description: 'Saklı koyları ve el değmemiş adaları birlikte gezin',         count: 44, href: '/deneyimler', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80' },
    { id: 'yoga',     emoji: '🧘', name: 'Yoga Workshop',       description: 'Dalgaların ritmiyle deniz üzerinde beden ve zihin dengesi',   count: 24, href: '/deneyimler', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=500&q=80' },
    { id: 'fishing',  emoji: '🎣', name: 'Balıkçılık Dersi',    description: 'Sabah saatlerinde sessiz koyda geleneksel balıkçılık',        count: 29, href: '/deneyimler', image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=500&q=80' },
    { id: 'photo',    emoji: '📸', name: 'Fotoğraf Turu',       description: 'Deniz ve doğayı rehber eşliğinde fotoğraflayın',             count: 16, href: '/deneyimler', image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=500&q=80' },
    { id: 'chef',     emoji: '👨‍🍳', name: 'Şef ile Yemek',     description: 'Teknede şef eşliğinde taze deniz ürünleri deneyimi',         count: 11, href: '/deneyimler', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80' },
    { id: 'ceramic',  emoji: '🏺', name: 'Seramik Workshop',    description: 'Deniz ilhamıyla el sanatlarını öğrenin ve yaratın',           count: 18, href: '/deneyimler', image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=500&q=80' },
  ]
}

// ── Locations ────────────────────────────────────────────────
export function getRentalLocations(): Location[] {
  return [
    { id: 'bodrum',   name: 'Bodrum',   count: 128, countUnit: 'tekne',   href: '/listing', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80' },
    { id: 'marmaris', name: 'Marmaris', count: 94,  countUnit: 'tekne',   href: '/listing', image: 'https://images.unsplash.com/photo-1548514168-f14ddaa5fc70?auto=format&fit=crop&w=600&q=80' },
    { id: 'gocek',    name: 'Göcek',    count: 67,  countUnit: 'tekne',   href: '/listing', image: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=600&q=80' },
    { id: 'cesme',    name: 'Çeşme',    count: 54,  countUnit: 'tekne',   href: '/listing', image: 'https://images.unsplash.com/photo-1527824404775-dce343a93dc2?auto=format&fit=crop&w=600&q=80' },
  ]
}

export function getExperienceLocations(): Location[] {
  return [
    { id: 'bodrum-b', name: 'Bodrum Koyları', count: 42, countUnit: 'deneyim', href: '/listing', image: 'https://images.unsplash.com/photo-1540946491917-7897cdda40e4?auto=format&fit=crop&w=600&q=80' },
    { id: 'izmir',    name: 'İzmir Marina',   count: 31, countUnit: 'deneyim', href: '/listing', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
    { id: 'kas',      name: 'Kaş Cennet Koyu',count: 28, countUnit: 'deneyim', href: '/listing', image: 'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?auto=format&fit=crop&w=600&q=80' },
    { id: 'antalya',  name: 'Antalya Sahil',  count: 19, countUnit: 'deneyim', href: '/listing', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
  ]
}

// ── Ecosystem features ────────────────────────────────────────
export function getEcosystemFeatures(): EcosystemFeature[] {
  return [
    {
      id: 'ecosystem',
      icon: '🌊',
      colorClass: 'blue',
      title: 'Eksiksiz Deniz Ekosistemi',
      description: 'Yelkenliden lüks yata, günlük turdan haftalık kiralığa, yoga atölyesinden dalış kursuna kadar tüm deniz deneyimleri tek çatı altında.',
    },
    {
      id: 'safety',
      icon: '🛡️',
      colorClass: 'coral',
      title: 'Güvenle Kirala, Emin Ol',
      description: 'Lisanslı ve onaylı kaptanlar, sigortalı tekneler, gerçek kullanıcı değerlendirmeleri ve 7/24 aktif destek hattımızla her yolculuk tam güvende.',
    },
    {
      id: 'price',
      icon: '💎',
      colorClass: 'green',
      title: 'En İyi Fiyat + Cashback',
      description: 'Fiyat farkı iadesi garantisi ve özel cashback programımızla her kiralama sizi bir adım öne taşır. İlk kiralama %5, ikinci kiralama %15 geri kazanın.',
    },
  ]
}

// ── Trust features ────────────────────────────────────────────
export function getTrustFeatures(): TrustFeature[] {
  return [
    {
      id: 'captains',
      icon: '🧑‍✈️',
      colorClass: 'orange',
      title: 'Onaylı Kaptanlar',
      description: 'Tüm kaptanlarımız lisanslı, kimlik doğrulamalı ve deneyim geçmişleri kontrol edilmiş bireylerdir.',
    },
    {
      id: 'insurance',
      icon: '⚓',
      colorClass: 'blue',
      title: 'Sigortalı Tekneler',
      description: 'Platformumuzdaki tüm tekneler kapsamlı deniz sigortasına sahiptir. Olası durumlarda tam koruma altındasınız.',
    },
    {
      id: 'support',
      icon: '💬',
      colorClass: 'green',
      title: '7/24 Destek Hattı',
      description: 'Denizde veya karada, gece veya gündüz — uzman destek ekibimiz her an ulaşılabilir. Türkçe ve İngilizce hizmet.',
    },
    {
      id: 'protection',
      icon: '🛡️',
      colorClass: 'purple',
      title: 'Misafir Koruması',
      description: 'Son dakika iptallerinde tam iade garantisi. Güvenli ödeme ve kişisel verilerin şifreli koruması.',
    },
  ]
}

// ── Testimonials ──────────────────────────────────────────────
export function getTestimonials(): Testimonial[] {
  return [
    {
      id: 't1',
      rating: 5,
      text: 'Rezervasyonlarımız düzenli; müşteri erişimi ve dijital altyapı gerçekten işimizi kolaylaştırdı.',
      authorName: 'Ahmet Yıldız',
      authorRole: 'Genel Müdür',
      authorCompany: 'Mavi Rüzgar Yatçılık',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
    },
    {
      id: 't2',
      rating: 5,
      text: 'Deneyim turlarımızı listeledikten sonra doluluk belirgin şekilde arttı; entegrasyon sorunsuzdu.',
      authorName: 'Selin Çelik',
      authorRole: 'Kurucu Ortak',
      authorCompany: 'Ege Deniz Akademisi',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80',
    },
    {
      id: 't3',
      rating: 5,
      text: 'Görünürlük ve güven açısından denediğimiz platformların önünde; cashback de ilgi görüyor.',
      authorName: 'Mert Kaya',
      authorRole: 'Operasyon Direktörü',
      authorCompany: 'Bodrum Charter Group',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=80',
    },
    {
      id: 't4',
      rating: 5,
      text: 'Sigorta ve güvenlik tarafını entegre etmek kolay; tekne sahibi ve misafir güveni için doğru yer.',
      authorName: 'Deniz Arslan',
      authorRole: 'Satış & Pazarlama Müdürü',
      authorCompany: 'Türkiye Deniz Sigorta A.Ş.',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&q=80',
    },
    {
      id: 't5',
      rating: 5,
      text: 'Eğitim programlarımız SeaHub topluluğuyla buluşunca güçlü bir sinerji oluştu.',
      authorName: 'Özge Demir',
      authorRole: 'Eğitim Koordinatörü',
      authorCompany: 'Türk Yelken Federasyonu',
      authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80',
    },
    {
      id: 't6',
      rating: 5,
      text: 'Rezervasyon, iletişim ve ödeme tek yerde; ortaklık süreci hızlı ve profesyoneldi.',
      authorName: 'Tarık Bozkurt',
      authorRole: 'Filo Müdürü',
      authorCompany: 'Fethiye Blue Voyages',
      authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&q=80',
    },
  ]
}

// ── Blog categories ───────────────────────────────────────────
export function getBlogCategories(): BlogCategory[] {
  return [
    { id: 'all',       label: 'Tümü',              count: 24 },
    { id: 'rota',      label: '🗺️ Rota & Koy',     count: 7  },
    { id: 'rehber',    label: '📖 Kiralama Rehberi', count: 5  },
    { id: 'deneyim',   label: '🤿 Deneyim',          count: 4  },
    { id: 'teknik',    label: '⚙️ Hava & Teknik',   count: 4  },
    { id: 'yasam',     label: '🌊 Deniz Yaşamı',    count: 4  },
  ]
}

// ── Blog posts ────────────────────────────────────────────────
export function getBlogPosts(): BlogPost[] {
  return [
    {
      id: 'b1', slug: 'yelkenli-kiralama-ipuclari',
      tag: 'Kiralama Rehberi', categoryId: 'rehber', featured: true,
      title: 'İlk Kez Yelkenli Kiralayacaklar İçin 10 Altın İpucu',
      excerpt: 'Deneyimsiz olmanız sizi durduramaz. Doğru tekne, doğru kaptan ve bu ipuçlarıyla ilk deniz yolculuğunuz unutulmaz olacak.',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1400&q=85',
      date: '24 Nisan 2026', readTime: '5 dk okuma',
      href: '/blog/yelkenli-kiralama-ipuclari',
      author: { name: 'Zeynep Arslan', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', title: 'Deniz Editörü' },
    },
    {
      id: 'b2', slug: 'ege-gizli-koylar',
      tag: 'Rota', categoryId: 'rota', featured: false,
      title: 'Bodrum\'dan Göcek\'e: Ege\'nin 15 Gizli Koyu',
      excerpt: 'Turizm teknelerinin ulaşamadığı, kristal berraklığında sulara ev sahipliği yapan cennet koylarını derledik.',
      image: 'https://images.unsplash.com/photo-1540946491917-7897cdda40e4?auto=format&fit=crop&w=1400&q=85',
      date: '18 Nisan 2026', readTime: '8 dk okuma',
      href: '/blog/ege-gizli-koylar',
      author: { name: 'Burak Aydın', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=80&q=80', title: 'Rota Uzmanı' },
    },
    {
      id: 'b3', slug: 'kas-dalis',
      tag: 'Deneyim', categoryId: 'deneyim', featured: false,
      title: 'Kaş\'ta Dalış: Akdeniz\'in En İyi Dalış Noktaları',
      excerpt: 'Zengin su altı ekosistemi, antik kalıntılar ve görünürlüğü 30 metreyi bulan berrak sular — Kaş gerçekten bir dalış cenneti.',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=700&q=80',
      date: '10 Nisan 2026', readTime: '6 dk okuma',
      href: '/blog/kas-dalis',
      author: { name: 'Selin Demir', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', title: 'Dalış Rehberi' },
    },
    {
      id: 'b4', slug: 'mavi-yolculuk-rehberi',
      tag: 'Rota', categoryId: 'rota', featured: false,
      title: 'Klasik Mavi Yolculuk Rehberi: Nereden Başlamalı?',
      excerpt: 'Haftalar süren gulet yolculuklarının büyüsü nedir? Nerede başlayıp nerede bitmeli? Bütçe ve rota planlaması için kapsamlı rehber.',
      image: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=700&q=80',
      date: '7 Nisan 2026', readTime: '10 dk okuma',
      href: '/blog/mavi-yolculuk-rehberi',
      author: { name: 'Kaptan Mehmet', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80', title: 'Doğrulanmış Kaptan' },
    },
    {
      id: 'b5', slug: 'tekne-sigortasi',
      tag: 'Kiralama Rehberi', categoryId: 'rehber', featured: false,
      title: 'Tekne Kiralama Sigortası: Bilmeniz Gereken Her Şey',
      excerpt: 'Kiralama öncesi sigorta poliçesini nasıl okuyacağınızı, nelere dikkat edeceğinizi ve hasarda ne yapmanız gerektiğini anlattık.',
      image: 'https://images.unsplash.com/photo-1548514168-f14ddaa5fc70?auto=format&fit=crop&w=700&q=80',
      date: '2 Nisan 2026', readTime: '7 dk okuma',
      href: '/blog/tekne-sigortasi',
      author: { name: 'Zeynep Arslan', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', title: 'Deniz Editörü' },
    },
    {
      id: 'b6', slug: 'hava-durumu-okuma',
      tag: 'Hava & Teknik', categoryId: 'teknik', featured: false,
      title: 'Denizde Hava Durumunu Doğru Okumak: Temel Kavramlar',
      excerpt: 'Poyraz, lodos, meltem... Ege ve Akdeniz\'in rüzgar karakterlerini ve hava tahmin uygulamalarını nasıl kullanmanız gerektiğini öğrenin.',
      image: 'https://images.unsplash.com/photo-1520942702018-0862200e6873?auto=format&fit=crop&w=700&q=80',
      date: '28 Mart 2026', readTime: '9 dk okuma',
      href: '/blog/hava-durumu-okuma',
      author: { name: 'Kaptan Mehmet', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80', title: 'Doğrulanmış Kaptan' },
    },
    {
      id: 'b7', slug: 'tekne-uzerinde-yemek',
      tag: 'Deniz Yaşamı', categoryId: 'yasam', featured: false,
      title: 'Teknede Yemek Pişirme: Basit ve Lezzetli 10 Tarif',
      excerpt: 'Küçük bir mutfakta, deniz ortasında bile harika yemekler yapılabilir. İşte gemici aşçılarının favorisi tarifler.',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=80',
      date: '21 Mart 2026', readTime: '5 dk okuma',
      href: '/blog/tekne-uzerinde-yemek',
      author: { name: 'Ayşe Kaya', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80', title: 'Yaşam Yazarı' },
    },
    {
      id: 'b8', slug: 'cesme-rotasi',
      tag: 'Rota', categoryId: 'rota', featured: false,
      title: 'Çeşme Yarımadası: 5 Günlük Tekne Turu Rotası',
      excerpt: 'Sakız Adası karşısındaki bu büyüleyici yarımadanın en güzel koyları, köyleri ve deniz altı sırları için detaylı rota.',
      image: 'https://images.unsplash.com/photo-1527824404775-dce343a93dc2?auto=format&fit=crop&w=700&q=80',
      date: '15 Mart 2026', readTime: '8 dk okuma',
      href: '/blog/cesme-rotasi',
      author: { name: 'Burak Aydın', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=80&q=80', title: 'Rota Uzmanı' },
    },
    {
      id: 'b9', slug: 'yoga-tekne',
      tag: 'Deneyim', categoryId: 'deneyim', featured: false,
      title: 'Teknede Yoga: Zihin ile Denizi Birleştiren Yolculuk',
      excerpt: 'Sabah güneşinde, durgun bir koyda, teknenin güvertesinde yoga... Bu deneyimi yaşayanlar bir daha bırakmak istemiyor.',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=700&q=80',
      date: '8 Mart 2026', readTime: '4 dk okuma',
      href: '/blog/yoga-tekne',
      author: { name: 'Selin Demir', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', title: 'Dalış Rehberi' },
    },
  ]
}

// ── Full blog post (for detail page) ─────────────────────────
export function getBlogPostBySlug(slug: string): BlogPostFull | null {
  const posts = getBlogPosts()
  const meta  = posts.find(p => p.slug === slug)
  if (!meta) return null

  // Only the first post has rich content for the demo
  if (slug !== 'yelkenli-kiralama-ipuclari') {
    return {
      ...meta,
      tags: [meta.tag, 'Deniz', 'SeaHub'],
      relatedSlugs: posts.filter(p => p.slug !== slug).slice(0, 3).map(p => p.slug),
      content: [
        { type: 'paragraph', html: `<p>Bu yazı yakında yayınlanacak. <strong>SeaHub Blog</strong>'u takip etmeyi unutmayın.</p>` },
      ],
    }
  }

  return {
    ...meta,
    tags: ['Yelkenli', 'Kiralama Rehberi', 'İlk Kez', 'Kaptan', 'Bodrum'],
    relatedSlugs: ['ege-gizli-koylar', 'tekne-sigortasi', 'mavi-yolculuk-rehberi'],
    content: [
      {
        type: 'paragraph',
        html: `<p>Denizin çağrısına kapılan ama nereden başlayacağını bilmeyenler için bu rehber tam size göre. Yelkenli kiralamak göründüğünden çok daha kolay — tek yapmanız gereken doğru bilgilere sahip olmak. Yıllarca denizde geçirdiğimiz deneyimlerden süzülen bu 10 altın ipucu, ilk yolculuğunuzu hem güvenli hem de unutulmaz kılacak.</p>`,
      },
      {
        type: 'callout',
        icon: '💡',
        title: 'Bilmeden Önce',
        body: 'Türkiye\'de tekne kiralama için özel bir lisans gerekmez. Kaptan dahil kiralama (skippered charter) ile deneyimsiz gruplar da rahatlıkla çıkabilir.',
      },
      { type: 'heading', level: 2, text: '1. Grup Büyüklüğünüze Uygun Tekne Seçin' },
      {
        type: 'paragraph',
        html: `<p>Tekne seçiminde en sık yapılan hata, kapasiteyi zorlamaktır. Üretici maksimum kapasitesi 10 kişi yazan bir tekneye 10 kişi bindirirseniz konforsuz bir yolculuk geçirirsiniz. <strong>Genel kural:</strong> maksimum kapasitenin %70-80'ini hedefleyin. 8 kişilik grubunuz varsa en az 10 kişilik bir tekne arayın.</p><p>Kabin sayısına da dikkat edin: her çift için ayrı kabin olmasına özen gösterin. Katamaranlar geniş güverteleri ve stabiliteleriyle aileler için idealdir; yelkenliler ise daha otantik bir deneyim sunar.</p>`,
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=85',
        alt: 'Ege\'de seyir halinde bir yelkenli',
        caption: 'Ege\'nin turkuaz sularında yelken açmak için doğru tekne seçimi her şeyden önce gelir.',
      },
      { type: 'heading', level: 2, text: '2. Kaptanı Önceden Araştırın' },
      {
        type: 'paragraph',
        html: `<p>Kaptan, tatilinizdeki en kritik unsurdur. Tekneyi bilen, bölgeyi tanıyan ve misafirlerle iyi iletişim kuran bir kaptan sıradan bir tatili efsaneye dönüştürür. Kiralama öncesinde kaptanın <strong>değerlendirmelerini mutlaka okuyun</strong>, mümkünse bir ön görüşme yapın.</p><p>SeaHub platformunda tüm kaptanlar kimlik doğrulaması ve lisans kontrolünden geçmektedir. Profil sayfalarındaki yorumlar gerçek misafirlerden geliyor.</p>`,
      },
      {
        type: 'quote',
        text: 'İyi bir kaptan size yalnızca tekneyi değil, denizi tanıtır. Gizli koyları, en taze balığın çıktığı limanları ve güneşin en güzel battığı noktaları bilir.',
        attribution: 'Kaptan Mehmet Yılmaz — 15 yıllık denizci',
      },
      { type: 'heading', level: 2, text: '3. Rotayı Esnek Tutun' },
      {
        type: 'paragraph',
        html: `<p>Önceden çok katı bir rota planlamak yerine <strong>genel bir çerçeve</strong> belirleyin ve kaptanın önerilerine açık olun. Hava durumu, deniz koşulları ve beklenmedik güzellikler her gün rotayı değiştirebilir — bu değişkenlik aslında mavi yolculuğun en büyük sürprizlerinden biridir.</p>`,
      },
      { type: 'heading', level: 2, text: '4. Güneş Korumasını Abartın' },
      {
        type: 'paragraph',
        html: `<p>Denizde yansıma nedeniyle kara toprağına kıyasla UV maruziyeti %25-30 daha fazladır. <strong>SPF 50+ güneş kremi</strong>, şapka ve güneş gözlüğü zorunlu. Özellikle öğle saatlerinde gölgede kalmayı unutmayın. Denizde güneş çarpması ciddi bir sağlık riski oluşturabilir.</p>`,
      },
      {
        type: 'list',
        items: [
          'SPF 50+ su geçirmez güneş kremi (en az 2 adet, büyük boy)',
          'Geniş kenarlı şapka veya denizci şapkası',
          'UV korumalı polarize güneş gözlüğü',
          'Uzun kollu hafif UV koruyucu mayo/sörf kıyafeti',
          'Güneş kremi çubuğu (yüz ve dudak için)',
        ],
      },
      { type: 'heading', level: 2, text: '5. Deniz Tutmasına Hazırlıklı Olun' },
      {
        type: 'paragraph',
        html: `<p>İlk kez denize çıkıyorsanız deniz tutması ihtimalini göz ardı etmeyin. <strong>Çıkmadan 1-2 saat önce</strong> eczaneden alınabilecek deniz tutması ilaçlarını (Dramin, Bonine vb.) kullanabilirsiniz. Doğal yöntem olarak ufku izlemek, güverteye çıkmak ve zencefil şekeri tüketmek de yardımcı olur.</p>`,
      },
      {
        type: 'callout',
        icon: '⚓',
        title: 'Kaptana Sorun',
        body: 'Deniz tutma eğilimindeyseniz kaptana söyleyin. Dalgaya göre demir yeri seçimi ve rotayı yumuşak sularda tutma gibi önlemler alabiliriz.',
      },
      { type: 'heading', level: 2, text: '6. Bagajınızı Küçük Tutun' },
      {
        type: 'paragraph',
        html: `<p>Teknelerin depolama alanı sınırlıdır. Büyük bavullar yerine <strong>katlanabilir çantalar veya duffel bag</strong> tercih edin. İhtiyaçlarınızı gerçekçi bir şekilde değerlendirin; denizde ihtiyaç duyacağınız şeyler yerde taşıdıklarınızdan çok farklıdır.</p>`,
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
        alt: 'Berrak Ege suları',
        caption: 'Ege\'nin berrak ve turkuaz suları sizi bekliyor.',
      },
      { type: 'heading', level: 2, text: '7. Su Tüketimine Dikkat Edin' },
      {
        type: 'paragraph',
        html: `<p>Teknelerdeki tatlı su tankları sınırlıdır. <strong>Deniz suyu ile duş alınmaz</strong>, bu yüzden tatlı suyu tasarruflu kullanın. Kıyı bağlantılarında veya marinada su ikmali yapılabilir. İçme suyu olarak pet şişe tercih etmek daha pratiktir.</p>`,
      },
      { type: 'heading', level: 2, text: '8. Sigortayı Detaylı Okuyun' },
      {
        type: 'paragraph',
        html: `<p>Kiralama sözleşmesindeki sigorta kapsamını anlamadan imzalamayın. <strong>Hasar teminatı (damage deposit)</strong>, teknik arıza sorumluluğu, üçüncü şahıslara zarar ve kişisel kaza sigortası maddelerini mutlaka kontrol edin. Şüphe duyduğunuz maddeleri kiralamadan önce sorun.</p>`,
      },
      { type: 'heading', level: 2, text: '9. Marinayı Önceden Rezerve Edin' },
      {
        type: 'paragraph',
        html: `<p>Yaz aylarında popüler koylar ve marinalar dolup taşabilir. <strong>Gece demireceğiniz yerleri önceden planlayın</strong> ve mümkünse rezervasyon yapın. Marinalarda elektrik, su ve duş gibi imkanlardan yararlanabilirsiniz.</p>`,
      },
      { type: 'heading', level: 2, text: '10. Tekneye Alışmak İçin Zaman Tanıyın' },
      {
        type: 'paragraph',
        html: `<p>İlk saatler yeni çevre, yeni hisler ve yeni sorumluluklarla doludur. <strong>Paniğe kapılmayın, kaptana güvenin</strong> ve tekneye alışmak için kendinize zaman tanıyın. İkinci günden itibaren çoğu kişi denizi ikinci evi gibi hissediyorum diyor.</p><p>Son olarak: Deniz her şeyin üstündedir. Kurallara uyun, saygı gösterin ve bu büyüleyici ortamın tadını çıkarın. Bereketli denizler dileriz! 🌊⛵</p>`,
      },
      { type: 'divider' },
      {
        type: 'callout',
        icon: '⛵',
        title: 'Hazır mısınız?',
        body: 'SeaHub\'da 900\'den fazla tekne sizi bekliyor. Tarih ve lokasyon seçin, rüya yolculuğunuzu planlayın.',
      },
    ],
  }
}

export { getForumCategories, getForumThreads } from './forumData'
