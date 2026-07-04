/** Konum adımında gösterilen alanlar (tek kaynak: BoatFeatureValue). */
export const LOCATION_FIELD_KEYS = [
  "country",
  "region",
  "city",
  "marina",
  "latitude",
  "longitude",
  "address",
] as const;
export type LocationFieldKey = (typeof LOCATION_FIELD_KEYS)[number];

/** Harita picker ile doldurulan gizli koordinat alanları. */
export const LOCATION_COORDINATE_KEYS = ["latitude", "longitude", "address"] as const;

/** Konum adımında manuel formda gösterilen alanlar. */
export const LOCATION_FORM_FIELD_KEYS = [
  "country",
  "region",
  "city",
  "marina",
] as const;

/** Motor alt sekmesindeki teknik alanlar. */
export const ENGINE_FIELD_KEYS = [
  "total_engine_power_hp",
  "number_of_engines",
  "fuel_tank_capacity",
  "fuel_consumption",
  "engine_type_brand",
  "fuel_type",
  "max_speed",
] as const;

/** Kabin sekmesinde en üstte gösterilen mürettebat alanı. */
export const CREW_TAB_FIELD_KEYS = ["number_of_crew_members"] as const;

export const FEATURE_CABIN_SECTIONS = ["cabins", "bathrooms", "crew"] as const;

/** Tekne kimliği sekmesindeki alanlar (tip, marka, model). */
export const IDENTITY_FIELD_KEYS = ["boatTypeKey", "manufacturer_brand", "model"] as const;

export type FeatureSubTabId = "identity" | "specs" | "engine" | "cabins";

export const FEATURE_SUB_TABS: { id: FeatureSubTabId; label: string }[] = [
  { id: "identity", label: "Tekne Kimliği" },
  { id: "specs", label: "Tekne Özellikleri" },
  { id: "engine", label: "Motor" },
  { id: "cabins", label: "Kabin + Tuvalet" },
];

export function isLocationFieldKey(key: string): key is LocationFieldKey {
  return (LOCATION_FIELD_KEYS as readonly string[]).includes(key);
}

export function classifyFeatureSubTab(key: string, groupKey: string): FeatureSubTabId {
  if ((IDENTITY_FIELD_KEYS as readonly string[]).includes(key)) return "identity";
  if ((CREW_TAB_FIELD_KEYS as readonly string[]).includes(key)) return "cabins";
  if ((ENGINE_FIELD_KEYS as readonly string[]).includes(key)) return "engine";
  if ((FEATURE_CABIN_SECTIONS as readonly string[]).includes(groupKey)) return "cabins";
  return "specs";
}
