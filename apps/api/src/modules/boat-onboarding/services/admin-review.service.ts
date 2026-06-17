import { boatRepository } from "@getyourboat/database";
import { BoatStatus, type DocumentStatus } from "@getyourboat/shared";
import { conflict, notFound } from "../../../lib/errors.js";
import { getBoatState } from "./onboarding.service.js";

export function listPendingBoats() {
  return boatRepository.listPending();
}

export async function adminApprove(boatId: string, reviewerId: string) {
  const boat = await boatRepository.getOwnership(boatId);
  if (!boat) throw notFound("Boat not found");
  if (boat.status !== BoatStatus.PENDING_REVIEW) {
    throw conflict("Boat is not pending review");
  }
  await boatRepository.approve(boatId, reviewerId);
  return getBoatState(boatId);
}

export async function adminReject(boatId: string, reviewerId: string, reason: string) {
  const boat = await boatRepository.getOwnership(boatId);
  if (!boat) throw notFound("Boat not found");
  if (boat.status !== BoatStatus.PENDING_REVIEW) {
    throw conflict("Boat is not pending review");
  }
  await boatRepository.reject(boatId, reviewerId, reason);
  return getBoatState(boatId);
}

export async function reviewDocument(
  documentId: string,
  reviewerId: string,
  status: DocumentStatus,
  reason?: string
) {
  const doc = await boatRepository.reviewDocument(documentId, reviewerId, status, reason);
  if (!doc) throw notFound("Document not found");
  return doc;
}
