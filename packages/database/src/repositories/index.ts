import { PrismaBoatRepository } from "./prisma/boat.repository.prisma.js";
import { PrismaOnboardingLookupRepository } from "./prisma/lookup.repository.prisma.js";
import { PrismaProfileRepository } from "./prisma/profile.repository.prisma.js";

export * from "./boat.repository.js";
export * from "./lookup.repository.js";
export * from "./profile.repository.js";

/**
 * Default Prisma-backed repository singletons. Swap these (or inject the classes)
 * to change the persistence layer without touching API services.
 */
export const boatRepository = new PrismaBoatRepository();
export const onboardingLookupRepository = new PrismaOnboardingLookupRepository();
export const profileRepository = new PrismaProfileRepository();
