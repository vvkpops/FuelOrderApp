/**
 * Generate a mailto: URL that opens the default mail client
 * with pre-filled To, CC, Subject, and Body
 */
export function generateMailtoUrl(params: {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
}): string {
  const { to, cc, subject, body } = params;

  const toStr = to.join(",");
  const parts: string[] = [];

  if (cc && cc.length > 0) {
    parts.push(`cc=${encodeURIComponent(cc.join(","))}`);
  }
  parts.push(`subject=${encodeURIComponent(subject)}`);
  parts.push(`body=${encodeURIComponent(body)}`);

  return `mailto:${toStr}?${parts.join("&")}`;
}

/**
 * Format the email subject line for a fuel order
 */
export function formatEmailSubject(params: {
  flightNumber: string;
  deptIcao: string;
  acRegistration: string;
  isUpdate?: boolean;
}): string {
  const prefix = params.isUpdate ? "UPDATED FUEL ORDER" : "FUEL ORDER";
  return `${prefix} - ${params.flightNumber} - ${params.deptIcao} - ${params.acRegistration}`;
}

/**
 * Format the email body for a fuel order
 */
export function formatEmailBody(params: {
  flightNumber: string;
  acRegistration: string;
  acType: string;
  deptIcao: string;
  deptTime: string;
  fuelLoad?: number | null;
  dispatcher: string;
  isUpdate?: boolean;
  updateReason?: string;
  timezone?: string | null;
}): string {
  const line = "─".repeat(40);
  const sep = "- - - - - - - - - -";
  const prefix = params.isUpdate ? "✈ UPDATED FUEL ORDER" : "✈ FUEL ORDER";
  const fuelStr = params.fuelLoad ? `${params.fuelLoad} LBS` : "N/A";

  // Format departure time — show local time if timezone is configured
  let deptTimeStr = params.deptTime;
  if (params.timezone) {
    try {
      const utcDate = new Date(params.deptTime);
      const localStr = utcDate.toLocaleString("en-US", {
        timeZone: params.timezone,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      // Get the short timezone abbreviation
      const tzAbbr = utcDate.toLocaleString("en-US", {
        timeZone: params.timezone,
        timeZoneName: "short",
      }).split(" ").pop();
      deptTimeStr = `${localStr} ${tzAbbr}`;
    } catch {
      // Fall back to the original UTC string if timezone is invalid
    }
  }

  let body = `${line}
${prefix}
${line}

Flight
  ${params.flightNumber}

${sep}

Aircraft
  ${params.acRegistration} / ${params.acType}

${sep}

Departure
  ${params.deptIcao} — ${deptTimeStr}

${sep}

Fuel Load
  ${fuelStr}

${sep}

Dispatcher
  ${params.dispatcher}

${line}`;

  if (params.isUpdate) {
    body += `\n\n⚠ This is an updated fuel order. Please disregard any previous orders for this flight.`;
    if (params.updateReason) {
      body += `\nReason: ${params.updateReason}`;
    }
  }

  body += `\n\n---\nSent via Fuel Ordering System\n${new Date().toISOString().replace("T", " ").substring(0, 19)} UTC`;

  return body;
}
