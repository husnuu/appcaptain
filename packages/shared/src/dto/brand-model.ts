import type { BoatBrandCategory, BrandModelRequestStatus, DataSource } from "../enums";

export interface BoatBrandDTO {
  id: string;
  name: string;
  category: BoatBrandCategory;
  logoUrl: string | null;
  isActive: boolean;
  source: DataSource;
  modelCount?: number;
}

export interface BoatModelDTO {
  id: string;
  brandId: string;
  name: string;
  notes: string | null;
  isActive: boolean;
  source: DataSource;
}

export interface BrandModelRequestDTO {
  id: string;
  captainId: string;
  captainName: string | null;
  captainEmail: string | null;
  requestedBrand: string;
  requestedModel: string | null;
  status: BrandModelRequestStatus;
  createdAt: string | Date;
}

export interface CreateBrandModelRequestInput {
  requestedBrand: string;
  requestedModel?: string | null;
  boatTypeKey?: string;
}

export interface AdminCreateBrandInput {
  name: string;
  category: BoatBrandCategory;
  logoUrl?: string | null;
}

export interface AdminCreateModelInput {
  brandId: string;
  name: string;
  notes?: string | null;
}

export interface AdminReviewRequestInput {
  category?: BoatBrandCategory;
}
