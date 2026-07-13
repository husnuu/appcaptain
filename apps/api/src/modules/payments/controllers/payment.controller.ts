import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  BookingPaymentStatus,
  markPaymentPaidSchema,
  type BookingPaymentListQuery,
} from "@getyourboat/shared";
import { parseDetailed } from "../../../lib/validate.js";
import * as service from "../services/payment.service.js";

const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;

function listQuery(req: FastifyRequest): BookingPaymentListQuery {
  const q = req.query as { status?: string; page?: string; limit?: string };
  const status =
    q.status &&
    Object.values(BookingPaymentStatus).includes(q.status as BookingPaymentStatus)
      ? (q.status as BookingPaymentStatus)
      : undefined;
  return {
    status,
    page: q.page ? Number(q.page) : undefined,
    limit: q.limit ? Number(q.limit) : undefined,
  };
}

/** Captain endpoints — scoped to the captain's own payments. */
export async function captainPaymentRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAuth);

  app.get("/payments", async (req) => {
    return service.listCaptainPayments(req.authUser!.id, listQuery(req));
  });

  app.get("/payments/:id", async (req) => {
    const payment = await service.getPayment(
      idParam(req),
      req.authUser!.id,
      req.authUser!.role === "ADMIN"
    );
    return { payment };
  });
}

/** Admin endpoints — settle payments and mark payouts. */
export async function adminPaymentRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAdmin);

  app.patch("/payments/:id/mark-paid", async (req) => {
    const { method, note } = parseDetailed(markPaymentPaidSchema, req.body ?? {});
    const payment = await service.markPaid(idParam(req), method, note);
    return { payment };
  });

  app.patch("/payments/:id/mark-payout", async (req) => {
    const payment = await service.markPayout(idParam(req));
    return { payment };
  });
}
