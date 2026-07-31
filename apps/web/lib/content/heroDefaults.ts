/** İstemci bileşenlerinin Sanity/sunucu modülünü çekmemesi için varsayılan hero verisi (sunucudan bağımsız). */

export interface HeroContent {
  backgroundImageUrl: string
  eyebrow: string
  titleLine1: string
  titleLine2: string
  subtitle: string
  rentalTabLabel: string
  experienceTabLabel: string
}

export const DEFAULT_HERO: HeroContent = {
  backgroundImageUrl:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
  eyebrow: "Türkiye'nin Deniz Platformu",
  titleLine1: 'Denizi Hissetmenin',
  titleLine2: 'Tam Zamanı',
  subtitle: 'Yelkenliden lüks yata, dalış turundan gün batımı deneyimine',
  rentalTabLabel: 'Kiralama',
  experienceTabLabel: 'Deneyim',
}
