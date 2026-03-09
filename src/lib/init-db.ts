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
  flight_hash TEXT,
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
CREATE INDEX IF NOT EXISTS idx_fuel_orders_flight_hash ON fuel_orders(flight_hash);

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

// Migrations for existing databases
const migrations = `
-- Add flight_hash column if it doesn't exist (for real-time flight sync)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fuel_orders' AND column_name = 'flight_hash'
  ) THEN
    ALTER TABLE fuel_orders ADD COLUMN flight_hash TEXT;
    CREATE INDEX IF NOT EXISTS idx_fuel_orders_flight_hash ON fuel_orders(flight_hash);
  END IF;
END $$;

-- Drop old columns if they exist (must drop constraints first)
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  -- Drop flight_id foreign key constraint if exists
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'fuel_orders' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'flight_id';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE fuel_orders DROP CONSTRAINT ' || constraint_name;
  END IF;

  -- Now drop columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fuel_orders' AND column_name = 'flight_id'
  ) THEN
    ALTER TABLE fuel_orders DROP COLUMN flight_id;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fuel_orders' AND column_name = 'external_flight_id'
  ) THEN
    ALTER TABLE fuel_orders DROP COLUMN external_flight_id;
  END IF;
END $$;
`;

let initialized = false;

export async function ensureDb() {
  if (initialized) return;
  await pool.query(schema);
  await pool.query(migrations);
  initialized = true;
}
