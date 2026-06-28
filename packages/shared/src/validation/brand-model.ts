import { z } from "zod";
import { BoatBrandCategory } from "../enums";

export const createBrandModelRequestSchema = z.object({
  requestedBrand: z.string().trim().min(1).max(120),
  requestedModel: z.string().trim().max(120).optional().nullable(),
  boatTypeKey: z.string().trim().optional(),
});

export const adminCreateBrandSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.nativeEnum(BoatBrandCategory),
  logoUrl: z.string().url().optional().nullable(),
});

export const adminCreateModelSchema = z.object({
  brandId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const adminReviewRequestSchema = z.object({
  category: z.nativeEnum(BoatBrandCategory).optional(),
});
