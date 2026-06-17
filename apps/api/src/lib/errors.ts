export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFound = (msg = "Not found") => new HttpError(404, msg, "NOT_FOUND");
export const forbidden = (msg = "Forbidden") => new HttpError(403, msg, "FORBIDDEN");
export const badRequest = (msg = "Bad request") => new HttpError(400, msg, "BAD_REQUEST");
export const conflict = (msg = "Conflict") => new HttpError(409, msg, "CONFLICT");
