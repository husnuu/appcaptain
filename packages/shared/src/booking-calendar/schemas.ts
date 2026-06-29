import { z } from "zod";
import { BlockReason, BookingModel } from "./enums.js";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

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
    startDate: z.string().regex(dateRegex).optional(),
    endDate: z.string().regex(dateRegex).optional(),
    // Hourly fields:
    date: z.string().regex(dateRegex).optional(),
    startTime: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional(),
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
    note: z.string().max(500).optional(),
    startDate: z.string().regex(dateRegex).optional(),
    endDate: z.string().regex(dateRegex).optional(),
    date: z.string().regex(dateRegex).optional(),
    startTime: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional(),
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
  rangeStart: z.string().regex(dateRegex),
  rangeEnd: z.string().regex(dateRegex),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type GetAvailabilityInput = z.infer<typeof getAvailabilitySchema>;
