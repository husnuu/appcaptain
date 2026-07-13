/**
 * Calendar availability model — mirrors the boat listing-model keys used across
 * onboarding/pricing so a boat's calendar granularity follows its real models.
 * `hourly` is slot-based; the others are day-based.
 */
export const CalendarModel = {
  HOURLY: "hourly",
  DAILY: "daily",
  OVERNIGHT: "overnight",
  WEEKLY_CHARTER: "weekly_charter",
} as const;
export type CalendarModel = (typeof CalendarModel)[keyof typeof CalendarModel];

export const SlotStatus = {
  AVAILABLE: "AVAILABLE",
  BLOCKED: "BLOCKED",
  BOOKED: "BOOKED",
} as const;
export type SlotStatus = (typeof SlotStatus)[keyof typeof SlotStatus];

export const BlockReason = {
  MAINTENANCE: "MAINTENANCE",
  OWNER_USE: "OWNER_USE",
  MANUAL: "MANUAL",
  OTHER: "OTHER",
} as const;
export type BlockReason = (typeof BlockReason)[keyof typeof BlockReason];

/** Hourly listing models render time slots; everything else renders day cells. */
export function isHourlyModel(model: string): boolean {
  return model === CalendarModel.HOURLY;
}
