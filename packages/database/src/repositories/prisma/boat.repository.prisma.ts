import type {
  ApprovalType,
  BoatDocumentDTO,
  BoatExtraDTO,
  BoatListItemDTO,
  BoatPhotoDTO,
  DocumentStatus,
  ExtraPricingType,
  OnboardingStep,
  ProgressState,
  SerializedBoatDTO,
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
    status: d.status as DocumentStatus,
    publicUrl: d.publicUrl,
    rejectionReason: d.rejectionReason,
    uploadedAt: d.uploadedAt,
  };
}

function serialize(boat: FullBoat): SerializedBoatDTO {
  return {
    id: boat.id,
    ownerId: boat.ownerId,
    status: boat.status,
    approvalType: boat.approvalType,
    boatType: boat.boatType,
    title: boat.title,
    description: boat.description,
    rulesText: boat.rulesText,
    checkInNotes: boat.checkInNotes,
    checkOutNotes: boat.checkOutNotes,
    structuredRules: (boat.structuredRules as Record<string, boolean> | null) ?? null,
    progress: {
      currentStep: boat.currentStep,
      completedSteps: boat.completedSteps,
      isReadyForReview: boat.isReadyForReview,
    },
    listingModels: boat.listingModels.map((l) => l.listingModel),
    features: boat.featureValues.map((f) => ({
      key: f.featureKey,
      label: f.feature.label,
      group: f.feature.group.key,
      value: f.value,
    })),
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
    submittedAt: boat.submittedAt,
    reviewedAt: boat.reviewedAt,
    rejectionReason: boat.rejectionReason,
    createdAt: boat.createdAt,
    updatedAt: boat.updatedAt,
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

  async setBoatTypeAndFeatures(
    boatId: string,
    boatTypeKey: string,
    features: FeatureWrite[]
  ): Promise<void> {
    await prisma.boat.update({ where: { id: boatId }, data: { boatTypeKey } });
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
      structuredRules?: Record<string, boolean>;
    }
  ): Promise<void> {
    await prisma.boat.update({
      where: { id: boatId },
      data: {
        title: input.title,
        description: input.description ?? null,
        rulesText: input.rulesText ?? null,
        checkInNotes: input.checkInNotes ?? null,
        checkOutNotes: input.checkOutNotes ?? null,
        structuredRules: input.structuredRules ?? undefined,
      },
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
}
