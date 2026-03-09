import crypto from "crypto";

/** Generate a short random id (24 hex chars) */
export function newId(): string {
  return crypto.randomBytes(12).toString("hex");
}

/**
 * Generate a unique flight hash based on flight properties.
 * Hash is deterministic: same flight details = same hash.
 * Format: flightNumber + deptIcao + deptDate (YYYY-MM-DD)
 */
export function flightHash(flightNumber: string, deptIcao: string, deptTime: Date | string): string {
  const dt = typeof deptTime === "string" ? new Date(deptTime) : deptTime;
  const dateStr = dt.toISOString().slice(0, 10); // YYYY-MM-DD
  const input = `${flightNumber.toUpperCase()}-${deptIcao.toUpperCase()}-${dateStr}`;
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}
