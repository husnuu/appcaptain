/** Strip HTML tags and trim message bodies. */
export function sanitizeMessageBody(body: string): string {
  return body.replace(/<[^>]*>/g, "").trim();
}

/**
 * Make a user-supplied filename safe for a Supabase Storage key. Spaces and
 * special characters (e.g. "Screenshot 2026-06-04 at 3.10.36 PM.png") produce
 * "Invalid key" errors, so we lowercase, replace non-alphanumerics with dashes
 * and keep a short base + extension. Callers still prefix a random UUID for
 * uniqueness, so this only needs to guarantee a valid, readable key.
 */
export function sanitizeStorageFileName(fileName: string): string {
  const rawExt = fileName.includes(".") ? fileName.split(".").pop() ?? "" : "";
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "");
  const base =
    fileName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 40) || "file";
  return ext ? `${base}.${ext}` : base;
}
