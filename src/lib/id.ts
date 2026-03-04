import crypto from "crypto";

/** Generate a short random id (24 hex chars) */
export function newId(): string {
  return crypto.randomBytes(12).toString("hex");
}
