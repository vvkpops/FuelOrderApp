/**
 * Reads the airport CSV, filters to airports with ICAO codes,
 * looks up timezone from lat/lng using geo-tz, and writes airports.json.
 */
import { readFileSync, writeFileSync } from "fs";
import { find as findTz } from "geo-tz";

const CSV_PATH = "../reference/airports (2).csv";
const OUT_PATH = "./src/data/airports.json";

// Parse CSV
const raw = readFileSync(CSV_PATH, "utf-8");
const lines = raw.split("\n");
const headers = parseCSVLine(lines[0]);

const icaoIdx = headers.indexOf("icao_code");
const iataIdx = headers.indexOf("iata_code");
const nameIdx = headers.indexOf("name");
const latIdx = headers.indexOf("latitude_deg");
const lngIdx = headers.indexOf("longitude_deg");
const typeIdx = headers.indexOf("type");
const countryIdx = headers.indexOf("iso_country");
const municipalityIdx = headers.indexOf("municipality");

console.log(`Parsing ${lines.length - 1} rows...`);

const airports = {};
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const cols = parseCSVLine(line);
  const icao = (cols[icaoIdx] || "").trim();
  if (!icao || icao.length < 3) {
    skipped++;
    continue;
  }

  const lat = parseFloat(cols[latIdx]);
  const lng = parseFloat(cols[lngIdx]);

  if (isNaN(lat) || isNaN(lng)) {
    skipped++;
    continue;
  }

  // Look up timezone from coordinates
  let timezone = "UTC";
  try {
    const tzResults = findTz(lat, lng);
    if (tzResults && tzResults.length > 0) {
      timezone = tzResults[0];
    }
  } catch {
    // keep UTC
  }

  airports[icao] = {
    icao,
    iata: (cols[iataIdx] || "").trim() || null,
    name: (cols[nameIdx] || "").trim(),
    city: (cols[municipalityIdx] || "").trim() || null,
    country: (cols[countryIdx] || "").trim(),
    lat,
    lng,
    timezone,
  };
}

console.log(`Built ${Object.keys(airports).length} airports with timezones (skipped ${skipped} without ICAO)`);

// Write JSON
writeFileSync(OUT_PATH, JSON.stringify(airports, null, 2));
console.log(`Written to ${OUT_PATH}`);

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}
