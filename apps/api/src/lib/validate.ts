import type { z, ZodTypeAny } from "zod";
import { HttpError } from "./errors.js";

/** Parses input with a Zod schema, throwing a 400 HttpError on failure. */
export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, "Validation failed", "VALIDATION_ERROR");
  }
  return result.data;
}

/** Like `parse` but attaches the flattened Zod issues to the error. */
export function parseDetailed<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const err = new HttpError(400, "Validation failed", "VALIDATION_ERROR");
    (err as HttpError & { details?: unknown }).details = result.error.flatten();
    throw err;
  }
  return result.data;
}
