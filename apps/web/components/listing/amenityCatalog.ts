import { AMENITY_ICONS, DEFAULT_AMENITY_ICON, type FeatureIcon } from './featureIcons'

/** Olanak anahtarı → Türkçe ad. İkonlar featureIcons.tsx içinde. Katalog: packages/database/seeds. */
export const AMENITIES: Record<string, { label: string }> = {
  air_conditioning: { label: 'Klima' },
  bbq: { label: 'Barbekü' },
  coffee_machine: { label: 'Kahve makinesi' },
  cooker: { label: 'Ocak' },
  dishwasher: { label: 'Bulaşık makinesi' },
  freezer: { label: 'Dondurucu' },
  fridge: { label: 'Buzdolabı' },
  heating_isinma_webasto: { label: 'Isıtma (Webasto)' },
  ice_maker: { label: 'Buz makinesi' },
  kitchen_utensils: { label: 'Mutfak gereçleri' },
  microwave: { label: 'Mikrodalga' },
  outside_shower: { label: 'Dış duş' },
  oven: { label: 'Fırın' },
  shower: { label: 'Duş' },
  towels: { label: 'Havlular' },
  usb_socket: { label: 'USB priz' },
  wi_fi: { label: 'Wi-Fi' },
  fans: { label: 'Vantilatör' },
  water_maker: { label: 'Su yapıcı' },
  audio_system_hoparlor: { label: 'Ses sistemi' },
  sprayhood: { label: 'Sprayhood' },
  lazy_bag: { label: 'Lazy bag' },
  hair_dryer: { label: 'Saç kurutma makinesi' },
  cockpit_cushion: { label: 'Kokpit minderi' },
  teak_cockpit: { label: 'Tik kokpit' },
  cockpit_table: { label: 'Kokpit masası' },
  usb_aux_connection: { label: 'USB/AUX bağlantısı' },
  usb_mp3: { label: 'USB MP3 çalar' },
  bar: { label: 'Bar' },
  tv: { label: 'Televizyon' },
  autopilot: { label: 'Otopilot' },
  bimini: { label: 'Bimini (güneşlik)' },
  bow_thruster: { label: 'Baş pervanesi' },
  dinghy: { label: 'Bot (dinghy)' },
  dinghy_s_motor: { label: 'Bot motoru' },
  electric_winches: { label: 'Elektrikli vinçler' },
  flybridge: { label: 'Flybridge' },
  generator: { label: 'Jeneratör' },
  inverter: { label: 'İnverter' },
  outside_gps_plotter: { label: 'Dış GPS plotter' },
  radar: { label: 'Radar' },
  solar_panels: { label: 'Güneş panelleri' },
  teak_deck: { label: 'Tik güverte' },
  '220v_power_outlet': { label: '220V priz' },
  gps: { label: 'GPS' },
  sun_deck: { label: 'Güneşlenme güvertesi' },
  vhf: { label: 'VHF telsiz' },
  depth_sounder: { label: 'İskandil' },
  bathing_ladder: { label: 'Yüzme merdiveni' },
  guides_and_maps: { label: 'Rehber ve haritalar' },
  hot_water: { label: 'Sıcak su' },
  swim_platform: { label: 'Yüzme platformu' },
  life_jackets: { label: 'Can yelekleri' },
  life_belts: { label: 'Can simidi' },
  safety_lines: { label: 'Emniyet halatları' },
  life_raft: { label: 'Can salı' },
  signal_flags: { label: 'İşaret bayrakları' },
  epirb_emergency_position_indicating_radio_beacons: { label: 'EPIRB acil durum vericisi' },
  first_aid_kit: { label: 'İlk yardım çantası' },
}

export const AMENITY_CATEGORIES: Record<string, string> = {
  kitchen_equipment: 'Mutfak',
  interior_equipment: 'İç mekân',
  deck: 'Güverte',
  navigation: 'Navigasyon',
  entertainment: 'Eğlence',
  security: 'Güvenlik',
  safety: 'Güvenlik',
  other_amenities: 'Diğer',
}

const CATEGORY_ORDER = ['interior_equipment', 'kitchen_equipment', 'deck', 'entertainment', 'navigation', 'security', 'safety', 'other_amenities']

export interface AmenityItem {
  key: string
  label: string
  icon: FeatureIcon
  isExtra: boolean
  price: string | null
}

export interface AmenityGroup {
  key: string
  title: string
  items: AmenityItem[]
}

interface RawAmenity {
  key: string
  label: string
  category: string
  isIncluded: boolean
  isExtra: boolean
  extraPrice: number | null
  currency: string | null
}

export function groupAmenities(raw: RawAmenity[]): AmenityGroup[] {
  const groups = new globalThis.Map<string, AmenityItem[]>()
  for (const a of raw) {
    if (!a.isIncluded && !a.isExtra) continue
    const meta = AMENITIES[a.key]
    const item: AmenityItem = {
      key: a.key,
      label: meta?.label ?? a.label,
      icon: AMENITY_ICONS[a.key] ?? DEFAULT_AMENITY_ICON,
      isExtra: a.isExtra,
      price:
        a.isExtra && a.extraPrice != null
          ? `+${a.extraPrice.toLocaleString('tr-TR')} ${a.currency === 'TRY' ? '₺' : a.currency === 'EUR' ? '€' : (a.currency ?? '')}`.trim()
          : null,
    }
    const list = groups.get(a.category) ?? []
    list.push(item)
    groups.set(a.category, list)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (CATEGORY_ORDER.indexOf(a) + 99) % 99 - (CATEGORY_ORDER.indexOf(b) + 99) % 99)
    .map(([key, items]) => ({
      key,
      title: AMENITY_CATEGORIES[key] ?? key.replace(/_/g, ' '),
      items: items.sort((x, y) => Number(x.isExtra) - Number(y.isExtra)),
    }))
}
