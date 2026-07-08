import type { DiscountDayFilter, DiscountTarget, DiscountType } from "../enums";

/** Lightweight reference to the boat/experience a discount targets. */
export interface DiscountRefDTO {
  id: string;
  name: string;
}

export interface DiscountDTO {
  id: string;
  name: string;
  description: string | null;

  type: DiscountType;
  value: number;

  target: DiscountTarget;
  boatId: string | null;
  experienceId: string | null;

  startDate: string | null;
  endDate: string | null;

  timeStart: string | null;
  timeEnd: string | null;

  dayFilter: DiscountDayFilter;

  isActive: boolean;
  maxUses: number | null;
  usedCount: number;

  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;

  boat: DiscountRefDTO | null;
  experience: DiscountRefDTO | null;
}

export interface CreateDiscountInput {
  name: string;
  description?: string | null;
  type: DiscountType;
  value: number;
  target: DiscountTarget;
  boatId?: string | null;
  experienceId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  timeStart?: string | null;
  timeEnd?: string | null;
  dayFilter?: DiscountDayFilter;
  isActive?: boolean;
  maxUses?: number | null;
}

export type UpdateDiscountInput = Partial<CreateDiscountInput>;

export interface DiscountListQuery {
  target?: DiscountTarget;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface DiscountListResponse {
  discounts: DiscountDTO[];
  total: number;
  page: number;
  limit: number;
}
