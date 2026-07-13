import { PrismaExperienceRepository } from "./prisma/experience.repository.prisma.js";
import { PrismaBoatBrandRepository } from "./prisma/boat-brand.repository.prisma.js";
import { PrismaConversationRepository } from "./prisma/conversation.repository.prisma.js";
import { PrismaAuthRepository } from "./prisma/auth.repository.prisma.js";
import { PrismaBoatRepository } from "./prisma/boat.repository.prisma.js";
import { PrismaOnboardingLookupRepository } from "./prisma/lookup.repository.prisma.js";
import { PrismaProfileRepository } from "./prisma/profile.repository.prisma.js";
import { PrismaDiscountRepository } from "./prisma/discount.repository.prisma.js";
import { PrismaBookingRepository } from "./prisma/booking.repository.prisma.js";
import { PrismaCalendarRepository } from "./prisma/calendar.repository.prisma.js";
import { PrismaGuestConversationRepository } from "./prisma/guest-conversation.repository.prisma.js";
import { PrismaBookingPaymentRepository } from "./prisma/booking-payment.repository.prisma.js";

export * from "./auth.repository.js";
export * from "./boat.repository.js";
export * from "./lookup.repository.js";
export * from "./profile.repository.js";
export * from "./conversation.repository.js";
export * from "./experience.repository.js";
export * from "./boat-brand.repository.js";
export * from "./discount.repository.js";
export * from "./booking.repository.js";
export * from "./calendar.repository.js";
export * from "./guest-conversation.repository.js";
export * from "./booking-payment.repository.js";

/**
 * Default Prisma-backed repository singletons. Swap these (or inject the classes)
 * to change the persistence layer without touching API services.
 */
export const authRepository = new PrismaAuthRepository();
export const boatRepository = new PrismaBoatRepository();
export const onboardingLookupRepository = new PrismaOnboardingLookupRepository();
export const profileRepository = new PrismaProfileRepository();
export const conversationRepository = new PrismaConversationRepository();
export const experienceRepository = new PrismaExperienceRepository();
export const boatBrandRepository = new PrismaBoatBrandRepository();
export const discountRepository = new PrismaDiscountRepository();
export const bookingRepository = new PrismaBookingRepository();
export const calendarRepository = new PrismaCalendarRepository();
export const guestConversationRepository =
  new PrismaGuestConversationRepository();
export const bookingPaymentRepository = new PrismaBookingPaymentRepository();
