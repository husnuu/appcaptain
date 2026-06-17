import type { FastifyInstance, FastifyRequest } from "fastify";
import { DocumentStatus, rejectDocumentSchema, rejectSchema } from "@getyourboat/shared";
import { parseDetailed } from "../../../lib/validate.js";
import * as review from "../services/admin-review.service.js";

const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;

/**
 * Admin review endpoints. Guarded by `requireAdmin` (profile.role === ADMIN).
 */
export async function boatAdminRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAdmin);

  app.get("/admin/boats/pending", async () => {
    const items = await review.listPendingBoats();
    return { items };
  });

  app.post("/admin/boats/:id/approve", async (req) =>
    review.adminApprove(idParam(req), req.authUser!.id)
  );

  app.post("/admin/boats/:id/reject", async (req) => {
    const { reason } = parseDetailed(rejectSchema, req.body);
    return review.adminReject(idParam(req), req.authUser!.id, reason);
  });

  app.post("/admin/documents/:documentId/approve", async (req) => {
    const { documentId } = req.params as { documentId: string };
    return review.reviewDocument(documentId, req.authUser!.id, DocumentStatus.APPROVED);
  });

  app.post("/admin/documents/:documentId/reject", async (req) => {
    const { documentId } = req.params as { documentId: string };
    const { reason } = parseDetailed(rejectDocumentSchema, req.body);
    return review.reviewDocument(documentId, req.authUser!.id, DocumentStatus.REJECTED, reason);
  });
}
