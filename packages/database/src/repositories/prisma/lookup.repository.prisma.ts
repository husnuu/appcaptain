import type {
  AmenityCategoryDTO,
  BoatTypeOptionDTO,
  DocumentTypeDTO,
  FeatureGroupDTO,
  ListingModelOptionDTO,
  OnboardingConfigDTO,
  OnboardingFieldDTO,
  ResolvedOnboardingConfigDTO,
} from "@getyourboat/shared";
import { resolveOnboardingConfig } from "@getyourboat/shared";
import { prisma } from "../../client.js";
import type {
  FieldFilter,
  LookupModel,
  OnboardingLookupRepository,
} from "../lookup.repository.js";

const byOrder = { orderBy: { sortOrder: "asc" } } as const;

const LOOKUP_CACHE_TTL_MS = 5 * 60 * 1000;
const lookupCache = globalThis as unknown as {
  config?: { at: number; data: OnboardingConfigDTO };
  allFields?: { at: number; data: OnboardingFieldDTO[] };
};

async function cached<T>(
  slot: "config" | "allFields",
  loader: () => Promise<T>
): Promise<T> {
  const entry = slot === "config" ? lookupCache.config : lookupCache.allFields;
  if (entry && Date.now() - entry.at < LOOKUP_CACHE_TTL_MS) {
    return entry.data as T;
  }
  const data = await loader();
  const cachedEntry = { at: Date.now(), data };
  if (slot === "config") {
    lookupCache.config = cachedEntry as { at: number; data: OnboardingConfigDTO };
  } else {
    lookupCache.allFields = cachedEntry as { at: number; data: OnboardingFieldDTO[] };
  }
  return data;
}

export class PrismaOnboardingLookupRepository implements OnboardingLookupRepository {
  getBoatTypes(): Promise<BoatTypeOptionDTO[]> {
    return prisma.boatTypeOption.findMany(byOrder);
  }

  getListingModels(): Promise<ListingModelOptionDTO[]> {
    return prisma.listingModelOption.findMany(byOrder);
  }

  getFeatureGroups(): Promise<FeatureGroupDTO[]> {
    return prisma.featureGroup.findMany({
      ...byOrder,
      include: { features: { orderBy: { sortOrder: "asc" } } },
    });
  }

  getAmenityCategories(): Promise<AmenityCategoryDTO[]> {
    return prisma.amenityCategory.findMany({
      ...byOrder,
      include: { amenities: { orderBy: { sortOrder: "asc" } } },
    });
  }

  getDocumentTypes(): Promise<DocumentTypeDTO[]> {
    return prisma.documentType.findMany(byOrder);
  }

  getFields(filter: FieldFilter): Promise<OnboardingFieldDTO[]> {
    const packageFilter = filter.packages?.length
      ? {
          inclusions: {
            some: {
              packageKey: { in: filter.packages },
              included: true,
            },
          },
        }
      : filter.package
        ? { inclusions: { some: { packageKey: filter.package, included: true } } }
        : {};

    return prisma.onboardingFieldDefinition.findMany({
      where: {
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.section ? { sectionKey: filter.section } : {}),
        ...packageFilter,
      },
      orderBy: { sortOrder: "asc" },
      include: { inclusions: true },
    });
  }

  getAllFields(): Promise<OnboardingFieldDTO[]> {
    return cached("allFields", () =>
      prisma.onboardingFieldDefinition.findMany({
        orderBy: { sortOrder: "asc" },
        include: { inclusions: true },
      })
    );
  }

  async getResolvedConfig(listingModelKeys: string[]): Promise<ResolvedOnboardingConfigDTO> {
    const [config, fields] = await Promise.all([this.getConfig(), this.getAllFields()]);
    return resolveOnboardingConfig(config, fields, listingModelKeys);
  }

  getConfig(): Promise<OnboardingConfigDTO> {
    return cached("config", async () => {
      const [boatTypes, listingModels, featureGroups, amenityCategories, documentTypes] =
        await Promise.all([
          this.getBoatTypes(),
          this.getListingModels(),
          this.getFeatureGroups(),
          this.getAmenityCategories(),
          this.getDocumentTypes(),
        ]);
      return { boatTypes, listingModels, featureGroups, amenityCategories, documentTypes };
    });
  }

  countByKeys(model: LookupModel, keys: string[]): Promise<number> {
    const where = { key: { in: keys } };
    const counters: Record<LookupModel, () => Promise<number>> = {
      listingModelOption: () => prisma.listingModelOption.count({ where }),
      boatTypeOption: () => prisma.boatTypeOption.count({ where }),
      featureDefinition: () => prisma.featureDefinition.count({ where }),
      amenity: () => prisma.amenity.count({ where }),
    };
    return counters[model]();
  }
}
