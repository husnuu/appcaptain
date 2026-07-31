// ============================================================
// Content types — designed to map directly to Sanity schemas
// TODO: When Sanity is connected, these interfaces will match
//       the GROQ query return shapes from sanity/lib/queries.ts
// ============================================================

export interface BoatType {
  id: string
  emoji: string
  name: string
  description?: string
  count: number
  image: string
  href: string
}

export interface Experience {
  id: string
  emoji: string
  name: string
  description?: string
  count: number
  image: string
  href: string
}

export interface Location {
  id: string
  name: string
  count: number
  countUnit: 'tekne' | 'deneyim'
  image: string
  href: string
}

export interface Testimonial {
  id: string
  rating: number
  text: string
  authorName: string
  authorRole: string
  authorCompany: string
  authorAvatar: string
  logoUrl?: string
}

export interface BlogPost {
  id: string
  slug: string
  tag: string
  categoryId: string
  title: string
  excerpt: string
  image: string
  date: string
  readTime: string
  href: string
  featured?: boolean
  author: {
    name: string
    avatar: string
    title: string
  }
}

export interface BlogCategory {
  id: string
  label: string
  count: number
}

// Full post for detail page (TODO: comes from Sanity Portable Text)
export interface BlogPostFull extends BlogPost {
  content: BlogSection[]
  relatedSlugs: string[]
  tags: string[]
}

export type BlogSection =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; html: string }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'callout'; icon: string; title: string; body: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'list'; items: string[] }
  | { type: 'divider' }

export interface EcosystemFeature {
  id: string
  icon: string
  /** Opsiyonel görsel (Sanity); varsa emoji yerine gösterilir */
  image?: string
  colorClass: 'blue' | 'coral' | 'green'
  title: string
  description: string
}

export interface TrustFeature {
  id: string
  icon: string
  image?: string
  colorClass: 'orange' | 'blue' | 'green' | 'purple'
  title: string
  description: string
}

/** Harita sağı — özellik satırı (görsel solda, metin sağda) */
export type MapFeatureDecoration = 'blue' | 'peach' | 'mint'

export interface MapPromoFeature {
  id: string
  title: string
  description: string
  image: string
  href: string
  linkLabel: string
  /** Dekoratif arka plan lekesi rengi */
  decoration: MapFeatureDecoration
}

export interface MapSectionContent {
  title: string
  rentalSubtitle: string
  experienceSubtitle: string
  rentalFeatures: MapPromoFeature[]
  experienceFeatures: MapPromoFeature[]
}

// ── Forum types ───────────────────────────────────────────────
export interface ForumCategory {
  id: string
  colorClass: string
  title: string
  description: string
  threadCount: number
  postCount: number
  lastThread: {
    title: string
    author: string
    date: string
  }
}

export interface ForumThread {
  id: string
  categoryId: string
  categoryLabel: string
  categoryColor: string
  title: string
  excerpt: string
  author: ForumAuthor
  createdAt: string
  replyCount: number
  viewCount: number
  likeCount: number
  isPinned: boolean
  isHot: boolean
  tags: string[]
  lastReply: {
    author: string
    avatar: string
    date: string
  }
}

/** Ana sayfa — harita altı tam genişlik “Keşfet” bannerı (`homePage.discoverBanner`) */
export interface DiscoverBannerContent {
  enabled: boolean
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  backgroundImageUrl: string
}

export interface ForumAuthor {
  name: string
  avatar: string
  postCount: number
  joinYear: number
  badge: string | null
  location: string
}

export interface ForumPost {
  id: string
  threadId: string
  author: ForumAuthor
  content: string
  createdAt: string
  likeCount: number
  isAccepted: boolean
}
