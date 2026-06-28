import type { z, ZodTypeAny } from "zod";
import { buildValidationErrorResponse } from "@getyourboat/shared";
import { HttpError } from "./errors.js";

/** Parses input with a Zod schema, throwing a 400 HttpError on failure. */
export function parse(schema: ZodTypeAny, data: unknown): any {
  return parseDetailed(schema, data);
}

/**
 * Like `parse` but attaches standardized field-level validation errors.
 * Return type is intentionally `any`: Zod generic output inference breaks under
 * Vercel's TypeScript 5.9 function bundler. Runtime validation is unchanged.
 */
export function parseDetailed(schema: ZodTypeAny, data: unknown): any {
  const result = schema.safeParse(data);
  if (!result.success) {
    const payload = buildValidationErrorResponse(result.error);
    const err = new HttpError(400, payload.message, "VALIDATION_ERROR");
    (err as HttpError & { details?: unknown; fields?: typeof payload.fields }).details = payload;
    (err as HttpError & { fields?: typeof payload.fields }).fields = payload.fields;
    throw err;
  }
  return result.data;
}

/** Narrow a validated payload to the schema output type at call sites. */
export function parseTyped<S extends ZodTypeAny>(
  schema: S,
  data: unknown
): z.output<S> {
  return parseDetailed(schema, data) as z.output<S>;
}
