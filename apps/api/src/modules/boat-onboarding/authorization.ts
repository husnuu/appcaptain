import { boatRepository } from "@getyourboat/database";
import type { AuthUser } from "../../plugins/supabase-auth.js";
import { forbidden, notFound } from "../../lib/errors.js";

/**
 * Loads a boat's ownership info and asserts the caller may edit it.
 * Only the owner may edit their boat.
 */
export async function loadOwnedBoat(boatId: string, user: AuthUser) {
  const boat = await boatRepository.getOwnership(boatId);
  if (!boat) throw notFound("Boat not found");
  if (boat.ownerId !== user.id) {
    throw forbidden("You do not own this boat");
  }
  return boat;
}

/** Owner or admin may read/review. */
export async function loadBoatForReview(boatId: string, user: AuthUser) {
  const boat = await boatRepository.getOwnership(boatId);
  if (!boat) throw notFound("Boat not found");
  if (boat.ownerId !== user.id && user.role !== "ADMIN") {
    throw forbidden("Not allowed");
  }
  return boat;
}
