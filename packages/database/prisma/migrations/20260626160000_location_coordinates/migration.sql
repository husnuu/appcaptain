-- Konum haritası için koordinat ve adres alanları (BoatFeatureValue üzerinden).

INSERT INTO "feature_definitions" ("id", "key", "label", "groupKey", "sortOrder")
VALUES
  ('feat_latitude', 'latitude', 'Latitude', 'boat_identity_and_specifications', 900),
  ('feat_longitude', 'longitude', 'Longitude', 'boat_identity_and_specifications', 901),
  ('feat_address', 'address', 'Address', 'boat_identity_and_specifications', 902)
ON CONFLICT ("key") DO UPDATE SET
  "label" = EXCLUDED."label",
  "groupKey" = EXCLUDED."groupKey",
  "sortOrder" = EXCLUDED."sortOrder";

INSERT INTO "onboarding_field_definitions" ("id", "key", "label", "type", "sectionKey", "sourceSection", "sortOrder", "canBeExtra")
VALUES
  ('field_latitude', 'latitude', 'Latitude', 'feature', 'boat_identity_and_specifications', 'LOCATION MAP', 900, false),
  ('field_longitude', 'longitude', 'Longitude', 'feature', 'boat_identity_and_specifications', 'LOCATION MAP', 901, false),
  ('field_address', 'address', 'Address', 'feature', 'boat_identity_and_specifications', 'LOCATION MAP', 902, false)
ON CONFLICT ("key") DO UPDATE SET
  "label" = EXCLUDED."label",
  "type" = EXCLUDED."type",
  "sectionKey" = EXCLUDED."sectionKey";

INSERT INTO "onboarding_field_inclusions" ("id", "fieldId", "packageKey", "included")
SELECT 'inc_' || fd."key" || '_' || pkg."key", fd."id", pkg."key", true
FROM "onboarding_field_definitions" fd
CROSS JOIN (VALUES ('seahub_hourly'), ('seahub_stay_included')) AS pkg("key")
WHERE fd."key" IN ('latitude', 'longitude', 'address')
ON CONFLICT ("fieldId", "packageKey") DO UPDATE SET "included" = true;
