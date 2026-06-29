import { boatRepository } from "@getyourboat/database";
import type { AuthUser } from "../../plugins/captain-auth.js";
import { forbidden, notFound } from "../../lib/errors.js";

/** Owner or admin may manage a boat's calendar blocks. */
export async function loadBoatForCalendar(boatId: string, user: AuthUser) {
  const boat = await boatRepository.getOwnership(boatId);
  if (!boat) throw notFound("Boat not found");
  if (boat.ownerId !== user.id && user.role !== "ADMIN") {
    throw forbidden("You do not own this boat");
  }
  return boat;
}
