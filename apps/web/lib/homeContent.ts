import {
  getBoatTypes,
  getExperiences,
  getRentalLocations,
  getExperienceLocations,
  getEcosystemFeatures,
  getTrustFeatures,
  getTestimonials,
  getBlogPosts,
} from "./data";
import { DEFAULT_HERO, type HeroContent } from "./content/heroDefaults";
import type {
  BlogPost,
  BoatType,
  DiscoverBannerContent,
  EcosystemFeature,
  Experience,
  Location,
  MapSectionContent,
  Testimonial,
  TrustFeature,
} from "../types/content";

/**
 * Static homepage marketing content — no CMS involved. This is generic site
 * copy (ecosystem pitch, trust badges, testimonials, map promo blurbs), not
 * per-listing boat/experience data, so it's fine to keep as fixed content
 * until an actual CMS/admin-managed source replaces it.
 */
export interface HomePageContent {
  hero: HeroContent;
  ecosystem: { title: string; subtitle: string; features: EcosystemFeature[] };
  trustHeader: { title: string; subtitle: string };
  boatTypes: BoatType[];
  experiences: Experience[];
  rentalLocations: Location[];
  experienceLocations: Location[];
  mapSection: MapSectionContent;
  discoverBanner: DiscoverBannerContent;
  trustFeatures: TrustFeature[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
}

const DEFAULT_ECOSYSTEM_HEADER = {
  title: "Denizin Her Şeyi Bir Arada",
  subtitle: "Türkiye'nin ilk bütünleşik deniz platformu",
};

const DEFAULT_TRUST_HEADER = {
  title: "SeaHub Güven Programı",
  subtitle: "Her adımda yanınızdayız — rezervasyondan limana kadar",
};

const IMG_MAP_RENTAL_1 =
  "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=600&q=80";
const IMG_MAP_RENTAL_2 =
  "https://images.unsplash.com/photo-1548514168-f14ddaa5fc70?auto=format&fit=crop&w=600&q=80";
const IMG_MAP_EXP_1 =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80";
const IMG_MAP_EXP_2 =
  "https://images.unsplash.com/photo-1540946491917-7897cdda40e4?auto=format&fit=crop&w=600&q=80";

export const DEFAULT_DISCOVER_BANNER: DiscoverBannerContent = {
  enabled: true,
  title: "Bodrum",
  subtitle: "Ege kıyılarının en gözde rotalarından birini keşfedin",
  ctaLabel: "KEŞFET",
  ctaHref: "/tekne-kiralama",
  backgroundImageUrl:
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1920&q=85",
};

export const DEFAULT_MAP_SECTION: MapSectionContent = {
  title: "Seyahatinizi haritadan planlayın",
  rentalSubtitle: "Haritadaki konumlara tıklayın, mevcut tekneleri keşfedin",
  experienceSubtitle: "Deneyim noktalarına tıklayın, aktiviteleri keşfedin",
  rentalFeatures: [
    {
      id: "map-rental-1",
      title: "Rota haritasından tekne bulun",
      description:
        "Ege ve Akdeniz kıyılarında popüler limanlardan tekne seçin. Haritadaki ikonlara tıklayın, mevcut tekneleri anında görün.",
      image: IMG_MAP_RENTAL_1,
      href: "/tekne-kiralama",
      linkLabel: "Haritada ara",
      decoration: "blue",
    },
    {
      id: "map-rental-2",
      title: "Hızlı ve güvenli rezervasyon",
      description:
        "Tek hesapla tüm rezervasyonlarınızı yönetin. Kaptanınızla mesajlaşın, e-biletinizi indirin, ödemenizi güvenle yapın.",
      image: IMG_MAP_RENTAL_2,
      href: "/",
      linkLabel: "Hemen üye ol",
      decoration: "peach",
    },
  ],
  experienceFeatures: [
    {
      id: "map-exp-1",
      title: "Haritadan deneyim seçin",
      description:
        "Dalış, yoga, gün batımı turu ve daha fazlası — Türkiye kıyılarındaki deneyim noktalarını haritada keşfedin.",
      image: IMG_MAP_EXP_1,
      href: "/deneyimler",
      linkLabel: "Deneyimlere bak",
      decoration: "blue",
    },
    {
      id: "map-exp-2",
      title: "Rehber eşliğinde aktiviteler",
      description:
        "Sertifikalı rehberler ve yerel uzmanlarla unutulmaz anlar yaşayın. Her deneyim güvenlik standartlarına uygun.",
      image: IMG_MAP_EXP_2,
      href: "/deneyimler",
      linkLabel: "Aktiviteleri incele",
      decoration: "mint",
    },
  ],
};

export function getHomePageContent(): HomePageContent {
  return {
    hero: DEFAULT_HERO,
    ecosystem: { ...DEFAULT_ECOSYSTEM_HEADER, features: getEcosystemFeatures() },
    trustHeader: DEFAULT_TRUST_HEADER,
    boatTypes: getBoatTypes(),
    experiences: getExperiences(),
    rentalLocations: getRentalLocations(),
    experienceLocations: getExperienceLocations(),
    mapSection: DEFAULT_MAP_SECTION,
    discoverBanner: DEFAULT_DISCOVER_BANNER,
    trustFeatures: getTrustFeatures(),
    testimonials: getTestimonials(),
    blogPosts: getBlogPosts().slice(0, 4),
  };
}
