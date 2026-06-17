export type EditBoatTabId =
  | "features"
  | "amenities"
  | "location"
  | "description"
  | "images"
  | "documents";

export interface EditBoatTabDef {
  id: EditBoatTabId;
  label: string;
  /** Tab-specific hint shown in the right panel. */
  tip: { title: string; description: string };
}

export interface EditBoatFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  options?: { value: string; label: string }[];
  unit?: string;
  placeholder?: string;
  /**
   * NOTE: In production `required` is derived from the shared Zod schema
   * (packages/shared). Kept here only because this screen runs on mock data.
   */
  required?: boolean;
}

export const EDIT_BOAT_TABS: EditBoatTabDef[] = [
  {
    id: "features",
    label: "Features",
    tip: {
      title: "Entering Boat Features",
      description:
        "Teknenin teknik özelliklerini eksiksiz gir. Zorunlu alanlar (Boat Type, Brand, Model, Boat Name) doldurulmadan ilan yayınlanamaz.",
    },
  },
  {
    id: "amenities",
    label: "Amenities",
    tip: {
      title: "Donanım & Ekstralar",
      description: "Misafirlerin teknede bulacağı donanımları işaretle; ekstra ücretli olanları belirt.",
    },
  },
  {
    id: "location",
    label: "Location",
    tip: {
      title: "Konum Bilgisi",
      description: "Teknenin bağlı olduğu liman ve şehir bilgisini doğru gir; arama sonuçlarını etkiler.",
    },
  },
  {
    id: "description",
    label: "Description",
    tip: {
      title: "Açıklama & Kurallar",
      description: "İlan başlığı ve açıklaması misafirin ilk izlenimidir; net ve çekici yaz.",
    },
  },
  {
    id: "images",
    label: "Images",
    tip: {
      title: "Fotoğraflar",
      description: "En az 1 kapak fotoğrafı gerekir. Yüksek çözünürlüklü, aydınlık kareler tercih et.",
    },
  },
  {
    id: "documents",
    label: "Documents",
    tip: {
      title: "Belgeler",
      description: "Zorunlu belgeleri yükle; onay sürecinde admin tarafından incelenecek.",
    },
  },
];

/** Features tab — dense technical detail grid (2 columns). */
export const featureFields: EditBoatFieldDef[] = [
  {
    key: "boatType",
    label: "Boat Type",
    type: "select",
    required: true,
    options: [
      { value: "motoryacht", label: "Motoryacht" },
      { value: "sailboat", label: "Sailboat" },
      { value: "catamaran", label: "Catamaran" },
      { value: "gulet", label: "Gulet" },
    ],
  },
  { key: "brand", label: "Brand", type: "text", required: true, placeholder: "Azimut" },
  { key: "model", label: "Model", type: "text", required: true, placeholder: "55" },
  { key: "boatName", label: "Boat Name", type: "text", required: true, placeholder: "Blue Horizon" },
  { key: "boatLength", label: "Boat Length", type: "number", unit: "m" },
  {
    key: "flag",
    label: "Flag",
    type: "select",
    options: [
      { value: "TR", label: "Türkiye" },
      { value: "GR", label: "Greece" },
      { value: "IT", label: "Italy" },
    ],
  },
  {
    key: "boatMaterial",
    label: "Boat Material",
    type: "select",
    options: [
      { value: "fiberglass", label: "Fiberglass" },
      { value: "wood", label: "Wood" },
      { value: "steel", label: "Steel" },
      { value: "aluminium", label: "Aluminium" },
    ],
  },
  { key: "numberOfRudders", label: "Number of Rudders", type: "number" },
  { key: "saloonHeight", label: "Saloon Height", type: "number", unit: "m" },
  { key: "saloonWidth", label: "Saloon Width", type: "number", unit: "m" },
  { key: "yearOfConstruction", label: "Year of Construction", type: "number", placeholder: "2018" },
  { key: "yearOfRefit", label: "Year of Refit", type: "number", placeholder: "2022" },
  { key: "dailyAcUsage", label: "Daily AC Usage", type: "number", unit: "h" },
  { key: "draft", label: "Draft", type: "number", unit: "m" },
  { key: "beam", label: "Beam", type: "number", unit: "m" },
  { key: "waterTankCapacity", label: "Water Tank Capacity", type: "number", unit: "L" },
  { key: "wasteTankCapacity", label: "Waste Tank Capacity", type: "number", unit: "L" },
];

export const locationFields: EditBoatFieldDef[] = [
  { key: "country", label: "Country", type: "text", required: true, placeholder: "Türkiye" },
  { key: "city", label: "City", type: "text", required: true, placeholder: "Muğla" },
  { key: "marina", label: "Marina / Port", type: "text", placeholder: "D-Marin Göcek" },
  { key: "latitude", label: "Latitude", type: "number", placeholder: "36.75" },
  { key: "longitude", label: "Longitude", type: "number", placeholder: "28.94" },
];

export const descriptionFields: EditBoatFieldDef[] = [
  { key: "title", label: "Listing Title", type: "text", required: true, placeholder: "Lüks Motoryat — Göcek" },
  { key: "summary", label: "Short Summary", type: "text", placeholder: "Tek cümlelik özet" },
  { key: "description", label: "Description", type: "textarea", required: true },
  { key: "rules", label: "Boat Rules", type: "textarea" },
];

export interface EditBoatData {
  id: string;
  name: string;
  values: Record<string, string>;
  /** Tabs already completed (drives the Listing Score). */
  completedTabs: EditBoatTabId[];
}

export const editBoatMock: EditBoatData = {
  id: "mock",
  name: "Blue Horizon",
  values: {
    boatType: "motoryacht",
    brand: "Azimut",
    model: "55",
    boatName: "Blue Horizon",
    boatLength: "16.7",
    flag: "TR",
    boatMaterial: "fiberglass",
    yearOfConstruction: "2018",
    title: "Lüks Motoryat — Göcek",
    description: "Göcek koylarında konforlu bir gün için ideal motoryat.",
  },
  completedTabs: ["description"],
};
