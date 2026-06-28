import {
  BoatBrandCategory,
  BrandModelRequestStatus,
  type AdminCreateBrandInput,
  type AdminCreateModelInput,
  type CreateBrandModelRequestInput,
  boatTypeToBrandCategory,
} from "@getyourboat/shared";
import { boatBrandRepository } from "@getyourboat/database";
import { badRequest, notFound } from "../../../lib/errors.js";

export function listBrands(category?: BoatBrandCategory, activeOnly = true) {
  return boatBrandRepository.listBrands(category, activeOnly);
}

export function listModels(brandId: string, activeOnly = true) {
  return boatBrandRepository.listModels(brandId, activeOnly);
}

export function createBrandModelRequest(
  captainId: string,
  input: CreateBrandModelRequestInput
) {
  return boatBrandRepository.createRequest({
    captainId,
    requestedBrand: input.requestedBrand,
    requestedModel: input.requestedModel ?? null,
  });
}

export function listBrandModelRequests(status?: BrandModelRequestStatus) {
  return boatBrandRepository.listRequests(status);
}

export async function approveBrandModelRequest(
  id: string,
  category?: BoatBrandCategory
) {
  const request = await boatBrandRepository.getRequest(id);
  if (!request) throw notFound("Talep bulunamadı");
  if (request.status !== BrandModelRequestStatus.PENDING) {
    throw badRequest("Talep zaten işlenmiş");
  }

  const resolvedCategory = category ?? BoatBrandCategory.MOTORYACHT;
  let brand = await boatBrandRepository.findBrandByName(request.requestedBrand);
  if (!brand) {
    brand = await boatBrandRepository.createBrand({
      name: request.requestedBrand,
      category: resolvedCategory,
    });
  }

  if (request.requestedModel?.trim()) {
    const models = await boatBrandRepository.listModels(brand.id, false);
    const exists = models.some(
      (m) => m.name.toLowerCase() === request.requestedModel!.trim().toLowerCase()
    );
    if (!exists) {
      await boatBrandRepository.createModel({
        brandId: brand.id,
        name: request.requestedModel.trim(),
      });
    }
  }

  return boatBrandRepository.updateRequestStatus(id, BrandModelRequestStatus.APPROVED);
}

export async function rejectBrandModelRequest(id: string) {
  const request = await boatBrandRepository.getRequest(id);
  if (!request) throw notFound("Talep bulunamadı");
  if (request.status !== BrandModelRequestStatus.PENDING) {
    throw badRequest("Talep zaten işlenmiş");
  }
  return boatBrandRepository.updateRequestStatus(id, BrandModelRequestStatus.REJECTED);
}

export async function adminCreateBrand(input: AdminCreateBrandInput) {
  const existing = await boatBrandRepository.findBrandByName(input.name);
  if (existing) throw badRequest("Bu marka zaten kayıtlı");
  return boatBrandRepository.createBrand(input);
}

export async function adminCreateModel(input: AdminCreateModelInput) {
  return boatBrandRepository.createModel(input);
}

export function resolveCategoryFromBoatType(boatTypeKey?: string): BoatBrandCategory | undefined {
  if (!boatTypeKey) return undefined;
  return boatTypeToBrandCategory(boatTypeKey) ?? undefined;
}
