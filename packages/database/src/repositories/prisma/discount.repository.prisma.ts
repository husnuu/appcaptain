import type {
  CreateDiscountInput,
  DiscountListQuery,
  UpdateDiscountInput,
} from "@getyourboat/shared";
import { DiscountTarget } from "@getyourboat/shared";
import { prisma } from "../../client.js";
import type { BoatOption, DiscountRepository } from "../discount.repository.js";
import { toDiscountDTO } from "../discount.repository.js";

const includeRefs = {
  boat: { select: { id: true, title: true } },
  experience: { select: { id: true, title: true } },
} as const;

function toDateOrNull(value?: string | null): Date | null {
  return value ? new Date(value) : null;
}

/** Only keep the target-specific id; clear the other. */
function normalizeTargetIds(input: {
  target?: string;
  boatId?: string | null;
  experienceId?: string | null;
}) {
  if (input.target === DiscountTarget.BOAT) {
    return { boatId: input.boatId ?? null, experienceId: null };
  }
  if (input.target === DiscountTarget.EXPERIENCE) {
    return { boatId: null, experienceId: input.experienceId ?? null };
  }
  if (input.target) {
    return { boatId: null, experienceId: null };
  }
  return { boatId: input.boatId ?? undefined, experienceId: input.experienceId ?? undefined };
}

export class PrismaDiscountRepository implements DiscountRepository {
  async list(query: DiscountListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where: Record<string, unknown> = {};
    if (query.target) where.target = query.target;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [rows, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        include: includeRefs,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.discount.count({ where }),
    ]);

    return {
      discounts: rows.map(toDiscountDTO),
      total,
      page,
      limit,
    };
  }

  async getById(id: string) {
    const row = await prisma.discount.findUnique({
      where: { id },
      include: includeRefs,
    });
    return row ? toDiscountDTO(row) : null;
  }

  async create(input: CreateDiscountInput, createdBy: string) {
    const ids = normalizeTargetIds(input);
    const row = await prisma.discount.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        type: input.type,
        value: input.value,
        target: input.target,
        boatId: ids.boatId ?? null,
        experienceId: ids.experienceId ?? null,
        startDate: toDateOrNull(input.startDate),
        endDate: toDateOrNull(input.endDate),
        timeStart: input.timeStart ?? null,
        timeEnd: input.timeEnd ?? null,
        dayFilter: input.dayFilter ?? "ALL",
        isActive: input.isActive ?? true,
        maxUses: input.maxUses ?? null,
        createdBy,
      },
      include: includeRefs,
    });
    return toDiscountDTO(row);
  }

  async update(id: string, input: UpdateDiscountInput) {
    const ids = normalizeTargetIds(input);
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description ?? null;
    if (input.type !== undefined) data.type = input.type;
    if (input.value !== undefined) data.value = input.value;
    if (input.target !== undefined) {
      data.target = input.target;
      data.boatId = ids.boatId ?? null;
      data.experienceId = ids.experienceId ?? null;
    } else {
      if (input.boatId !== undefined) data.boatId = input.boatId ?? null;
      if (input.experienceId !== undefined) data.experienceId = input.experienceId ?? null;
    }
    if (input.startDate !== undefined) data.startDate = toDateOrNull(input.startDate);
    if (input.endDate !== undefined) data.endDate = toDateOrNull(input.endDate);
    if (input.timeStart !== undefined) data.timeStart = input.timeStart ?? null;
    if (input.timeEnd !== undefined) data.timeEnd = input.timeEnd ?? null;
    if (input.dayFilter !== undefined) data.dayFilter = input.dayFilter;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.maxUses !== undefined) data.maxUses = input.maxUses ?? null;

    const row = await prisma.discount.update({
      where: { id },
      data,
      include: includeRefs,
    });
    return toDiscountDTO(row);
  }

  async toggle(id: string) {
    const current = await prisma.discount.findUniqueOrThrow({ where: { id } });
    const row = await prisma.discount.update({
      where: { id },
      data: { isActive: !current.isActive },
      include: includeRefs,
    });
    return toDiscountDTO(row);
  }

  async remove(id: string) {
    await prisma.discount.delete({ where: { id } });
  }

  async countActive() {
    return prisma.discount.count({ where: { isActive: true } });
  }

  async listBoatOptions(search?: string): Promise<BoatOption[]> {
    const rows = await prisma.boat.findMany({
      where: search
        ? { title: { contains: search, mode: "insensitive" } }
        : undefined,
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return rows.map((r) => ({ id: r.id, name: r.title?.trim() || "İsimsiz tekne" }));
  }

  async listExperienceOptions(search?: string): Promise<BoatOption[]> {
    const rows = await prisma.experience.findMany({
      where: search
        ? { title: { contains: search, mode: "insensitive" } }
        : undefined,
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return rows.map((r) => ({ id: r.id, name: r.title?.trim() || "İsimsiz deneyim" }));
  }
}
