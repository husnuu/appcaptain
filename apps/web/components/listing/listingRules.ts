import { INCLUDED_FEE_FIELD_GROUPS, readIncludedFeePair } from '@getyourboat/shared'
import {
  CalendarDays,
  Fuel,
  Hourglass,
  Snowflake,
  type LucideIcon,
} from 'lucide-react'

type Rules = Record<string, unknown>

const str = (v: unknown) => (v == null ? '' : String(v).trim())

/** "12" → "12:00", "9:30" → "09:30"; diğer serbest metinler olduğu gibi kalır. */
export function formatTime(v: string): string {
  if (/^\d{1,2}$/.test(v)) return `${v.padStart(2, '0')}:00`
  const m = v.match(/^(\d{1,2})[:.](\d{2})$/)
  return m ? `${m[1]!.padStart(2, '0')}:${m[2]}` : v
}

export interface Schedule {
  title: string
  checkIn: string | null
  checkOut: string | null
}

export interface Condition {
  icon: LucideIcon
  label: string
  value: string
}

export interface Fee {
  label: string
  value: string | null
}

export interface HouseRule {
  label: string
  allowed: boolean
  note?: string
}

const FEE_LABELS: Record<string, string> = {
  mooring_fees_included: 'Liman ücreti',
  final_cleaning_included: 'Final temizliği',
  transit_log_included: 'Transit log',
}

export function buildRules(raw: Rules | null | undefined, contactForFuelCost: boolean, fuelCostNote: string | null) {
  const r = raw ?? {}

  const schedules: Schedule[] = []
  const ci = str(r.check_in)
  const co = str(r.check_out)
  if (ci || co) schedules.push({ title: 'Konaklamalı / haftalık kiralama', checkIn: ci ? formatTime(ci) : null, checkOut: co ? formatTime(co) : null })
  const dci = str(r.check_in_time_day_rental)
  const dco = str(r.check_out_time_day_rental)
  if (dci || dco) schedules.push({ title: 'Günlük kiralama', checkIn: dci ? formatTime(dci) : null, checkOut: dco ? formatTime(dco) : null })

  const conditions: Condition[] = []
  if (str(r.min_rental_duration)) conditions.push({ icon: Hourglass, label: 'Minimum kiralama', value: str(r.min_rental_duration) })
  if (str(r.weekly_check_in_out_day)) conditions.push({ icon: CalendarDays, label: 'Haftalık teslim günü', value: str(r.weekly_check_in_out_day) })
  if (str(r.daily_a_c_usage)) conditions.push({ icon: Snowflake, label: 'Günlük klima kullanımı', value: str(r.daily_a_c_usage).replace(/^0+(\d)/, '$1') })
  if (contactForFuelCost) conditions.push({ icon: Fuel, label: 'Yakıt', value: 'Kaptanla netleştirilir' })
  else if (fuelCostNote) conditions.push({ icon: Fuel, label: 'Yakıt tüketimi', value: fuelCostNote })

  const included: Fee[] = []
  const extras: Fee[] = []
  for (const g of INCLUDED_FEE_FIELD_GROUPS) {
    const { mode, fee } = readIncludedFeePair(r as Record<string, string | boolean>, g.includedKey, g.notIncludedKey)
    const label = FEE_LABELS[g.includedKey] ?? g.label
    if (mode === 'included') included.push({ label, value: null })
    else if (mode === 'not_included') extras.push({ label, value: fee.trim() || null })
  }

  const house: HouseRule[] = []
  if (typeof r.outside_food_drink_allowed === 'boolean')
    house.push({ label: 'Dışarıdan yiyecek ve içecek', allowed: r.outside_food_drink_allowed })
  if (typeof r.alcohol_allowed === 'boolean') house.push({ label: 'Alkol', allowed: r.alcohol_allowed })
  if (r.smoking_outdoor_only === true) house.push({ label: 'Sigara yalnızca açık alanda', allowed: true })
  if (r.not_permitted === true) house.push({ label: 'Evcil hayvan', allowed: false })
  else if (r.welcome_at_no_additional_charge === true) house.push({ label: 'Evcil hayvan', allowed: true, note: 'Ücretsiz' })
  else if (str(r.welcome_at_additional_charge) && r.welcome_at_additional_charge !== false)
    house.push({
      label: 'Evcil hayvan',
      allowed: true,
      note: r.welcome_at_additional_charge === true ? 'Ek ücretle' : `Ek ücret: ${str(r.welcome_at_additional_charge)}`,
    })

  const services = str(r.services_dj_photoshoot_decoration_birthday_laser_show_etc)

  return { schedules, conditions, included, extras, house, services }
}
