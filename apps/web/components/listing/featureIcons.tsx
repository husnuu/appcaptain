/**
 * Tekne olanakları ve teknik özellikler için ikon eşlemesi.
 *
 * Kaynaklar: lucide-react ve @tabler/icons-react (ikisi de 24px çizgi ikon).
 * İki kütüphanede de doğru karşılığı olmayan nesneler (bulaşık makinesi, fırın,
 * havlu, can salı, sprayhood …) aynı çizgi stilinde özel SVG olarak çizildi.
 */

import type { ComponentType, ReactNode } from 'react'
import {
  Bath,
  BedDouble,
  BedSingle,
  Cable,
  Calendar,
  Fan,
  Fuel,
  Gauge,
  Heater,
  Layers,
  Ruler,
  ShipWheel,
  ShowerHead,
  Sofa,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import {
  IconAirConditioning,
  IconAnchor,
  IconArrowBarToDown,
  IconArrowsHorizontal,
  IconBarrel,
  IconBatteryCharging,
  IconBed,
  IconBolt,
  IconBook,
  IconBucketDroplet,
  IconCoffee,
  IconDesk,
  IconDeviceSpeaker,
  IconDeviceTv,
  IconDropletCog,
  IconDroplet,
  IconEngine,
  IconFirstAidKit,
  IconFlag3,
  IconFridge,
  IconGasStation,
  IconGlassCocktail,
  IconGps,
  IconGrill,
  IconLadder,
  IconLifebuoy,
  IconLink,
  IconMap2,
  IconMicrowave,
  IconMusic,
  IconOutlet,
  IconPillow,
  IconPropeller,
  IconRadar,
  IconRadio,
  IconSnowflake,
  IconSolarPanel,
  IconSos,
  IconSpeedboat,
  IconSunHigh,
  IconSwimming,
  IconToiletPaper,
  IconToolsKitchen2,
  IconUsb,
  IconUserStar,
  IconUsersGroup,
  IconWifi,
} from '@tabler/icons-react'

export interface FeatureIconProps {
  size?: number
  strokeWidth?: number
  className?: string
}
export type FeatureIcon = ComponentType<FeatureIconProps>

/** Tüm Tabler ikonları aynı forwardRef tipindedir. */
type TablerComponent = typeof IconAnchor

/** Tabler ikonunu lucide ile aynı API'ye (size + strokeWidth) uyarlar. */
function tb(Icon: TablerComponent, name: string): FeatureIcon {
  const C = ({ size = 24, strokeWidth = 1.5, className }: FeatureIconProps) => (
    <Icon size={size} stroke={strokeWidth} className={className} aria-hidden="true" />
  )
  C.displayName = name
  return C
}

function lc(Icon: LucideIcon, name: string): FeatureIcon {
  const C = ({ size = 24, strokeWidth = 1.5, className }: FeatureIconProps) => (
    <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />
  )
  C.displayName = name
  return C
}

/** Kütüphanelerde olmayan nesneler için aynı çizgi stilinde özel ikon. */
function custom(paths: ReactNode, name: string): FeatureIcon {
  const C = ({ size = 24, strokeWidth = 1.5, className }: FeatureIconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  )
  C.displayName = name
  return C
}

const dot = (cx: number, cy: number) => <circle cx={cx} cy={cy} r={0.75} fill="currentColor" stroke="none" />

/* ---------------- özel ikonlar ---------------- */

const Dishwasher = custom(
  <>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M4 7.5h16" />
    {dot(7.5, 5.25)}
    {dot(10, 5.25)}
    <path d="M14 5.25h3" />
    <path d="M7.5 13c1-.8 2-.8 3 0s2 .8 3 0 2-.8 3 0" />
    <path d="M7.5 16.5c1-.8 2-.8 3 0s2 .8 3 0 2-.8 3 0" />
  </>,
  'Dishwasher',
)

const Oven = custom(
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
    <path d="M3.5 8.5h17" />
    {dot(7, 6)}
    {dot(10, 6)}
    {dot(13, 6)}
    <rect x="6.5" y="11" width="11" height="6.5" rx="1" />
    <path d="M9 13.5h6" />
  </>,
  'Oven',
)

const Towel = custom(
  <>
    <path d="M3.5 5h17" />
    <path d="M7 5v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V5" />
    <path d="M7 14h10" />
    <path d="M10 5v6" />
  </>,
  'Towel',
)

const HairDryer = custom(
  <>
    <circle cx="9.5" cy="9" r="5.5" />
    <circle cx="9.5" cy="9" r="2" />
    <path d="M14.4 6.5H20a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-5.6" />
    <path d="M8.3 14.3 9 20.5h2.6l.4-6.4" />
  </>,
  'HairDryer',
)

const HotWater = custom(
  <>
    <path d="M12 21a6 6 0 0 0 6-6c0-3.5-6-11-6-11S6 11.5 6 15a6 6 0 0 0 6 6z" />
    <path d="M10.6 18c-.6-.7-.6-1.5 0-2.2s.6-1.5 0-2.2" />
    <path d="M13.4 18c-.6-.7-.6-1.5 0-2.2s.6-1.5 0-2.2" />
  </>,
  'HotWater',
)

const IceMaker = custom(
  <>
    <rect x="3.5" y="10.5" width="8" height="8" rx="1.5" transform="rotate(-10 7.5 14.5)" />
    <rect x="12.5" y="6" width="8" height="8" rx="1.5" transform="rotate(12 16.5 10)" />
    <path d="M6 13.4l1.4-1.2" />
    <path d="M15.2 8.6l1.5-.9" />
  </>,
  'IceMaker',
)

const LifeJacket = custom(
  <>
    <path d="M8.5 3 5 5v15a1 1 0 0 0 1 1h5V8.5" />
    <path d="M15.5 3 19 5v15a1 1 0 0 1-1 1h-5V8.5" />
    <path d="M8.5 3c.4 2.5 1.8 5.5 3.5 5.5s3.1-3 3.5-5.5" />
    <path d="M5 13h6M13 13h6M5 17h6M13 17h6" />
  </>,
  'LifeJacket',
)

const LifeRaft = custom(
  <>
    <path d="M3 14.5c0-1.4 4-2.6 9-2.6s9 1.2 9 2.6-4 2.6-9 2.6-9-1.2-9-2.6z" />
    <path d="M5.8 12.6C6.6 8.3 9 6 12 6s5.4 2.3 6.2 6.6" />
    <path d="M12 6V4" />
    <path d="M10.5 12.2v-1.6a1.5 1.5 0 0 1 3 0v1.6" />
    <path d="M3 20.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
  </>,
  'LifeRaft',
)

const Cooktop = custom(
  <>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <circle cx="8.5" cy="9.5" r="2.2" />
    <circle cx="15.5" cy="9.5" r="2.2" />
    <circle cx="8.5" cy="15.5" r="1.6" />
    <circle cx="15.5" cy="15.5" r="1.6" />
  </>,
  'Cooktop',
)

const TeakPlanks = custom(
  <>
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="M3 8.5h18M3 12h18M3 15.5h18" />
    <path d="M6 6.75c1.2-.5 2.4-.5 3.6 0M13.5 10.25c1.2-.5 2.4-.5 3.6 0M7.5 13.75c1.2-.5 2.4-.5 3.6 0M14 17.25c1.2-.5 2.4-.5 3.6 0" />
  </>,
  'TeakPlanks',
)

const Sprayhood = custom(
  <>
    <path d="M2.5 18h19" />
    <path d="M4.5 18c.8-6.4 3.8-10 7.5-10s6.7 3.6 7.5 10" />
    <path d="M8 13.5c1.2-1.7 2.5-2.5 4-2.5s2.8.8 4 2.5" />
  </>,
  'Sprayhood',
)

const Bimini = custom(
  <>
    <path d="M3 8.5C6 6 9 5 12 5s6 1 9 3.5z" />
    <path d="M6 7.4V19M18 7.4V19" />
    <path d="M2.5 19h19" />
  </>,
  'Bimini',
)

const Winch = custom(
  <>
    <circle cx="11" cy="13.5" r="7" />
    <circle cx="11" cy="13.5" r="3.2" />
    <path d="M13.3 11.2 18.6 5.9" />
    <circle cx="19.6" cy="4.9" r="1.4" />
  </>,
  'Winch',
)

const DepthSounder = custom(
  <>
    <path d="M3 5.5h18l-2.5 4h-13z" />
    <path d="M12 9.5V12" />
    <path d="M8.5 15a5 5 0 0 0 7 0" />
    <path d="M6 18a8.5 8.5 0 0 0 12 0" />
  </>,
  'DepthSounder',
)

const Flybridge = custom(
  <>
    <path d="M2 15.5h20l-2.6 4H5.2z" />
    <path d="M5 15.5V12h11l3 3.5" />
    <path d="M8 12V9h6l1.5 3" />
    <path d="M7 7.5h8" />
    <path d="M7.5 13.75h2M11.5 13.75h2" />
  </>,
  'Flybridge',
)

const BunkBed = custom(
  <>
    <path d="M4 3v18M20 3v18" />
    <path d="M4 9.5h16M4 17.5h16" />
    <path d="M6.5 9.5V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
    <path d="M6.5 17.5V16a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
  </>,
  'BunkBed',
)

const LazyBag = custom(
  <>
    <path d="M6 3v18" />
    <path d="M6 16h15" />
    <path d="M6.5 16v-4.5c4.6-.6 9.6.8 14.5 4.5" />
    <path d="M9.5 13.4h1M12.8 13.2h1M16 13.9h1" />
  </>,
  'LazyBag',
)

/* ---------------- olanaklar ---------------- */

export const AMENITY_ICONS: Record<string, FeatureIcon> = {
  // İç mekân
  air_conditioning: tb(IconAirConditioning, 'AirConditioning'),
  heating_isinma_webasto: lc(Heater, 'Heater'),
  shower: lc(ShowerHead, 'Shower'),
  towels: Towel,
  usb_socket: tb(IconUsb, 'Usb'),
  fans: lc(Fan, 'Fan'),
  tv: tb(IconDeviceTv, 'Tv'),
  hot_water: HotWater,
  // Mutfak
  bbq: tb(IconGrill, 'Grill'),
  coffee_machine: tb(IconCoffee, 'Coffee'),
  cooker: Cooktop,
  dishwasher: Dishwasher,
  freezer: tb(IconSnowflake, 'Freezer'),
  fridge: tb(IconFridge, 'Fridge'),
  ice_maker: IceMaker,
  kitchen_utensils: tb(IconToolsKitchen2, 'KitchenUtensils'),
  microwave: tb(IconMicrowave, 'Microwave'),
  oven: Oven,
  water_maker: tb(IconDropletCog, 'WaterMaker'),
  bar: tb(IconGlassCocktail, 'Bar'),
  // Diğer
  outside_shower: lc(ShowerHead, 'OutsideShower'),
  wi_fi: tb(IconWifi, 'Wifi'),
  hair_dryer: HairDryer,
  dinghy_s_motor: tb(IconEngine, 'DinghyMotor'),
  // Eğlence
  audio_system_hoparlor: tb(IconDeviceSpeaker, 'Speaker'),
  sprayhood: Sprayhood,
  usb_aux_connection: lc(Cable, 'UsbAux'),
  usb_mp3: tb(IconMusic, 'Mp3'),
  // Güverte
  lazy_bag: LazyBag,
  cockpit_cushion: tb(IconPillow, 'Cushion'),
  teak_cockpit: TeakPlanks,
  cockpit_table: tb(IconDesk, 'CockpitTable'),
  teak_deck: TeakPlanks,
  '220v_power_outlet': tb(IconOutlet, 'PowerOutlet'),
  sun_deck: tb(IconSunHigh, 'SunDeck'),
  bathing_ladder: tb(IconLadder, 'Ladder'),
  swim_platform: tb(IconSwimming, 'SwimPlatform'),
  // Navigasyon
  autopilot: lc(ShipWheel, 'Autopilot'),
  bimini: Bimini,
  bow_thruster: tb(IconPropeller, 'BowThruster'),
  dinghy: tb(IconSpeedboat, 'Dinghy'),
  electric_winches: Winch,
  flybridge: Flybridge,
  generator: tb(IconBolt, 'Generator'),
  inverter: tb(IconBatteryCharging, 'Inverter'),
  outside_gps_plotter: tb(IconMap2, 'Plotter'),
  radar: tb(IconRadar, 'Radar'),
  solar_panels: tb(IconSolarPanel, 'SolarPanel'),
  gps: tb(IconGps, 'Gps'),
  vhf: tb(IconRadio, 'Vhf'),
  depth_sounder: DepthSounder,
  guides_and_maps: tb(IconBook, 'Guides'),
  // Güvenlik
  life_jackets: LifeJacket,
  life_belts: tb(IconLifebuoy, 'Lifebuoy'),
  safety_lines: tb(IconLink, 'SafetyLines'),
  life_raft: LifeRaft,
  signal_flags: tb(IconFlag3, 'SignalFlags'),
  epirb_emergency_position_indicating_radio_beacons: tb(IconSos, 'Epirb'),
  first_aid_kit: tb(IconFirstAidKit, 'FirstAid'),
}

/* ---------------- teknik özellikler ---------------- */

export const SPEC_ICONS: Record<string, FeatureIcon> = {
  year_of_manufacture: lc(Calendar, 'Year'),
  year_of_refit: lc(Wrench, 'Refit'),
  length_ft_m: lc(Ruler, 'Length'),
  beam_width: tb(IconArrowsHorizontal, 'Beam'),
  draft: tb(IconArrowBarToDown, 'Draft'),
  water_tank_capacity: tb(IconDroplet, 'WaterTank'),
  waste_tank_capacity: tb(IconBucketDroplet, 'WasteTank'),
  hull_material: lc(Layers, 'Hull'),
  number_of_engines: tb(IconEngine, 'Engines'),
  total_engine_power_hp: tb(IconBolt, 'EnginePower'),
  engine_type_brand: tb(IconEngine, 'EngineBrand'),
  fuel_type: tb(IconGasStation, 'FuelType'),
  fuel_tank_capacity: tb(IconBarrel, 'FuelTank'),
  fuel_consumption: lc(Fuel, 'FuelConsumption'),
  max_speed: lc(Gauge, 'MaxSpeed'),
  capacity: lc(Users, 'Capacity'),
  number_of_crew_members: tb(IconUsersGroup, 'Crew'),
  crew_members_included_in_the_price: tb(IconUserStar, 'CrewIncluded'),
  number_of_cabins_for_customer_without_crew: lc(BedDouble, 'Cabins'),
  master_cabin: tb(IconBed, 'MasterCabin'),
  single_cabin: lc(BedSingle, 'SingleCabin'),
  double_cabin: lc(BedDouble, 'DoubleCabin'),
  double_cabin_bunk_beds: BunkBed,
  beds_in_saloon: lc(Sofa, 'SaloonBeds'),
  maximum_sleeps_berths: tb(IconBed, 'Berths'),
  total_toilets_just_for_customers: tb(IconToiletPaper, 'Toilets'),
  shared_bathrooms: lc(Bath, 'SharedBathrooms'),
  electric_toilets: tb(IconToiletPaper, 'ElectricToilets'),
}

export const DEFAULT_AMENITY_ICON: FeatureIcon = tb(IconAnchor, 'Amenity')
export const DEFAULT_SPEC_ICON: FeatureIcon = tb(IconAnchor, 'Spec')

/** Teknik özellik grupları (popup'ta başlıklar altında listelenir). */
export const SPEC_GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Tekne', keys: ['year_of_manufacture', 'year_of_refit', 'length_ft_m', 'beam_width', 'draft', 'hull_material'] },
  {
    title: 'Motor ve yakıt',
    keys: ['number_of_engines', 'total_engine_power_hp', 'engine_type_brand', 'max_speed', 'fuel_type', 'fuel_tank_capacity', 'fuel_consumption'],
  },
  { title: 'Su ve atık tankı', keys: ['water_tank_capacity', 'waste_tank_capacity'] },
  {
    title: 'Kabinler ve yataklar',
    keys: ['master_cabin', 'double_cabin', 'single_cabin', 'double_cabin_bunk_beds', 'beds_in_saloon', 'maximum_sleeps_berths'],
  },
  { title: 'Banyolar', keys: ['shared_bathrooms', 'electric_toilets'] },
  { title: 'Mürettebat', keys: ['number_of_crew_members', 'crew_members_included_in_the_price'] },
]
