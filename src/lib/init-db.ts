import pool from "./db";

const schema = `
CREATE TABLE IF NOT EXISTS flights (
  id TEXT PRIMARY KEY,
  external_id INT UNIQUE,
  flight_number TEXT NOT NULL,
  ac_registration TEXT NOT NULL,
  ac_type TEXT NOT NULL,
  dept_icao TEXT NOT NULL,
  dept_time TIMESTAMPTZ NOT NULL,
  arrival_icao TEXT,
  arrival_time TIMESTAMPTZ,
  alternate_icao TEXT,
  eta TIMESTAMPTZ,
  fuel_load DOUBLE PRECISION,
  dispatcher TEXT,
  raw_data JSONB,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flights_dept_icao ON flights(dept_icao);
CREATE INDEX IF NOT EXISTS idx_flights_dept_time ON flights(dept_time);
CREATE INDEX IF NOT EXISTS idx_flights_flight_number ON flights(flight_number);
CREATE INDEX IF NOT EXISTS idx_flights_arrival_icao ON flights(arrival_icao);

CREATE TABLE IF NOT EXISTS fuel_orders (
  id TEXT PRIMARY KEY,
  flight_id TEXT REFERENCES flights(id),
  flight_number TEXT NOT NULL,
  ac_registration TEXT NOT NULL,
  ac_type TEXT NOT NULL,
  dept_icao TEXT NOT NULL,
  dept_time TIMESTAMPTZ NOT NULL,
  fuel_load DOUBLE PRECISION,
  dispatcher TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  sent_at TIMESTAMPTZ,
  sent_to TEXT[] DEFAULT '{}',
  cc_to TEXT[] DEFAULT '{}',
  email_subject TEXT,
  email_body TEXT,
  is_update BOOLEAN DEFAULT FALSE,
  original_order_id TEXT REFERENCES fuel_orders(id),
  update_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_orders_status ON fuel_orders(status);
CREATE INDEX IF NOT EXISTS idx_fuel_orders_dept_icao ON fuel_orders(dept_icao);
CREATE INDEX IF NOT EXISTS idx_fuel_orders_flight_number ON fuel_orders(flight_number);

CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  icao_code TEXT UNIQUE NOT NULL,
  name TEXT,
  timezone TEXT,
  emails TEXT[] DEFAULT '{}',
  cc_emails TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stations_icao_code ON stations(icao_code);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

let initialized = false;

export async function ensureDb() {
  if (initialized) return;
  await pool.query(schema);
  initialized = true;
}
