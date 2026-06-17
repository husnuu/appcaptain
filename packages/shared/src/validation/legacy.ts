import { z } from "zod";
import {
  BoatStatus,
  PaymentStatus,
  ReservationStatus,
  UserRole,
} from "../enums";

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [string, ...string[]];

/* ----------------------------- Auth ----------------------------- */

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum([UserRole.CUSTOMER, UserRole.CAPTAIN]).default(UserRole.CUSTOMER),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* ----------------------------- Boat (legacy) ----------------------------- */

export const boatSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.string().min(2),
  capacity: z.number().int().positive(),
  lengthMeters: z.number().positive().optional(),
  pricePerDay: z.number().nonnegative(),
  city: z.string().min(2),
  country: z.string().min(2),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  amenityIds: z.array(z.string()).optional(),
});
export type BoatInput = z.infer<typeof boatSchema>;

export const boatStatusUpdateSchema = z.object({
  status: z.enum(enumValues(BoatStatus)),
  reason: z.string().optional(),
});

/* -------------------------- Reservation -------------------------- */

export const reservationSchema = z
  .object({
    boatId: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    guests: z.number().int().positive(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });
export type ReservationInput = z.infer<typeof reservationSchema>;

export const reservationStatusSchema = z.object({
  status: z.enum(enumValues(ReservationStatus)),
});

/* ---------------------------- Payment ---------------------------- */

export const paymentSchema = z.object({
  reservationId: z.string(),
  amount: z.number().positive(),
  partial: z.boolean().default(false),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const paymentStatusSchema = z.object({
  status: z.enum(enumValues(PaymentStatus)),
});

/* ---------------------------- Message ---------------------------- */

export const messageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(4000),
});
export type MessageInput = z.infer<typeof messageSchema>;

/* ----------------------------- Review ---------------------------- */

export const reviewSchema = z.object({
  reservationId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
