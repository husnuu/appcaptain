import { z } from "zod";
import { BlockReason, BookingModel } from "./enums";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (s) => !isNaN(Date.parse(s)),
  "Geçersiz tarih (YYYY-MM-DD)",
);

const timeStr = z.string().regex(/^\d{2}:\d{2}$/).refine(
  (s) => {
    const [h, m] = s.split(":").map(Number);
    return h! >= 0 && h! <= 23 && m! >= 0 && m! <= 59;
  },
  "Geçersiz saat (HH:mm)",
);

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

export const updateBlockSchema = z
  .object({
    reason: z.nativeEnum(BlockReason).optional(),
    note: z.string().max(500).nullable().optional(),
    startDate: dateStr.optional(),
    endDate: dateStr.optional(),
    date: dateStr.optional(),
    startTime: timeStr.optional(),
    endTime: timeStr.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "En az bir alan güncellenmelidir",
  });

export type UpdateBlockSchema = z.infer<typeof updateBlockSchema>;

export const getAvailabilitySchema = z.object({
  model: z.enum([
    BookingModel.HOURLY,
    BookingModel.DAILY,
    BookingModel.STAY_INCLUDED,
    BookingModel.WEEKLY,
  ]),
  rangeStart: dateStr,
  rangeEnd: dateStr,
});

export type GetAvailabilitySchema = z.infer<typeof getAvailabilitySchema>;

export const priceOverrideSchema = z.object({
  boatId: z.string().min(1),
  date: dateStr,
  startTime: timeStr.optional(),
  endTime: timeStr.optional(),
  price: z.number().positive(),
  currency: z.string().length(3),
});

export type PriceOverrideSchema = z.infer<typeof priceOverrideSchema>;
