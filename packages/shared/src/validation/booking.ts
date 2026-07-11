import { z } from "zod";
import { RentalType } from "../enums";

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saat formatı HH:MM olmalı");

/** Public booking request payload (guest — no account required). */
export const createBookingSchema = z
  .object({
    boatId: z.string().min(1, "Tekne seçilmeli"),
    guestName: z.string().trim().min(2, "Ad Soyad en az 2 karakter olmalı").max(120),
    guestEmail: z.string().trim().email("Geçerli bir e-posta girin"),
    guestPhone: z.string().trim().max(40).optional().nullable(),
    guestCount: z
      .number({ invalid_type_error: "Misafir sayısı gerekli" })
      .int()
      .positive("En az 1 misafir olmalı"),
    rentalType: z.nativeEnum(RentalType),
    startDate: z.string().datetime({ offset: true }).or(z.string().min(1)),
    endDate: z.string().datetime({ offset: true }).or(z.string().min(1)),
    startTime: timeString.optional().nullable(),
    endTime: timeString.optional().nullable(),
    message: z.string().trim().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Geçerli bir başlangıç tarihi seçin",
      });
    }
    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Geçerli bir bitiş tarihi seçin",
      });
    }
    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end < start
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Bitiş tarihi başlangıçtan önce olamaz",
      });
    }
  });

export const approveBookingSchema = z.object({
  totalPrice: z.number().positive().optional().nullable(),
});

export const rejectBookingSchema = z.object({
  rejectionNote: z.string().trim().max(500).optional().nullable(),
});
