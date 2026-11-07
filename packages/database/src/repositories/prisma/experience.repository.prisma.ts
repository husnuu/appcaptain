import { prisma } from "../../client.js";
import type { ExperienceProgressState } from "@getyourboat/shared";
import type { ExperienceStatus } from "@getyourboat/shared";
import type {
  ExperienceRepository,
  ExperienceWriteBase,
  CustomerInfoFieldInput,
  SeasonalPricingRuleInput,
} from "../experience.repository.js";
import { toExperienceDTO, toExperienceListItem } from "../experience.repository.js";

const INCLUDE_RELATIONS = {
  customerInfoFields: { orderBy: { sortOrder: "asc" as const } },
  seasonalPricingRules: { orderBy: { startDate: "asc" as const } },
};

export class PrismaExperienceRepository implements ExperienceRepository {
  async createDraft(captainId: string) {
    const row = await prisma.experience.create({
      data: { captainId },
      include: INCLUDE_RELATIONS,
    });
    return toExperienceDTO(row);
  }

  async listByCaptain(captainId: string) {
    const rows = await prisma.experience.findMany({
      where: { captainId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toExperienceListItem);
  }

  async getById(id: string) {
    const row = await prisma.experience.findUnique({
      where: { id },
      include: INCLUDE_RELATIONS,
    });
    return row ? toExperienceDTO(row) : null;
  }

  async getOwned(id: string, captainId: string) {
    const row = await prisma.experience.findFirst({
      where: { id, captainId },
      include: INCLUDE_RELATIONS,
    });
    return row ? toExperienceDTO(row) : null;
  }

  async updateFields(id: string, data: ExperienceWriteBase) {
    const row = await prisma.experience.update({
      where: { id },
      data: {
        ...data,
        basePrice: data.basePrice,
      },
      include: INCLUDE_RELATIONS,
    });
    return toExperienceDTO(row);
  }

  async updateProgress(id: string, progress: ExperienceProgressState) {
    await prisma.experience.update({
      where: { id },
      data: {
        completedSteps: progress.completedSteps,
        currentStep: progress.currentStep,
      },
    });
  }

  async updateStatus(id: string, status: ExperienceStatus, reviewNote?: string | null) {
    const row = await prisma.experience.update({
      where: { id },
      data: {
        status,
        ...(reviewNote !== undefined ? { reviewNote } : {}),
      },
      include: INCLUDE_RELATIONS,
    });
    return toExperienceDTO(row);
  }

  async delete(id: string) {
    await prisma.experience.delete({ where: { id } });
  }

  async addCustomerInfoField(experienceId: string, input: CustomerInfoFieldInput) {
    const count = await prisma.experienceCustomerInfoField.count({ where: { experienceId } });
    await prisma.experienceCustomerInfoField.create({
      data: {
        experienceId,
        label: input.label,
        fieldType: input.fieldType,
        required: input.required ?? false,
        helpText: input.helpText ?? null,
        options: input.options ?? [],
        sortOrder: count,
      },
    });
    return this.listCustomerInfoFields(experienceId);
  }

  async removeCustomerInfoField(experienceId: string, fieldId: string) {
    await prisma.experienceCustomerInfoField.deleteMany({
      where: { id: fieldId, experienceId },
    });
    return this.listCustomerInfoFields(experienceId);
  }

  async addSeasonalPricingRule(experienceId: string, input: SeasonalPricingRuleInput) {
    await prisma.experienceSeasonalPricingRule.create({
      data: {
        experienceId,
        label: input.label ?? "",
        startDate: input.startDate,
        endDate: input.endDate,
        price: input.price,
      },
    });
    return this.listSeasonalPricingRules(experienceId);
  }

  async removeSeasonalPricingRule(experienceId: string, ruleId: string) {
    await prisma.experienceSeasonalPricingRule.deleteMany({
      where: { id: ruleId, experienceId },
    });
    return this.listSeasonalPricingRules(experienceId);
  }

  private async listCustomerInfoFields(experienceId: string) {
    const rows = await prisma.experienceCustomerInfoField.findMany({
      where: { experienceId },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((f) => ({
      id: f.id,
      label: f.label,
      fieldType: f.fieldType,
      required: f.required,
      helpText: f.helpText,
      options: f.options,
      sortOrder: f.sortOrder,
    }));
  }

  private async listSeasonalPricingRules(experienceId: string) {
    const rows = await prisma.experienceSeasonalPricingRule.findMany({
      where: { experienceId },
      orderBy: { startDate: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      startDate: r.startDate,
      endDate: r.endDate,
      price: Number(r.price),
    }));
  }
}
