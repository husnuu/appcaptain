import { z } from "zod";
import { BlockReason } from "./enums";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih (YYYY-MM-DD)");
const timeStr = z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz saat (HH:mm)");

export const createBlockSchema = z
  .object({
    boatId: z.string().min(1),
    reason: z.nativeEnum(BlockReason).default(BlockReason.MANUAL),
    note: z.string().max(500).optional(),
    startDate: dateStr.optional(),
    endDate: dateStr.optional(),
    date: dateStr.optional(),
    startTime: timeStr.optional(),
    endTime: timeStr.optional(),
  })
  .superRefine((data, ctx) => {
    const hasHourly = !!data.date;
    const hasRange = !!data.startDate || !!data.endDate;

    if (hasHourly) {
      if (!data.startTime || !data.endTime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Saatlik blok için startTime ve endTime zorunlu." });
      } else if (data.startTime >= data.endTime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bitiş saati başlangıçtan sonra olmalı." });
      }
      return;
    }

    if (hasRange) {
      if (!data.startDate || !data.endDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gün aralığı için startDate ve endDate zorunlu." });
      } else if (data.startDate > data.endDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Başlangıç tarihi bitişten sonra olamaz." });
      }
      return;
    }

    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "date (saatlik) veya startDate/endDate (günlük) gerekli." });
  });

export type CreateBlockSchema = z.infer<typeof createBlockSchema>;

export const priceOverrideSchema = z.object({
  boatId: z.string().min(1),
  date: dateStr,
  startTime: timeStr.optional(),
  endTime: timeStr.optional(),
  price: z.number().positive(),
  currency: z.string().length(3),
});

export type PriceOverrideSchema = z.infer<typeof priceOverrideSchema>;
