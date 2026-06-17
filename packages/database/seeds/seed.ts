/**
 * Seed: imports the boat-listing requirements matrix
 * (`seahub_boat_listing_requirements_seed.json`) into the lookup/config tables.
 *
 * This JSON is the single source of truth for onboarding fields. Enumerations
 * that the matrix does not contain (boat types, listing models) come from the
 * companion config `data/onboarding-extra-config.json`.
 *
 * Idempotent — safe to re-run.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "../generated/client/index.js";

const prisma = new PrismaClient();
const here = dirname(fileURLToPath(import.meta.url));

const REQUIREMENTS_FILE =
  process.env.ONBOARDING_SEED_FILE ??
  resolve(here, "seahub_boat_listing_requirements_seed.json");
const EXTRA_CONFIG_FILE = resolve(here, "onboarding-extra-config.json");

const PACKAGE_KEYS = ["seahub_hourly", "seahub_stay_included"] as const;
const FEATURE_TYPES = new Set(["feature", "crew_option"]);

interface RequirementField {
  sort_order: number;
  source_row?: number;
  key: string;
  label: string;
  section: string;
  source_section?: string;
  type: string;
  amenity_category?: string;
  can_be_extra?: boolean;
  included_in?: Record<string, boolean>;
  notes?: Record<string, string | null>;
}

interface RequirementsFile {
  fields: RequirementField[];
}

interface OptionConfig {
  key: string;
  label: string;
  sort_order?: number;
}

interface ExtraConfig {
  boat_types: OptionConfig[];
  listing_models: OptionConfig[];
}

const titleCase = (s: string): string =>
  s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

/** Runs async tasks in parallel, chunked to avoid exhausting the pool. */
async function runBatched<T>(tasks: (() => Promise<T>)[], size = 20): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += size) {
    const chunk = tasks.slice(i, i + size).map((t) => t());
    results.push(...(await Promise.all(chunk)));
  }
  return results;
}

async function seedPackages() {
  await runBatched(
    PACKAGE_KEYS.map((key) => () =>
      prisma.onboardingPackage.upsert({
        where: { key },
        update: { label: titleCase(key) },
        create: { key, label: titleCase(key) },
      })
    )
  );
}

async function seedSections(fields: RequirementField[]) {
  const seen = new Map<string, RequirementField>();
  for (const f of fields) if (!seen.has(f.section)) seen.set(f.section, f);

  const entries = [...seen.entries()];
  await runBatched(
    entries.map(([key, f], order) => () =>
      prisma.onboardingSection.upsert({
        where: { key },
        update: { label: titleCase(key), sourceSection: f.source_section ?? null, sortOrder: order },
        create: { key, label: titleCase(key), sourceSection: f.source_section ?? null, sortOrder: order },
      })
    )
  );
}

async function seedFieldDefinitions(fields: RequirementField[]) {
  const defs = await runBatched(
    fields.map((f) => () =>
      prisma.onboardingFieldDefinition.upsert({
        where: { key: f.key },
        update: {
          label: f.label,
          type: f.type,
          sectionKey: f.section,
          sourceSection: f.source_section ?? null,
          sortOrder: f.sort_order,
          sourceRow: f.source_row ?? null,
          canBeExtra: f.can_be_extra ?? false,
          amenityCategoryKey: f.amenity_category ?? null,
        },
        create: {
          key: f.key,
          label: f.label,
          type: f.type,
          sectionKey: f.section,
          sourceSection: f.source_section ?? null,
          sortOrder: f.sort_order,
          sourceRow: f.source_row ?? null,
          canBeExtra: f.can_be_extra ?? false,
          amenityCategoryKey: f.amenity_category ?? null,
        },
      })
    )
  );

  const idByKey = new Map(defs.map((d) => [d.key, d.id]));
  const byKey = new Map(fields.map((f) => [f.key, f]));

  const inclusionTasks = defs.flatMap((d) =>
    PACKAGE_KEYS.map((packageKey) => () => {
      const f = byKey.get(d.key)!;
      const included = f.included_in?.[packageKey] ?? false;
      const note = f.notes?.[packageKey] ?? null;
      return prisma.onboardingFieldInclusion.upsert({
        where: { fieldId_packageKey: { fieldId: idByKey.get(d.key)!, packageKey } },
        update: { included, note },
        create: { fieldId: idByKey.get(d.key)!, packageKey, included, note },
      });
    })
  );
  await runBatched(inclusionTasks);
}

async function seedAmenities(fields: RequirementField[]) {
  const amenityFields = fields.filter((f) => f.type === "amenity");
  const categoryKeys = [...new Set(amenityFields.map((f) => f.amenity_category ?? "other_amenities"))];

  const cats = await runBatched(
    categoryKeys.map((key, order) => () =>
      prisma.amenityCategory.upsert({
        where: { key },
        update: { label: titleCase(key), sortOrder: order },
        create: { key, label: titleCase(key), sortOrder: order },
      })
    )
  );
  const categoryIdByKey = new Map(cats.map((c) => [c.key, c.id]));

  await runBatched(
    amenityFields.map((f) => () =>
      prisma.amenity.upsert({
        where: { key: f.key },
        update: {
          label: f.label,
          categoryId: categoryIdByKey.get(f.amenity_category ?? "other_amenities")!,
          canBeExtra: f.can_be_extra ?? false,
          sortOrder: f.sort_order,
        },
        create: {
          key: f.key,
          label: f.label,
          categoryId: categoryIdByKey.get(f.amenity_category ?? "other_amenities")!,
          canBeExtra: f.can_be_extra ?? false,
          sortOrder: f.sort_order,
        },
      })
    )
  );
}

async function seedFeatures(fields: RequirementField[]) {
  const featureFields = fields.filter((f) => FEATURE_TYPES.has(f.type));
  const groupKeys = [...new Set(featureFields.map((f) => f.section))];

  await runBatched(
    groupKeys.map((key, order) => () => {
      const sample = featureFields.find((f) => f.section === key)!;
      return prisma.featureGroup.upsert({
        where: { key },
        update: { label: titleCase(key), sourceSection: sample.source_section ?? null, sortOrder: order },
        create: { key, label: titleCase(key), sourceSection: sample.source_section ?? null, sortOrder: order },
      });
    })
  );

  await runBatched(
    featureFields.map((f) => () =>
      prisma.featureDefinition.upsert({
        where: { key: f.key },
        update: { label: f.label, groupKey: f.section, sortOrder: f.sort_order },
        create: { key: f.key, label: f.label, groupKey: f.section, sortOrder: f.sort_order },
      })
    )
  );
}

async function seedDocumentTypes(fields: RequirementField[]) {
  await runBatched(
    fields
      .filter((f) => f.type === "document")
      .map((f) => () =>
        prisma.documentType.upsert({
          where: { key: f.key },
          update: { label: f.label, sortOrder: f.sort_order },
          create: { key: f.key, label: f.label, sortOrder: f.sort_order },
        })
      )
  );
}

async function seedOptions(extra: ExtraConfig) {
  await runBatched([
    ...extra.boat_types.map((o) => () =>
      prisma.boatTypeOption.upsert({
        where: { key: o.key },
        update: { label: o.label, sortOrder: o.sort_order ?? 0 },
        create: { key: o.key, label: o.label, sortOrder: o.sort_order ?? 0 },
      })
    ),
    ...extra.listing_models.map((o) => () =>
      prisma.listingModelOption.upsert({
        where: { key: o.key },
        update: { label: o.label, sortOrder: o.sort_order ?? 0 },
        create: { key: o.key, label: o.label, sortOrder: o.sort_order ?? 0 },
      })
    ),
  ]);
}

async function main() {
  console.log(`Loading requirements from: ${REQUIREMENTS_FILE}`);
  const { fields } = loadJson<RequirementsFile>(REQUIREMENTS_FILE);
  const extra = loadJson<ExtraConfig>(EXTRA_CONFIG_FILE);

  await seedPackages();
  await seedSections(fields);
  await seedFieldDefinitions(fields);
  await seedAmenities(fields);
  await seedFeatures(fields);
  await seedDocumentTypes(fields);
  await seedOptions(extra);

  const [amenities, features, docs, boatTypes, models, hourly, stay] = await Promise.all([
    prisma.amenity.count(),
    prisma.featureDefinition.count(),
    prisma.documentType.count(),
    prisma.boatTypeOption.count(),
    prisma.listingModelOption.count(),
    prisma.onboardingFieldInclusion.count({
      where: { packageKey: "seahub_hourly", included: true },
    }),
    prisma.onboardingFieldInclusion.count({
      where: { packageKey: "seahub_stay_included", included: true },
    }),
  ]);
  console.log(
    `Seeded: ${fields.length} field defs, ${amenities} amenities, ${features} features, ` +
      `${docs} document types, ${boatTypes} boat types, ${models} listing models.`
  );
  console.log(`Package inclusion: seahub_hourly=${hourly}, seahub_stay_included=${stay}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
