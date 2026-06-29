import { z } from "zod";
import { BlockReason, BookingModel } from "./enums.js";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (s) => !isNaN(Date.parse(s)),
  "Invalid calendar date",
);

const timeString = z.string().regex(/^\d{2}:\d{2}$/).refine(
  (s) => {
    const [h, m] = s.split(":").map(Number);
    return h! >= 0 && h! <= 23 && m! >= 0 && m! <= 59;
  },
  "Invalid time value",
);

export const createBlockSchema = z
  .object({
    boatId: z.string().min(1),
    model: z.enum([
      BookingModel.HOURLY,
      BookingModel.DAILY,
      BookingModel.STAY_INCLUDED,
      BookingModel.WEEKLY,
    ]),
    reason: z.enum([
      BlockReason.MAINTENANCE,
      BlockReason.OWNER_USE,
      BlockReason.MANUAL,
      BlockReason.OTHER,
    ]),
    note: z.string().max(500).optional(),
    // Day-based fields:
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    // Hourly fields:
    date: dateString.optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
  })
  .refine(
    (data) => {
      if (data.model === BookingModel.HOURLY) {
        return !!data.date && !!data.startTime && !!data.endTime;
      }
      return !!data.startDate && !!data.endDate;
    },
    { message: "Model tipine göre gerekli alanlar eksik" },
  );

export const updateBlockSchema = z
  .object({
    reason: z
      .enum([
        BlockReason.MAINTENANCE,
        BlockReason.OWNER_USE,
        BlockReason.MANUAL,
        BlockReason.OTHER,
      ])
      .optional(),
    note: z.string().max(500).nullable().optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    date: dateString.optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "En az bir alan güncellenmelidir",
  });

export const getAvailabilitySchema = z.object({
  model: z.enum([
    BookingModel.HOURLY,
    BookingModel.DAILY,
    BookingModel.STAY_INCLUDED,
    BookingModel.WEEKLY,
  ]),
  rangeStart: dateString,
  rangeEnd: dateString,
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type GetAvailabilityInput = z.infer<typeof getAvailabilitySchema>;
