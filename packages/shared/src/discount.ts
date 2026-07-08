import { DiscountDayFilter, DiscountTarget, DiscountType } from "./enums";

export const DISCOUNT_TARGET_LABELS: Record<DiscountTarget, string> = {
  [DiscountTarget.BOAT]: "Tekne",
  [DiscountTarget.EXPERIENCE]: "Deneyim",
  [DiscountTarget.ALL_BOATS]: "Tüm Tekneler",
  [DiscountTarget.ALL_EXPERIENCES]: "Tüm Deneyimler",
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: "Yüzde",
  [DiscountType.FIXED]: "Sabit Tutar",
};

export const DISCOUNT_DAY_FILTER_LABELS: Record<DiscountDayFilter, string> = {
  [DiscountDayFilter.ALL]: "Her Gün",
  [DiscountDayFilter.WEEKDAY]: "Hafta İçi",
  [DiscountDayFilter.WEEKEND]: "Hafta Sonu",
};

/** Human-readable discount value, e.g. "%20" or "₺500". */
export function formatDiscountValue(type: DiscountType, value: number): string {
  return type === DiscountType.PERCENTAGE ? `%${value}` : `₺${value}`;
}

/** True when the target applies to a specific boat/experience (needs an id). */
export function discountTargetNeedsId(target: DiscountTarget): boolean {
  return target === DiscountTarget.BOAT || target === DiscountTarget.EXPERIENCE;
}
