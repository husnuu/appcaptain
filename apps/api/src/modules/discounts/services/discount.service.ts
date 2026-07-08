import type {
  CreateDiscountInput,
  DiscountListQuery,
  UpdateDiscountInput,
} from "@getyourboat/shared";
import { discountRepository } from "@getyourboat/database";
import { notFound } from "../../../lib/errors.js";

export function listDiscounts(query: DiscountListQuery) {
  return discountRepository.list(query);
}

export async function getDiscount(id: string) {
  const item = await discountRepository.getById(id);
  if (!item) throw notFound("İndirim bulunamadı");
  return item;
}

export function createDiscount(input: CreateDiscountInput, createdBy: string) {
  return discountRepository.create(input, createdBy);
}

export async function updateDiscount(id: string, input: UpdateDiscountInput) {
  await getDiscount(id);
  return discountRepository.update(id, input);
}

export async function toggleDiscount(id: string) {
  await getDiscount(id);
  return discountRepository.toggle(id);
}

export async function deleteDiscount(id: string) {
  await getDiscount(id);
  await discountRepository.remove(id);
}

export function listBoatOptions(search?: string) {
  return discountRepository.listBoatOptions(search);
}

export function listExperienceOptions(search?: string) {
  return discountRepository.listExperienceOptions(search);
}
