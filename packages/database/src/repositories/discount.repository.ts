import type {
  CreateDiscountInput,
  DiscountDTO,
  DiscountListQuery,
  DiscountListResponse,
  UpdateDiscountInput,
} from "@getyourboat/shared";

export interface BoatOption {
  id: string;
  name: string;
}

export interface DiscountRepository {
  /** `ownerId` scopes the list to a captain's own discounts (undefined = all). */
  list(query: DiscountListQuery, ownerId?: string): Promise<DiscountListResponse>;
  getById(id: string): Promise<DiscountDTO | null>;
  create(input: CreateDiscountInput, createdBy: string): Promise<DiscountDTO>;
  update(id: string, input: UpdateDiscountInput): Promise<DiscountDTO>;
  toggle(id: string): Promise<DiscountDTO>;
  remove(id: string): Promise<void>;
  countActive(): Promise<number>;
  /** `ownerId` scopes options to a captain's own boats (undefined = all). */
  listBoatOptions(search?: string, ownerId?: string): Promise<BoatOption[]>;
  /** `captainId` scopes options to a captain's own experiences (undefined = all). */
  listExperienceOptions(search?: string, captainId?: string): Promise<BoatOption[]>;
  isBoatOwnedBy(boatId: string, ownerId: string): Promise<boolean>;
  isExperienceOwnedBy(experienceId: string, captainId: string): Promise<boolean>;
}

export interface DiscountRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  value: number;
  target: string;
  boatId: string | null;
  experienceId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  timeStart: string | null;
  timeEnd: string | null;
  dayFilter: string;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  boat?: { id: string; title: string | null } | null;
  experience?: { id: string; title: string } | null;
}

export function toDiscountDTO(row: DiscountRow): DiscountDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type as DiscountDTO["type"],
    value: row.value,
    target: row.target as DiscountDTO["target"],
    boatId: row.boatId,
    experienceId: row.experienceId,
    startDate: row.startDate ? row.startDate.toISOString() : null,
    endDate: row.endDate ? row.endDate.toISOString() : null,
    timeStart: row.timeStart,
    timeEnd: row.timeEnd,
    dayFilter: row.dayFilter as DiscountDTO["dayFilter"],
    isActive: row.isActive,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    boat: row.boat
      ? { id: row.boat.id, name: row.boat.title?.trim() || "İsimsiz tekne" }
      : null,
    experience: row.experience
      ? { id: row.experience.id, name: row.experience.title?.trim() || "İsimsiz deneyim" }
      : null,
  };
}
