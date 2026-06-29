import { PRICING_FIELD_LABELS } from "./pricing-fields";

/** Captain Özellikler adımı — Türkçe etiketler ve alan davranışı. */

export const HIDDEN_FEATURE_FIELD_KEYS = new Set([
  "boat_type_sailboat_motor_gulet_etc",
  "manufacturer_brand",
  "model",
]);

export const CREW_FIELD_KEY = "number_of_crew_members";

export const FUEL_TYPE_FIELD_KEY = "fuel_type";

export const FUEL_TYPE_OPTIONS = [
  { value: "DIESEL", label: "Dizel" },
  { value: "GASOLINE", label: "Benzin" },
  { value: "ELECTRIC", label: "Elektrikli" },
  { value: "HYBRID", label: "Hibrit" },
] as const;

/** Sayısal giriş bekleyen teknik alanlar (Tekne Özellikleri sekmesi). */
export const NUMERIC_SPEC_FIELD_KEYS = new Set([
  "capacity",
  "year_of_manufacture",
  "year_of_refit",
  "length_ft_m",
  "beam_width",
  "draft",
  "water_tank_capacity",
  "waste_tank_capacity",
]);

export const NUMERIC_CABIN_FIELD_KEYS = new Set([
  "number_of_cabins_for_customer_without_crew",
  "master_cabin",
  "single_cabin",
  "double_cabin",
  "double_cabin_bunk_beds",
  "beds_in_saloon",
  "maximum_sleeps_berths",
  "total_toilets_just_for_customers",
  "shared_bathrooms",
  "electric_toilets",
  CREW_FIELD_KEY,
  "crew_members_included_in_the_price",
]);

export const FEATURE_FIELD_LABELS: Record<string, string> = {
  boat_name: "Tekne Adı",
  capacity: "Yolcu Kapasitesi (kişi)",
  year_of_manufacture: "Üretim Yılı",
  year_of_refit: "Son Yenileme/Refit Yılı",
  length_ft_m: "Tekne Boyu (metre)",
  beam_width: "Genişlik (Beam)",
  draft: "Su Çekimi (Draft)",
  water_tank_capacity: "Su Tankı Kapasitesi",
  waste_tank_capacity: "Atık Su Tankı Kapasitesi",
  hull_material: "Gövde Malzemesi",
  number_of_engines: "Motor Sayısı",
  total_engine_power_hp: "Toplam Motor Gücü (HP)",
  fuel_tank_capacity: "Yakıt Tankı Kapasitesi",
  fuel_consumption: "Yakıt Tüketimi",
  engine_type_brand: "Motor Markası",
  fuel_type: "Yakıt Tipi",
  [CREW_FIELD_KEY]: "Toplam Mürettebat Sayısı",
  max_speed: "Maksimum Hız",
  number_of_cabins_for_customer_without_crew: "Misafir Kabin Sayısı (Mürettebat Hariç)",
  master_cabin: "Ana Kabin (Master Cabin)",
  single_cabin: "Tek Kişilik Kabin",
  double_cabin: "Çift Kişilik Kabin",
  double_cabin_bunk_beds: "Çift Kişilik Kabin (Ranza)",
  beds_in_saloon: "Salonda Yatak",
  maximum_sleeps_berths: "Maksimum Yatak Kapasitesi",
  total_toilets_just_for_customers: "Misafirlere Özel Tuvalet Sayısı",
  shared_bathrooms: "Paylaşımlı Banyo Sayısı",
  electric_toilets: "Elektrikli Tuvalet Sayısı",
  crew_members_included_in_the_price: "Fiyata Dahil Mürettebat Sayısı",
  country: "Ülke",
  region: "Bölge",
  city: "Şehir",
  marina: "Marina / Liman",
  latitude: "Enlem",
  longitude: "Boylam",
  address: "Adres",
};

export const FEATURE_GROUP_LABELS: Record<string, string> = {
  boat_identity_and_specifications: "Tekne Kimliği ve Teknik Özellikler",
  cabins: "Kabinler",
  bathrooms: "Banyolar",
  crew: "Mürettebat",
};

export function isHiddenFeatureField(key: string): boolean {
  return HIDDEN_FEATURE_FIELD_KEYS.has(key);
}

export function getFeatureFieldLabel(field: { key: string; label: string }): string {
  return (
    FEATURE_FIELD_LABELS[field.key] ??
    PRICING_FIELD_LABELS[field.key] ??
    field.label
  );
}

export function getFeatureGroupLabel(groupKey: string, fallback: string): string {
  return FEATURE_GROUP_LABELS[groupKey] ?? fallback;
}

export const SPECS_NUMERIC_HINT =
  "Bu alanlara sayısal değer girin (örn. 12, 2018, 9.5).";

export const CABINS_OPTIONAL_HINT =
  "Konaklamalı pakette kabin ve banyo alanları zorunludur. Saatlik pakette opsiyoneldir.";

export const CABINS_REQUIRED_HINT =
  "Kabin ve banyo alanlarını doldur. Kiralama paketine göre bazı alanlar zorunludur.";
