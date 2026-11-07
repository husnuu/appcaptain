import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  ExperienceStep,
  EXPERIENCE_STEP_SCHEMAS,
  experiencePhotoUploadUrlSchema,
  experienceRegisterPhotoSchema,
  experienceStatusToggleSchema,
  experienceCustomerInfoFieldSchema,
  experienceSeasonalPricingRuleSchema,
} from "@getyourboat/shared";
import { badRequest } from "../../../lib/errors.js";
import { parseDetailed } from "../../../lib/validate.js";
import { loadOwnedExperience } from "../authorization.js";
import * as service from "../services/experience.service.js";

const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;
const stepParam = (req: FastifyRequest) => (req.params as { step: string }).step as ExperienceStep;

const VALID_STEPS = new Set<string>(Object.values(ExperienceStep));

export async function experienceRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAuth);

  app.post("/experiences", async (req, reply) => {
    const experience = await service.createDraft(req.authUser!.id);
    return reply.code(201).send(experience);
  });

  app.get("/experiences/mine", async (req) => {
    const items = await service.listMine(req.authUser!.id);
    return { items };
  });

  app.get("/experiences/:id", async (req) => {
    return service.getState(idParam(req), req.authUser!.id);
  });

  app.put("/experiences/:id/steps/:step", async (req) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    const step = stepParam(req);
    if (!VALID_STEPS.has(step)) throw badRequest("Geçersiz adım");
    const body = parseDetailed(EXPERIENCE_STEP_SCHEMAS[step], req.body);
    return service.updateStep(idParam(req), req.authUser!.id, step, body);
  });

  app.post("/experiences/:id/submit", async (req) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    return service.submit(idParam(req), req.authUser!.id);
  });

  app.patch("/experiences/:id/status", async (req) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    const { status } = parseDetailed(experienceStatusToggleSchema, req.body);
    return service.toggleStatus(idParam(req), req.authUser!.id, status);
  });

  app.delete("/experiences/:id", async (req) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    return service.deleteExperience(idParam(req), req.authUser!.id);
  });

  app.post("/experiences/:id/photos/upload-url", async (req) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    const { fileName } = parseDetailed(experiencePhotoUploadUrlSchema, req.body);
    return service.createPhotoUploadUrl(idParam(req), req.authUser!.id, fileName);
  });

  app.post("/experiences/:id/photos", async (req, reply) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    const body = parseDetailed(experienceRegisterPhotoSchema, req.body);
    const experience = await service.registerPhoto(
      idParam(req),
      req.authUser!.id,
      body.storagePath,
      body.asCover
    );
    return reply.code(201).send(experience);
  });

  app.delete("/experiences/:id/photos", async (req) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    const { url } = req.body as { url?: string };
    if (!url) throw badRequest("url gerekli");
    return service.removePhoto(idParam(req), req.authUser!.id, url);
  });

  app.post("/experiences/:id/customer-info-fields", async (req) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    const body = parseDetailed(experienceCustomerInfoFieldSchema, req.body);
    const items = await service.addCustomerInfoField(idParam(req), req.authUser!.id, body);
    return { items };
  });

  app.delete("/experiences/:id/customer-info-fields/:fieldId", async (req) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    const { fieldId } = req.params as { fieldId: string };
    const items = await service.removeCustomerInfoField(idParam(req), req.authUser!.id, fieldId);
    return { items };
  });

  app.post("/experiences/:id/seasonal-pricing", async (req) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    const body = parseDetailed(experienceSeasonalPricingRuleSchema, req.body);
    const items = await service.addSeasonalPricingRule(idParam(req), req.authUser!.id, body);
    return { items };
  });

  app.delete("/experiences/:id/seasonal-pricing/:ruleId", async (req) => {
    await loadOwnedExperience(idParam(req), req.authUser!);
    const { ruleId } = req.params as { ruleId: string };
    const items = await service.removeSeasonalPricingRule(idParam(req), req.authUser!.id, ruleId);
    return { items };
  });
}
