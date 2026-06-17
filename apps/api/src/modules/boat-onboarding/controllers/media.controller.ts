import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  documentUploadUrlSchema,
  photoUploadUrlSchema,
  registerDocumentSchema,
  registerPhotoSchema,
  reorderPhotosSchema,
  setCoverSchema,
} from "@getyourboat/shared";
import { parseDetailed } from "../../../lib/validate.js";
import { loadOwnedBoat } from "../authorization.js";
import * as service from "../services/onboarding.service.js";

const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;

/**
 * Photo & document endpoints. Uploads use Supabase Storage signed upload URLs:
 * request a URL, upload the binary to Storage, then register the object here.
 */
export async function boatMediaRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAuth);

  /* ----------------------------- Photos ----------------------------- */

  app.post("/boats/:id/photos/upload-url", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const { fileName } = parseDetailed(photoUploadUrlSchema, req.body);
    return service.createPhotoUploadUrl(idParam(req), fileName);
  });

  app.post("/boats/:id/photos", async (req, reply) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const body = parseDetailed(registerPhotoSchema, req.body);
    const photo = await service.registerPhoto(
      idParam(req),
      body.storagePath,
      body.altText,
      body.isCover
    );
    return reply.code(201).send(photo);
  });

  app.patch("/boats/:id/photos/reorder", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const { order } = parseDetailed(reorderPhotosSchema, req.body);
    return service.reorderPhotos(idParam(req), order);
  });

  app.patch("/boats/:id/photos/cover", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const { photoId } = parseDetailed(setCoverSchema, req.body);
    return service.setCoverPhoto(idParam(req), photoId);
  });

  app.delete("/boats/:id/photos/:photoId", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const { photoId } = req.params as { photoId: string };
    return service.deletePhoto(idParam(req), photoId);
  });

  /* ---------------------------- Documents --------------------------- */

  app.post("/boats/:id/documents/upload-url", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const { documentTypeKey, fileName } = parseDetailed(documentUploadUrlSchema, req.body);
    return service.createDocumentUploadUrl(idParam(req), documentTypeKey, fileName);
  });

  app.post("/boats/:id/documents", async (req, reply) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const body = parseDetailed(registerDocumentSchema, req.body);
    const doc = await service.registerDocument(idParam(req), body.documentTypeKey, body.storagePath);
    return reply.code(201).send(doc);
  });

  app.delete("/boats/:id/documents/:documentId", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const { documentId } = req.params as { documentId: string };
    return service.deleteDocument(idParam(req), documentId);
  });
}
