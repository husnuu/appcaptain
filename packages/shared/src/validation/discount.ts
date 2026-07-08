import { z } from "zod";
import { DiscountDayFilter, DiscountTarget, DiscountType } from "../enums";

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saat formatı HH:MM olmalı");

const discountBaseShape = {
  name: z.string().trim().min(2, "İndirim adı en az 2 karakter olmalı").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  type: z.nativeEnum(DiscountType),
  value: z.number().positive("Değer 0'dan büyük olmalı"),
  target: z.nativeEnum(DiscountTarget),
  boatId: z.string().trim().optional().nullable(),
  experienceId: z.string().uuid().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  timeStart: timeString.optional().nullable(),
  timeEnd: timeString.optional().nullable(),
  dayFilter: z.nativeEnum(DiscountDayFilter).optional(),
  isActive: z.boolean().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
};

function applyDiscountRules(
  data: {
    type?: DiscountType;
    value?: number;
    target?: DiscountTarget;
    boatId?: string | null;
    experienceId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    timeStart?: string | null;
    timeEnd?: string | null;
  },
  ctx: z.RefinementCtx
) {
  if (data.type === DiscountType.PERCENTAGE && typeof data.value === "number" && data.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["value"],
      message: "Yüzde 100'den fazla olamaz",
    });
  }
  if (data.target === DiscountTarget.BOAT && !data.boatId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["boatId"],
      message: "Tekne indirimi için tekne seçmelisin",
    });
  }
  if (data.target === DiscountTarget.EXPERIENCE && !data.experienceId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["experienceId"],
      message: "Deneyim indirimi için deneyim seçmelisin",
    });
  }
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "Bitiş tarihi başlangıçtan önce olamaz",
    });
  }
  if (data.timeStart && data.timeEnd && data.timeEnd <= data.timeStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["timeEnd"],
      message: "Bitiş saati başlangıçtan sonra olmalı",
    });
  }
}

export const createDiscountSchema = z
  .object(discountBaseShape)
  .superRefine(applyDiscountRules);

export const updateDiscountSchema = z
  .object(discountBaseShape)
  .partial()
  .superRefine(applyDiscountRules);
