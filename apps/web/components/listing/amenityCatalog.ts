import {
  AirVent,
  Anchor,
  ArrowDownToLine,
  ArrowLeftRight,
  Armchair,
  BatteryCharging,
  BookOpen,
  BriefcaseMedical,
  Cable,
  Coffee,
  Cog,
  CookingPot,
  Droplets,
  Fan,
  Flag,
  Flame,
  GlassWater,
  Heater,
  Layers,
  LifeBuoy,
  Link2,
  LocateFixed,
  Map,
  Martini,
  Microwave,
  Music,
  Navigation2,
  PanelTop,
  PlugZap,
  Radar,
  Radio,
  RadioTower,
  RefreshCw,
  Refrigerator,
  Rows3,
  Sailboat,
  Ship,
  Shirt,
  ShowerHead,
  Snowflake,
  Sofa,
  Speaker,
  Sun,
  SunMedium,
  Tent,
  ThermometerSun,
  TrainTrack,
  Tv,
  Umbrella,
  Usb,
  Utensils,
  UtensilsCrossed,
  WashingMachine,
  Waves,
  Wifi,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/** Olanak anahtarı → ikon + Türkçe ad. Katalog: packages/database/seeds (amenities bölümü). */
export const AMENITIES: Record<string, { icon: LucideIcon; label: string }> = {
  air_conditioning: { icon: AirVent, label: 'Klima' },
  bbq: { icon: Flame, label: 'Barbekü' },
  coffee_machine: { icon: Coffee, label: 'Kahve makinesi' },
  cooker: { icon: CookingPot, label: 'Ocak' },
  dishwasher: { icon: WashingMachine, label: 'Bulaşık makinesi' },
  freezer: { icon: Snowflake, label: 'Dondurucu' },
  fridge: { icon: Refrigerator, label: 'Buzdolabı' },
  heating_isinma_webasto: { icon: Heater, label: 'Isıtma (Webasto)' },
  ice_maker: { icon: GlassWater, label: 'Buz makinesi' },
  kitchen_utensils: { icon: UtensilsCrossed, label: 'Mutfak gereçleri' },
  microwave: { icon: Microwave, label: 'Mikrodalga' },
  outside_shower: { icon: ShowerHead, label: 'Dış duş' },
  oven: { icon: Flame, label: 'Fırın' },
  shower: { icon: ShowerHead, label: 'Duş' },
  towels: { icon: Layers, label: 'Havlular' },
  usb_socket: { icon: Usb, label: 'USB priz' },
  wi_fi: { icon: Wifi, label: 'Wi-Fi' },
  fans: { icon: Fan, label: 'Vantilatör' },
  water_maker: { icon: Droplets, label: 'Su yapıcı' },
  audio_system_hoparlor: { icon: Speaker, label: 'Ses sistemi' },
  sprayhood: { icon: Tent, label: 'Sprayhood' },
  lazy_bag: { icon: Sailboat, label: 'Lazy bag' },
  hair_dryer: { icon: Wind, label: 'Saç kurutma makinesi' },
  cockpit_cushion: { icon: Sofa, label: 'Kokpit minderi' },
  teak_cockpit: { icon: Armchair, label: 'Tik kokpit' },
  cockpit_table: { icon: Utensils, label: 'Kokpit masası' },
  usb_aux_connection: { icon: Cable, label: 'USB/AUX bağlantısı' },
  usb_mp3: { icon: Music, label: 'USB MP3 çalar' },
  bar: { icon: Martini, label: 'Bar' },
  tv: { icon: Tv, label: 'Televizyon' },
  autopilot: { icon: Navigation2, label: 'Otopilot' },
  bimini: { icon: Umbrella, label: 'Bimini (güneşlik)' },
  bow_thruster: { icon: ArrowLeftRight, label: 'Baş pervanesi' },
  dinghy: { icon: Ship, label: 'Bot (dinghy)' },
  dinghy_s_motor: { icon: Cog, label: 'Bot motoru' },
  electric_winches: { icon: RefreshCw, label: 'Elektrikli vinçler' },
  flybridge: { icon: PanelTop, label: 'Flybridge' },
  generator: { icon: Zap, label: 'Jeneratör' },
  inverter: { icon: BatteryCharging, label: 'İnverter' },
  outside_gps_plotter: { icon: Map, label: 'Dış GPS plotter' },
  radar: { icon: Radar, label: 'Radar' },
  solar_panels: { icon: Sun, label: 'Güneş panelleri' },
  teak_deck: { icon: Rows3, label: 'Tik güverte' },
  '220v_power_outlet': { icon: PlugZap, label: '220V priz' },
  gps: { icon: LocateFixed, label: 'GPS' },
  sun_deck: { icon: SunMedium, label: 'Güneşlenme güvertesi' },
  vhf: { icon: Radio, label: 'VHF telsiz' },
  depth_sounder: { icon: ArrowDownToLine, label: 'İskandil' },
  bathing_ladder: { icon: TrainTrack, label: 'Yüzme merdiveni' },
  guides_and_maps: { icon: BookOpen, label: 'Rehber ve haritalar' },
  hot_water: { icon: ThermometerSun, label: 'Sıcak su' },
  swim_platform: { icon: Waves, label: 'Yüzme platformu' },
  life_jackets: { icon: Shirt, label: 'Can yelekleri' },
  life_belts: { icon: LifeBuoy, label: 'Can simidi' },
  safety_lines: { icon: Link2, label: 'Emniyet halatları' },
  life_raft: { icon: Tent, label: 'Can salı' },
  signal_flags: { icon: Flag, label: 'İşaret bayrakları' },
  epirb_emergency_position_indicating_radio_beacons: { icon: RadioTower, label: 'EPIRB acil durum vericisi' },
  first_aid_kit: { icon: BriefcaseMedical, label: 'İlk yardım çantası' },
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
  icon: LucideIcon
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
      icon: meta?.icon ?? Anchor,
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
