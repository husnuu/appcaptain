import {
  extractFileNameFromStoragePath,
  mergeActiveStep,
  type ApprovalType,
  type BoatDocumentDTO,
  type BoatExtraDTO,
  type BoatListItemDTO,
  type BoatPhotoDTO,
  type DocumentStatus,
  type ExtraPricingType,
  type OnboardingStep,
  type ProgressState,
  type SerializedBoatDTO,
} from "@getyourboat/shared";
import { prisma } from "../../client.js";
import type {
  AmenityWrite,
  BoatOwnership,
  BoatRepository,
  ExtraWrite,
  FeatureWrite,
  PhotoWrite,
  PricingWrite,
  StoredFile,
} from "../boat.repository.js";

const boatInclude = {
  boatType: true,
  listingModels: { include: { listingModel: true } },
  featureValues: { include: { feature: { include: { group: true } } } },
  amenities: { include: { amenity: { include: { category: true } } } },
  photos: { orderBy: { sortOrder: "asc" } },
  pricing: { include: { listingModel: true } },
  seasonalPrices: true,
  extras: true,
  documents: { include: { documentType: true } },
  cabinConfigurations: { orderBy: { createdAt: "asc" } },
} as const;

type FullBoat = Awaited<ReturnType<typeof loadFull>>;

function loadFull(boatId: string) {
  return prisma.boat.findUniqueOrThrow({ where: { id: boatId }, include: boatInclude });
}

function toPhotoDTO(p: FullBoat["photos"][number]): BoatPhotoDTO {
  return {
    id: p.id,
    boatId: p.boatId,
    storagePath: p.storagePath,
    publicUrl: p.publicUrl,
    altText: p.altText,
    sortOrder: p.sortOrder,
    isCover: p.isCover,
    createdAt: p.createdAt,
  };
}

function toExtraDTO(e: FullBoat["extras"][number]): BoatExtraDTO {
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    price: Number(e.price),
    currency: e.currency,
    pricingType: e.pricingType as ExtraPricingType,
  };
}

function toDocumentDTO(d: FullBoat["documents"][number]): BoatDocumentDTO {
  return {
    id: d.id,
    documentTypeKey: d.documentTypeKey,
    documentTypeLabel: d.documentType.label,
    fileName: extractFileNameFromStoragePath(d.storagePath),
    status: d.status as DocumentStatus,
    publicUrl: d.publicUrl,
    rejectionReason: d.rejectionReason,
    uploadedAt: d.uploadedAt,
  };
}

function boatPlanUrlFromBoat(boat: {
  structuredRules: FullBoat["structuredRules"];
  featureValues: ReadonlyArray<{ featureKey: string; value: string | null }>;
}): string | null {
  const rules = boat.structuredRules as Record<string, unknown> | null;
  const fromRules = rules?.boat_plan;
  if (typeof fromRules === "string" && fromRules.trim()) return fromRules;

  const legacy = boat.featureValues.find((f) => f.featureKey === "boat_plan")?.value;
  return legacy?.trim() ? legacy : null;
}

function serialize(boat: FullBoat): SerializedBoatDTO {
  const boatPlanUrl = boatPlanUrlFromBoat(boat);
  const features = boat.featureValues
    .filter((f) => f.featureKey !== "boat_plan")
    .map((f) => ({
      key: f.featureKey,
      label: f.feature.label,
      group: f.feature.group.key,
      value: f.value,
    }));

  if (boatPlanUrl) {
    features.push({
      key: "boat_plan",
      label: "Boat Plan",
      group: "media_and_description",
      value: boatPlanUrl,
    });
  }

  return {
    id: boat.id,
    ownerId: boat.ownerId,
    status: boat.status,
    approvalType: boat.approvalType,
    boatType: boat.boatType,
    engineType: boat.engineType as import("@getyourboat/shared").EngineType | null,
    title: boat.title,
    description: boat.description,
    rulesText: boat.rulesText,
    checkInNotes: boat.checkInNotes,
    checkOutNotes: boat.checkOutNotes,
    structuredRules: (boat.structuredRules as Record<string, string | boolean | number | null> | null) ?? null,
    progress: {
      currentStep: boat.currentStep,
      activeStep: boat.activeStep,
      completedSteps: boat.completedSteps,
      isReadyForReview: boat.isReadyForReview,
    },
    listingModels: boat.listingModels.map((l) => l.listingModel),
    features,
    amenities: boat.amenities.map((a) => ({
      amenityId: a.amenityId,
      key: a.amenity.key,
      label: a.amenity.label,
      category: a.amenity.category.key,
      isIncluded: a.isIncluded,
      isExtra: a.isExtra,
      extraPrice: a.extraPrice != null ? Number(a.extraPrice) : null,
      currency: a.currency,
    })),
    photos: boat.photos.map(toPhotoDTO),
    pricing: boat.pricing.map((p) => ({
      listingModelKey: p.listingModelKey,
      listingModelLabel: p.listingModel.label,
      price: Number(p.price),
      currency: p.currency,
    })),
    extras: boat.extras.map(toExtraDTO),
    documents: boat.documents.map(toDocumentDTO),
    cabinConfigurations: boat.cabinConfigurations.map((c) => ({
      id: c.id,
      boatId: c.boatId,
      cabinType: c.cabinType,
      wcType: c.wcType,
      quantity: c.quantity,
      createdAt: c.createdAt,
    })),
    submittedAt: boat.submittedAt,
    reviewedAt: boat.reviewedAt,
    rejectionReason: boat.rejectionReason,
    createdAt: boat.createdAt,
    updatedAt: boat.updatedAt,
    lastSavedAt: boat.lastSavedAt,
  };
}

export class PrismaBoatRepository implements BoatRepository {
  async createDraft(ownerId: string): Promise<SerializedBoatDTO> {
    const boat = await prisma.boat.create({ data: { ownerId } });
    return serialize(await loadFull(boat.id));
  }

  async getState(boatId: string): Promise<SerializedBoatDTO | null> {
    const boat = await prisma.boat.findUnique({ where: { id: boatId }, include: boatInclude });
    return boat ? serialize(boat) : null;
  }

  async getOwnership(boatId: string): Promise<BoatOwnership | null> {
    return prisma.boat.findUnique({
      where: { id: boatId },
      select: { id: true, ownerId: true, status: true },
    });
  }

  async getListingModelKeys(boatId: string): Promise<string[]> {
    const rows = await prisma.boatListingModel.findMany({
      where: { boatId },
      select: { listingModelKey: true },
      orderBy: { listingModelKey: "asc" },
    });
    return rows.map((r) => r.listingModelKey);
  }

  async listByOwner(ownerId: string): Promise<BoatListItemDTO[]> {
    const boats = await prisma.boat.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
      include: { photos: { where: { isCover: true }, take: 1 }, boatType: true },
    });
    return boats.map((b) => ({
      id: b.id,
      title: b.title,
      status: b.status,
      approvalType: b.approvalType,
      currentStep: b.currentStep,
      photos: b.photos.map(toPhotoDTO),
      boatType: b.boatType,
      updatedAt: b.updatedAt,
    }));
  }

  async listPending(): Promise<SerializedBoatDTO[]> {
    const boats = await prisma.boat.findMany({
      where: { status: "PENDING_REVIEW" },
      include: boatInclude,
      orderBy: { submittedAt: "asc" },
    });
    return boats.map(serialize);
  }

  async getCompletedSteps(boatId: string): Promise<OnboardingStep[]> {
    const boat = await prisma.boat.findUniqueOrThrow({
      where: { id: boatId },
      select: { completedSteps: true },
    });
    return boat.completedSteps;
  }

  async updateProgress(boatId: string, progress: ProgressState): Promise<void> {
    await prisma.boat.update({
      where: { id: boatId },
      data: {
        completedSteps: progress.completedSteps,
        currentStep: progress.currentStep,
        isReadyForReview: progress.isReadyForReview,
      },
    });
  }

  async touchDraft(boatId: string, activeStep: OnboardingStep): Promise<void> {
    const boat = await prisma.boat.findUniqueOrThrow({
      where: { id: boatId },
      select: { activeStep: true },
    });
    await prisma.boat.update({
      where: { id: boatId },
      data: {
        activeStep: mergeActiveStep(boat.activeStep, activeStep),
        lastSavedAt: new Date(),
      },
    });
  }

  async updateEngineType(
    boatId: string,
    engineType: import("@getyourboat/shared").EngineType | null
  ): Promise<void> {
    await prisma.boat.update({
      where: { id: boatId },
      data: { engineType },
    });
  }

  async replaceListingModels(
    boatId: string,
    listingModelKeys: string[],
    approvalType: ApprovalType
  ): Promise<void> {
    await prisma.$transaction([
      prisma.boatListingModel.deleteMany({ where: { boatId } }),
      prisma.boatListingModel.createMany({
        data: listingModelKeys.map((listingModelKey) => ({ boatId, listingModelKey })),
      }),
      prisma.boat.update({ where: { id: boatId }, data: { approvalType } }),
    ]);
  }

  async upsertFeatureValues(boatId: string, features: FeatureWrite[]): Promise<void> {
    if (features.length === 0) return;
    await prisma.$transaction(
      features.map((f) =>
        prisma.boatFeatureValue.upsert({
          where: { boatId_featureKey: { boatId, featureKey: f.key } },
          update: { value: f.value ?? null },
          create: { boatId, featureKey: f.key, value: f.value ?? null },
        })
      )
    );
  }

  async setBoatTypeAndFeatures(
    boatId: string,
    boatTypeKey: string,
    features: FeatureWrite[],
    meta?: {
      engineType?: import("@getyourboat/shared").EngineType | null;
      cabinConfigurations?: import("@getyourboat/shared").CabinConfigurationInput[];
    }
  ): Promise<void> {
    await prisma.boat.update({
      where: { id: boatId },
      data: {
        boatTypeKey,
        ...(meta?.engineType !== undefined ? { engineType: meta.engineType } : {}),
      },
    });
    await prisma.$transaction([
      ...features.map((f) =>
        prisma.boatFeatureValue.upsert({
          where: { boatId_featureKey: { boatId, featureKey: f.key } },
          update: { value: f.value ?? null },
          create: { boatId, featureKey: f.key, value: f.value ?? null },
        })
      ),
      ...(meta?.cabinConfigurations !== undefined
        ? [
            prisma.cabinConfiguration.deleteMany({ where: { boatId } }),
            ...(meta.cabinConfigurations.length > 0
              ? [
                  prisma.cabinConfiguration.createMany({
                    data: meta.cabinConfigurations.map((c) => ({
                      boatId,
                      cabinType: c.cabinType,
                      wcType: c.wcType ?? null,
                      quantity: c.quantity,
                    })),
                  }),
                ]
              : []),
          ]
        : []),
    ]);
  }

  async replaceAmenities(boatId: string, amenities: AmenityWrite[]): Promise<void> {
    const keys = amenities.map((a) => a.amenityKey);
    const rows = await prisma.amenity.findMany({ where: { key: { in: keys } } });
    const idByKey = new Map(rows.map((a) => [a.key, a.id]));
    await prisma.$transaction([
      prisma.boatAmenity.deleteMany({ where: { boatId } }),
      prisma.boatAmenity.createMany({
        data: amenities.map((a) => ({
          boatId,
          amenityId: idByKey.get(a.amenityKey)!,
          isIncluded: a.isIncluded,
          isExtra: a.isExtra,
          extraPrice: a.extraPrice ?? null,
          currency: a.currency ?? null,
        })),
      }),
    ]);
  }

  async setDescriptionRules(
    boatId: string,
    input: {
      title: string;
      description?: string | null;
      rulesText?: string | null;
      checkInNotes?: string | null;
      checkOutNotes?: string | null;
      structuredRules?: Record<string, string | boolean | number | null>;
    }
  ): Promise<void> {
    // Merge (not replace) the structuredRules JSON so saving the description
    // step never wipes rules owned by other steps (pricing fees/cancellation,
    // boat_plan URL, etc.).
    let structuredRules: Record<string, string | boolean | number | null> | undefined;
    if (input.structuredRules !== undefined) {
      const existing = await prisma.boat.findUnique({
        where: { id: boatId },
        select: { structuredRules: true },
      });
      const current =
        (existing?.structuredRules as Record<
          string,
          string | boolean | number | null
        > | null) ?? {};
      structuredRules = { ...current, ...input.structuredRules };
    }

    await prisma.boat.update({
      where: { id: boatId },
      data: {
        title: input.title,
        description: input.description ?? null,
        rulesText: input.rulesText ?? null,
        checkInNotes: input.checkInNotes ?? null,
        checkOutNotes: input.checkOutNotes ?? null,
        structuredRules: structuredRules ?? undefined,
      },
    });
  }

  async mergeStructuredRules(
    boatId: string,
    patch: Record<string, string | boolean | number | null>
  ): Promise<void> {
    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
      select: { structuredRules: true },
    });
    const current =
      (boat?.structuredRules as Record<string, string | boolean | number | null> | null) ?? {};
    await prisma.boat.update({
      where: { id: boatId },
      data: { structuredRules: { ...current, ...patch } },
    });
  }

  async setBoatPlanUrl(boatId: string, url: string | null): Promise<void> {
    await this.mergeStructuredRules(boatId, { boat_plan: url });
    await prisma.boatFeatureValue.deleteMany({
      where: { boatId, featureKey: "boat_plan" },
    });
  }

  async replacePricing(boatId: string, pricing: PricingWrite[]): Promise<void> {
    await prisma.$transaction([
      prisma.boatPricing.deleteMany({ where: { boatId } }),
      prisma.boatPricing.createMany({
        data: pricing.map((p) => ({
          boatId,
          listingModelKey: p.listingModelKey,
          price: p.price,
          currency: p.currency,
        })),
      }),
    ]);
  }

  async addExtra(boatId: string, input: ExtraWrite): Promise<BoatExtraDTO> {
    const extra = await prisma.boatExtra.create({ data: { boatId, ...input } });
    return {
      id: extra.id,
      name: extra.name,
      description: extra.description,
      price: Number(extra.price),
      currency: extra.currency,
      pricingType: extra.pricingType as ExtraPricingType,
    };
  }

  async updateExtra(
    boatId: string,
    extraId: string,
    input: ExtraWrite
  ): Promise<BoatExtraDTO | null> {
    const existing = await prisma.boatExtra.findFirst({ where: { id: extraId, boatId } });
    if (!existing) return null;
    const extra = await prisma.boatExtra.update({ where: { id: extraId }, data: input });
    return {
      id: extra.id,
      name: extra.name,
      description: extra.description,
      price: Number(extra.price),
      currency: extra.currency,
      pricingType: extra.pricingType as ExtraPricingType,
    };
  }

  async deleteExtra(boatId: string, extraId: string): Promise<boolean> {
    const existing = await prisma.boatExtra.findFirst({ where: { id: extraId, boatId } });
    if (!existing) return false;
    await prisma.boatExtra.delete({ where: { id: extraId } });
    return true;
  }

  async countPhotos(boatId: string): Promise<number> {
    return prisma.boatPhoto.count({ where: { boatId } });
  }

  async clearCoverFlags(boatId: string): Promise<void> {
    await prisma.boatPhoto.updateMany({ where: { boatId }, data: { isCover: false } });
  }

  async addPhoto(boatId: string, data: PhotoWrite): Promise<BoatPhotoDTO> {
    const photo = await prisma.boatPhoto.create({
      data: {
        boatId,
        storagePath: data.storagePath,
        publicUrl: data.publicUrl,
        sortOrder: data.sortOrder,
        isCover: data.isCover,
        altText: data.altText ?? null,
      },
    });
    return toPhotoDTO(photo);
  }

  async reorderPhotos(
    boatId: string,
    order: { id: string; sortOrder: number }[]
  ): Promise<BoatPhotoDTO[]> {
    await prisma.$transaction(
      order.map((o) =>
        prisma.boatPhoto.updateMany({
          where: { id: o.id, boatId },
          data: { sortOrder: o.sortOrder },
        })
      )
    );
    const photos = await prisma.boatPhoto.findMany({
      where: { boatId },
      orderBy: { sortOrder: "asc" },
    });
    return photos.map(toPhotoDTO);
  }

  async setCover(boatId: string, photoId: string): Promise<BoatPhotoDTO[] | null> {
    const photo = await prisma.boatPhoto.findFirst({ where: { id: photoId, boatId } });
    if (!photo) return null;
    await prisma.$transaction([
      prisma.boatPhoto.updateMany({ where: { boatId }, data: { isCover: false } }),
      prisma.boatPhoto.update({ where: { id: photoId }, data: { isCover: true } }),
    ]);
    const photos = await prisma.boatPhoto.findMany({
      where: { boatId },
      orderBy: { sortOrder: "asc" },
    });
    return photos.map(toPhotoDTO);
  }

  async findPhoto(boatId: string, photoId: string): Promise<StoredFile | null> {
    return prisma.boatPhoto.findFirst({
      where: { id: photoId, boatId },
      select: { id: true, storagePath: true },
    });
  }

  async deletePhoto(photoId: string): Promise<void> {
    await prisma.boatPhoto.delete({ where: { id: photoId } });
  }

  async documentTypeExists(documentTypeKey: string): Promise<boolean> {
    const dt = await prisma.documentType.findUnique({ where: { key: documentTypeKey } });
    return dt != null;
  }

  async addDocument(
    boatId: string,
    documentTypeKey: string,
    storagePath: string,
    publicUrl: string | null
  ): Promise<BoatDocumentDTO> {
    const doc = await prisma.boatDocument.create({
      data: { boatId, documentTypeKey, storagePath, publicUrl, status: "PENDING" },
      include: { documentType: true },
    });
    return toDocumentDTO(doc);
  }

  async findDocument(boatId: string, documentId: string): Promise<StoredFile | null> {
    return prisma.boatDocument.findFirst({
      where: { id: documentId, boatId },
      select: { id: true, storagePath: true },
    });
  }

  async documentExists(documentId: string): Promise<boolean> {
    const doc = await prisma.boatDocument.findUnique({ where: { id: documentId } });
    return doc != null;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await prisma.boatDocument.delete({ where: { id: documentId } });
  }

  async reviewDocument(
    documentId: string,
    reviewerId: string,
    status: DocumentStatus,
    reason?: string | null
  ): Promise<BoatDocumentDTO | null> {
    const existing = await prisma.boatDocument.findUnique({ where: { id: documentId } });
    if (!existing) return null;
    const doc = await prisma.boatDocument.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? (reason ?? null) : null,
        reviewedAt: new Date(),
        reviewedById: reviewerId,
      },
      include: { documentType: true },
    });
    return toDocumentDTO(doc);
  }

  async markSubmitted(boatId: string): Promise<void> {
    await prisma.boat.update({
      where: { id: boatId },
      data: { status: "PENDING_REVIEW", submittedAt: new Date(), rejectionReason: null },
    });
  }

  async approve(boatId: string, reviewerId: string): Promise<void> {
    await prisma.boat.update({
      where: { id: boatId },
      data: {
        status: "ACTIVE",
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        rejectionReason: null,
      },
    });
  }

  async reject(boatId: string, reviewerId: string, reason: string): Promise<void> {
    await prisma.boat.update({
      where: { id: boatId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        rejectionReason: reason,
      },
    });
  }

  async updateApprovalType(boatId: string, approvalType: ApprovalType): Promise<void> {
    await prisma.boat.update({ where: { id: boatId }, data: { approvalType } });
  }

  async listStoragePaths(boatId: string) {
    const [photos, documents, boat] = await Promise.all([
      prisma.boatPhoto.findMany({ where: { boatId }, select: { storagePath: true } }),
      prisma.boatDocument.findMany({ where: { boatId }, select: { storagePath: true } }),
      prisma.boat.findUnique({
        where: { id: boatId },
        select: {
          structuredRules: true,
          featureValues: { where: { featureKey: "boat_plan" }, select: { featureKey: true, value: true } },
        },
      }),
    ]);

    let boatPlan: string | null = null;
    const planUrl = boat ? boatPlanUrlFromBoat(boat) : null;
    if (planUrl) {
      const needle = `/object/public/`;
      const idx = planUrl.indexOf(needle);
      if (idx >= 0) {
        const rest = planUrl.slice(idx + needle.length);
        const slash = rest.indexOf("/");
        if (slash >= 0) boatPlan = decodeURIComponent(rest.slice(slash + 1));
      }
    }

    return {
      photos: photos.map((p) => p.storagePath),
      documents: documents.map((d) => d.storagePath),
      boatPlan,
    };
  }

  async deleteBoat(boatId: string): Promise<void> {
    await prisma.boat.delete({ where: { id: boatId } });
  }
}
