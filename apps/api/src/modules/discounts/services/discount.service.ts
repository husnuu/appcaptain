import {
  DiscountTarget,
  type CreateDiscountInput,
  type DiscountListQuery,
  type UpdateDiscountInput,
} from "@getyourboat/shared";
import { discountRepository } from "@getyourboat/database";
import { forbidden, notFound } from "../../../lib/errors.js";

/** Who is acting — admins manage everything, captains only their own. */
export interface DiscountActor {
  userId: string;
  isAdmin: boolean;
}

export function listDiscounts(query: DiscountListQuery, actor: DiscountActor) {
  return discountRepository.list(query, actor.isAdmin ? undefined : actor.userId);
}

export async function getDiscount(id: string, actor: DiscountActor) {
  const item = await discountRepository.getById(id);
  if (!item) throw notFound("İndirim bulunamadı");
  if (!actor.isAdmin && item.createdBy !== actor.userId) {
    throw forbidden("Bu indirime erişim yetkiniz yok");
  }
  return item;
}

async function assertTargetOwnership(
  input: Pick<CreateDiscountInput, "target" | "boatId" | "experienceId">,
  actor: DiscountActor
) {
  if (actor.isAdmin) return;
  if (
    input.target === DiscountTarget.ALL_BOATS ||
    input.target === DiscountTarget.ALL_EXPERIENCES
  ) {
    throw forbidden("Tüm ilanlara indirim tanımlama yetkisi yalnızca yöneticilerde");
  }
  if (input.target === DiscountTarget.BOAT) {
    if (!input.boatId || !(await discountRepository.isBoatOwnedBy(input.boatId, actor.userId))) {
      throw forbidden("Yalnızca kendi teknenize indirim tanımlayabilirsiniz");
    }
  }
  if (input.target === DiscountTarget.EXPERIENCE) {
    if (
      !input.experienceId ||
      !(await discountRepository.isExperienceOwnedBy(input.experienceId, actor.userId))
    ) {
      throw forbidden("Yalnızca kendi deneyiminize indirim tanımlayabilirsiniz");
    }
  }
}

export async function createDiscount(input: CreateDiscountInput, actor: DiscountActor) {
  await assertTargetOwnership(input, actor);
  return discountRepository.create(input, actor.userId);
}

export async function updateDiscount(
  id: string,
  input: UpdateDiscountInput,
  actor: DiscountActor
) {
  const existing = await getDiscount(id, actor);
  if (input.target !== undefined) {
    await assertTargetOwnership(
      {
        target: input.target,
        boatId: input.boatId ?? existing.boatId,
        experienceId: input.experienceId ?? existing.experienceId,
      },
      actor
    );
  }
  return discountRepository.update(id, input);
}

export async function toggleDiscount(id: string, actor: DiscountActor) {
  await getDiscount(id, actor);
  return discountRepository.toggle(id);
}

export async function deleteDiscount(id: string, actor: DiscountActor) {
  await getDiscount(id, actor);
  await discountRepository.remove(id);
}

export function listBoatOptions(actor: DiscountActor, search?: string) {
  return discountRepository.listBoatOptions(search, actor.isAdmin ? undefined : actor.userId);
}

export function listExperienceOptions(actor: DiscountActor, search?: string) {
  return discountRepository.listExperienceOptions(
    search,
    actor.isAdmin ? undefined : actor.userId
  );
}
