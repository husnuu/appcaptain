export interface CaptainBoat {
  id: string
  slug: string
  name: string
  type: string
  image: string
  location: string
  lengthM: number
  guests: number
  pricePerNight: number
  rating: number
}

export interface CaptainReview {
  id: string
  authorName: string
  authorAvatar: string
  date: string
  rating: number
  tripLabel: string
  text: string
}

export interface Captain {
  id: string
  slug: string
  name: string
  title: string
  avatar: string
  coverImage: string
  basePort: string
  region: string
  languages: string[]
  yearsExperience: number
  tripCount: number
  rating: number
  reviewCount: number
  verified: boolean
  superCaptain: boolean
  specialties: string[]
  bio: string
  license: string
  boats: CaptainBoat[]
  reviews: CaptainReview[]
}

export const CAPTAINS: Captain[] = [
  {
    id: 'c1',
    slug: 'mehmet-yilmaz',
    name: 'Kaptan Mehmet Yılmaz',
    title: 'Yelkenli & gulet uzmanı',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    basePort: 'Bodrum',
    region: 'Ege',
    languages: ['Türkçe', 'İngilizce'],
    yearsExperience: 18,
    tripCount: 840,
    rating: 4.97,
    reviewCount: 186,
    verified: true,
    superCaptain: true,
    specialties: ['Yelkenli', 'Gulet', 'Aile turları', 'Gün batımı rotaları'],
    bio: 'Ege ve Yunan adalarında 18 yıldır kaptanlık yapıyorum. Misafirlerime gizli koyları, en taze balığı ve güvenli demir yerlerini göstermeyi severim. Hava durumuna göre rotayı birlikte planlarız.',
    license: 'Uluslararası Yat Kaptanı (Y1) · İlk yardım sertifikalı',
    boats: [
      {
        id: 'b1',
        slug: 'bavaria-45-bodrum',
        name: 'Bavaria 45 Cruiser',
        type: 'Yelkenli',
        image:
          'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80',
        location: 'Bodrum',
        lengthM: 14,
        guests: 8,
        pricePerNight: 28500,
        rating: 4.96,
      },
      {
        id: 'b2',
        slug: 'gulet-alev-bodrum',
        name: 'Gulet Alev',
        type: 'Gulet',
        image:
          'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&w=800&q=80',
        location: 'Bodrum',
        lengthM: 24,
        guests: 12,
        pricePerNight: 52000,
        rating: 4.94,
      },
    ],
    reviews: [
      {
        id: 'r1',
        authorName: 'Ayşe & Can K.',
        authorAvatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
        date: 'Mart 2026',
        rating: 5,
        tripLabel: '7 gece Bodrum — Datça',
        text: 'Mehmet Bey hem denizi hem bölgeyi çok iyi biliyor. Çocuklarımız için güvenli koylar seçti, akşam yemekleri için liman önerileri harikaydı.',
      },
      {
        id: 'r2',
        authorName: 'Thomas M.',
        authorAvatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
        date: 'Şubat 2026',
        rating: 5,
        tripLabel: '5 gece mavi tur',
        text: 'Professional, calm and flexible with the route. Best hidden bays we have seen in the Aegean.',
      },
      {
        id: 'r3',
        authorName: 'Selin D.',
        authorAvatar:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
        date: 'Ocak 2026',
        rating: 5,
        tripLabel: '3 gece gün batımı turu',
        text: 'İlk yelkenli deneyimimizdi, her adımı anlattı. Tekne tertemiz, iletişim çok hızlıydı.',
      },
    ],
  },
  {
    id: 'c2',
    slug: 'elif-kara',
    name: 'Kaptan Elif Kara',
    title: 'Katamaran & aile gezileri',
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=1200&q=80',
    basePort: 'Göcek',
    region: 'Ege',
    languages: ['Türkçe', 'İngilizce', 'Almanca'],
    yearsExperience: 12,
    tripCount: 520,
    rating: 4.95,
    reviewCount: 124,
    verified: true,
    superCaptain: true,
    specialties: ['Katamaran', 'Çocuklu aileler', 'Dalış durakları'],
    bio: 'Göcek ve Fethiye körfezinde katamaran kaptanlığı yapıyorum. Geniş güverteler aileler ve ilk kez denize çıkan gruplar için ideal. Dalış ve şnorkel molalarını rotaya dahil ederim.',
    license: 'Yat Kaptanı · Ticari denizci belgesi',
    boats: [
      {
        id: 'b3',
        slug: 'lagoon-42-gocek',
        name: 'Lagoon 42',
        type: 'Katamaran',
        image:
          'https://images.unsplash.com/photo-1593351415075-3bac9f45c877?auto=format&fit=crop&w=800&q=80',
        location: 'Göcek',
        lengthM: 12,
        guests: 10,
        pricePerNight: 34800,
        rating: 4.93,
      },
      {
        id: 'b4',
        slug: 'fountaine-pajot-gocek',
        name: 'Fountaine Pajot Lucia 40',
        type: 'Katamaran',
        image:
          'https://images.unsplash.com/photo-1530939027401-cca9e7ef4f58?auto=format&fit=crop&w=800&q=80',
        location: 'Göcek',
        lengthM: 12,
        guests: 8,
        pricePerNight: 31200,
        rating: 4.91,
      },
    ],
    reviews: [
      {
        id: 'r4',
        authorName: 'Familie Weber',
        authorAvatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
        date: 'Mart 2026',
        rating: 5,
        tripLabel: '10 gün Göcek',
        text: 'Perfekt für Familien mit Kindern. Ruhige Ankerplätze und sehr geduldige Einweisung.',
      },
      {
        id: 'r5',
        authorName: 'Burak A.',
        authorAvatar:
          'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=80&q=80',
        date: 'Şubat 2026',
        rating: 5,
        tripLabel: '4 gece Fethiye',
        text: 'Katamaran konforu ve Elif Hanım\'ın rota önerileri mükemmeldi. Tekrar rezervasyon yapacağız.',
      },
    ],
  },
  {
    id: 'c3',
    slug: 'onur-demir',
    name: 'Kaptan Onur Demir',
    title: 'Motor yat & lüks charter',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1200&q=80',
    basePort: 'Marmaris',
    region: 'Ege',
    languages: ['Türkçe', 'İngilizce', 'Rusça'],
    yearsExperience: 15,
    tripCount: 610,
    rating: 4.92,
    reviewCount: 98,
    verified: true,
    superCaptain: false,
    specialties: ['Motor yat', 'VIP servis', 'Gece limanları'],
    bio: 'Marmaris ve Fethiye çıkışlı motor yat turlarında uzmanım. Mürettebat koordinasyonu, özel yemek ve transfer organizasyonunu tek elden yönetirim.',
    license: 'Kıyı Emniyeti · Y2 kaptan belgesi',
    boats: [
      {
        id: 'b5',
        slug: 'azimut-55-marmaris',
        name: 'Azimut 55 Fly',
        type: 'Motor yat',
        image:
          'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&w=800&q=80',
        location: 'Marmaris',
        lengthM: 17,
        guests: 10,
        pricePerNight: 78000,
        rating: 4.9,
      },
    ],
    reviews: [
      {
        id: 'r6',
        authorName: 'Marina L.',
        authorAvatar:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80',
        date: 'Mart 2026',
        rating: 5,
        tripLabel: '3 gece Marmaris',
        text: 'Lüks ve sorunsuz bir hafta sonu. Onur Bey tüm detayları önceden planladı.',
      },
      {
        id: 'r7',
        authorName: 'Emre T.',
        authorAvatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
        date: 'Ocak 2026',
        rating: 4,
        tripLabel: '2 gece özel tur',
        text: 'Tekne çok konforluydu. Hava yüzünden rota kısaldı ama kaptan sürekli bilgilendirdi.',
      },
    ],
  },
  {
    id: 'c4',
    slug: 'zeynep-arslan',
    name: 'Kaptan Zeynep Arslan',
    title: 'Yelken eğitimi & bareboat destek',
    avatar:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1200&q=80',
    basePort: 'Kaş',
    region: 'Akdeniz',
    languages: ['Türkçe', 'İngilizce'],
    yearsExperience: 10,
    tripCount: 380,
    rating: 4.98,
    reviewCount: 72,
    verified: true,
    superCaptain: true,
    specialties: ['Yelkenli', 'Eğitim', 'Kekova', 'Dalış'],
    bio: 'Kaş ve Kekova bölgesinde yelkenli kaptanlık ve yeni başlayanlara güvenli deniz eğitimi veriyorum. Bareboat kiralayan misafirlere briefing ve rota desteği sağlıyorum.',
    license: 'Yelken antrenörü · Y1 kaptan',
    boats: [
      {
        id: 'b6',
        slug: 'jeanneau-349-kas',
        name: 'Jeanneau Sun Odyssey 349',
        type: 'Yelkenli',
        image:
          'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=800&q=80',
        location: 'Kaş',
        lengthM: 10,
        guests: 6,
        pricePerNight: 19800,
        rating: 4.97,
      },
      {
        id: 'b7',
        slug: 'beneteau-46-kas',
        name: 'Beneteau Oceanis 46',
        type: 'Yelkenli',
        image:
          'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80',
        location: 'Kaş',
        lengthM: 14,
        guests: 8,
        pricePerNight: 26500,
        rating: 4.95,
      },
    ],
    reviews: [
      {
        id: 'r8',
        authorName: 'Özgür Y.',
        authorAvatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
        date: 'Şubat 2026',
        rating: 5,
        tripLabel: 'Kekova 5 gün',
        text: 'Kekova rotası için en iyi kaptanlardan biri. Sabırlı anlatım, harika fotoğraf molaları.',
      },
    ],
  },
  {
    id: 'c5',
    slug: 'hakan-ceylan',
    name: 'Kaptan Hakan Ceylan',
    title: 'Gulet & mavi yolculuk',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&w=1200&q=80',
    basePort: 'Fethiye',
    region: 'Akdeniz',
    languages: ['Türkçe'],
    yearsExperience: 22,
    tripCount: 1100,
    rating: 4.96,
    reviewCount: 210,
    verified: true,
    superCaptain: true,
    specialties: ['Gulet', 'Mavi yolculuk', 'Yerel mutfak'],
    bio: 'Fethiye ve Göcek çıkışlı klasik mavi yolculukların vazgeçilmez rotalarını bilirim. Aşçı ve mürettebatla uyumlu çalışır, misafirleri evinde hissettiririm.',
    license: 'Gulet kaptanı · 22 yıl ticari deneyim',
    boats: [
      {
        id: 'b8',
        slug: 'gulet-efe-fethiye',
        name: 'Gulet Efe',
        type: 'Gulet',
        image:
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
        location: 'Fethiye',
        lengthM: 28,
        guests: 14,
        pricePerNight: 61000,
        rating: 4.96,
      },
      {
        id: 'b9',
        slug: 'gulet-ruzgar-fethiye',
        name: 'Gulet Rüzgar',
        type: 'Gulet',
        image:
          'https://images.unsplash.com/photo-1593351415075-3bac9f45c877?auto=format&fit=crop&w=800&q=80',
        location: 'Fethiye',
        lengthM: 26,
        guests: 12,
        pricePerNight: 55000,
        rating: 4.94,
      },
    ],
    reviews: [
      {
        id: 'r9',
        authorName: 'Deniz & Melis',
        authorAvatar:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
        date: 'Mart 2026',
        rating: 5,
        tripLabel: '8 gece mavi tur',
        text: 'Gulet deneyiminin tam hakkını verdik. Yemekler, koylar, sohbet — her şey kusursuzdu.',
      },
      {
        id: 'r10',
        authorName: 'Klaus H.',
        authorAvatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
        date: 'Aralık 2025',
        rating: 5,
        tripLabel: '6 gece Göcek',
        text: 'Authentic Turkish coast experience. Highly recommend Captain Hakan.',
      },
    ],
  },
  {
    id: 'c6',
    slug: 'seda-nur',
    name: 'Kaptan Seda Nur',
    title: 'Sürat teknesi & günübirlik',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=1200&q=80',
    basePort: 'Çeşme',
    region: 'Ege',
    languages: ['Türkçe', 'İngilizce'],
    yearsExperience: 8,
    tripCount: 290,
    rating: 4.89,
    reviewCount: 56,
    verified: true,
    superCaptain: false,
    specialties: ['Sürat teknesi', 'Günübirlik', 'Sakız adası'],
    bio: 'Çeşme ve Alaçatı çıkışlı günübirlik ve hafta sonu turları düzenliyorum. Hızlı tekne seven gruplar için ideal rotalar ve güvenli sürüş önceliğim.',
    license: 'Amatör denizci · Kıyı yapı işletme',
    boats: [
      {
        id: 'b10',
        slug: 'axopar-37-cesme',
        name: 'Axopar 37 Sun-Top',
        type: 'Sürat teknesi',
        image:
          'https://images.unsplash.com/photo-1530939027401-cca9e7ef4f58?auto=format&fit=crop&w=800&q=80',
        location: 'Çeşme',
        lengthM: 11,
        guests: 8,
        pricePerNight: 22000,
        rating: 4.88,
      },
    ],
    reviews: [
      {
        id: 'r11',
        authorName: 'Pınar K.',
        authorAvatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
        date: 'Mart 2026',
        rating: 5,
        tripLabel: 'Günübirlik Sakız',
        text: 'Çok eğlenceli ve güvenli bir gün. Seda Hanım her detayı düşünmüş.',
      },
    ],
  },
]

export const CAPTAIN_REGIONS = ['Tümü', 'Ege', 'Akdeniz'] as const

export function getCaptainBySlug(slug: string): Captain | undefined {
  return CAPTAINS.find(c => c.slug === slug)
}

export function getAllCaptainSlugs(): string[] {
  return CAPTAINS.map(c => c.slug)
}
