import { RentalType } from "@getyourboat/shared";

/**
 * BoatPricing.listingModelKey comes from ListingModelOption
 * (hourly/daily/overnight/weekly_charter) — a different vocabulary than the
 * booking RentalType enum (HOURLY/DAILY/WEEKLY/STAY), so these need mapping
 * rather than a naive toUpperCase() cast.
 */
export function toRentalType(listingModelKey?: string | null): RentalType {
  switch (listingModelKey) {
    case "hourly":
      return RentalType.HOURLY;
    case "weekly_charter":
      return RentalType.WEEKLY;
    case "overnight":
      return RentalType.STAY;
    case "daily":
    default:
      return RentalType.DAILY;
  }
}

export function priceUnitLabel(listingModelKey?: string | null): string {
  if (listingModelKey === "daily") return "gün";
  if (listingModelKey === "weekly_charter") return "hafta";
  return "gece";
}
