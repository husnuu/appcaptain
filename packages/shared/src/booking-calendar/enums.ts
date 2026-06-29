export const BookingModel = {
  HOURLY: "HOURLY",
  DAILY: "DAILY",
  STAY_INCLUDED: "STAY_INCLUDED",
  WEEKLY: "WEEKLY",
} as const;
export type BookingModel = (typeof BookingModel)[keyof typeof BookingModel];

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
