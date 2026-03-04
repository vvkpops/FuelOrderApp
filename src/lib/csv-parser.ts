/**
 * Parse CSV text into an array of flight data objects.
 * Maps the Google Sheets column names to our internal field names.
 */
export interface RawFlightRow {
  flightNumber: string;
  acRegistration: string;
  acType: string;
  deptIcao: string;
  deptTime: string;
  fuelLoad: string | null;
  dispatcher: string | null;
}

export function parseFlightCSV(csvText: string): RawFlightRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  // Map common header variations to our field names
  const headerMap: Record<string, string> = {};

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (
      h === "callsign" ||
      h === "flightnumber" ||
      h === "flight_number" ||
      (h.includes("flight") && (h.includes("num") || h.includes("no")))
    ) {
      headerMap["flightNumber"] = String(i);
    } else if (
      h === "acregistration" ||
      h === "ac_registration" ||
      h.includes("registration") ||
      h.includes("ac reg") ||
      h.includes("acreg")
    ) {
      headerMap["acRegistration"] = String(i);
    } else if (
      h === "actype" ||
      h === "ac_type" ||
      h.includes("ac type") ||
      h.includes("aircraft type") ||
      (h.includes("type") && !h.includes("departure") && !h.includes("arrival"))
    ) {
      headerMap["acType"] = String(i);
    } else if (
      h === "departureicao" ||
      h === "depticao" ||
      h === "departure_icao" ||
      h === "dept_icao" ||
      (h.includes("departure") && h.includes("icao")) ||
      (h.includes("dept") && h.includes("icao")) ||
      h === "station"
    ) {
      headerMap["deptIcao"] = String(i);
    } else if (
      h === "departuretime" ||
      h === "depttime" ||
      h === "departure_time" ||
      h === "dept_time" ||
      (h.includes("departure") && h.includes("time")) ||
      (h.includes("dept") && h.includes("time")) ||
      (h.includes("scheduled") && h.includes("time"))
    ) {
      headerMap["deptTime"] = String(i);
    } else if (h.includes("fuel") && (h.includes("load") || h.includes("order") || h.includes("lbs") || h.includes("amount"))) {
      headerMap["fuelLoad"] = String(i);
    } else if (h.includes("dispatcher") || h.includes("initials")) {
      headerMap["dispatcher"] = String(i);
    }
  }

  const flights: RawFlightRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV values that may contain commas within quotes
    const values = parseCSVLine(line);

    flights.push({
      flightNumber: values[Number(headerMap["flightNumber"])] || "",
      acRegistration: values[Number(headerMap["acRegistration"])] || "",
      acType: values[Number(headerMap["acType"])] || "",
      deptIcao: values[Number(headerMap["deptIcao"])] || "",
      deptTime: values[Number(headerMap["deptTime"])] || "",
      fuelLoad: headerMap["fuelLoad"] ? values[Number(headerMap["fuelLoad"])] || null : null,
      dispatcher: headerMap["dispatcher"] ? values[Number(headerMap["dispatcher"])] || null : null,
    });
  }

  return flights;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}
