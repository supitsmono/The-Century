-- Complete Database Setup voor The Century
-- Voer dit uit in Supabase SQL Editor om alles in één keer op te zetten

-- ============================================
-- STEP 1: Base Schema (als tabel nog niet bestaat)
-- ============================================

-- Capsules table
CREATE TABLE IF NOT EXISTS capsules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  country VARCHAR(100) NOT NULL,
  town VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  message TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  video TEXT,
  age_at_creation INTEGER NOT NULL,
  archival_year INTEGER NOT NULL,
  archival_month VARCHAR(50) NOT NULL,
  archival_day INTEGER NOT NULL,
  archival_time VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_id VARCHAR(255),
  email VARCHAR(255)
);

-- Base indexes
CREATE INDEX IF NOT EXISTS idx_capsules_created_at ON capsules(created_at);
CREATE INDEX IF NOT EXISTS idx_capsules_payment_status ON capsules(payment_status);
CREATE INDEX IF NOT EXISTS idx_capsules_payment_id ON capsules(payment_id);

-- ============================================
-- STEP 2: Phase 1 Migration
-- ============================================

-- Add public_id column (UUID)
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS public_id UUID UNIQUE;

-- Generate UUIDs for existing rows (if any)
UPDATE capsules SET public_id = gen_random_uuid() WHERE public_id IS NULL;

-- Make public_id NOT NULL after populating
DO $$
BEGIN
  -- Only alter if column exists and can be made NOT NULL
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'capsules' AND column_name = 'public_id') THEN
    ALTER TABLE capsules ALTER COLUMN public_id SET NOT NULL;
  END IF;
END $$;

-- Add open_at TIMESTAMPTZ column (replaces archival_year/month/day/time)
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS open_at TIMESTAMPTZ;

-- Migrate existing archival data to open_at (if any rows exist)
UPDATE capsules 
SET open_at = MAKE_TIMESTAMPTZ(
  archival_year::INTEGER,
  CASE archival_month
    WHEN 'January' THEN 1 WHEN 'February' THEN 2 WHEN 'March' THEN 3
    WHEN 'April' THEN 4 WHEN 'May' THEN 5 WHEN 'June' THEN 6
    WHEN 'July' THEN 7 WHEN 'August' THEN 8 WHEN 'September' THEN 9
    WHEN 'October' THEN 10 WHEN 'November' THEN 11 WHEN 'December' THEN 12
    ELSE 1
  END,
  archival_day::INTEGER,
  SPLIT_PART(archival_time, ':', 1)::INTEGER,
  SPLIT_PART(archival_time, ':', 2)::INTEGER,
  0,
  'UTC'
)
WHERE open_at IS NULL AND archival_year IS NOT NULL;

-- Set default open_at for new rows (year 2125, January 1, 00:00 UTC)
ALTER TABLE capsules ALTER COLUMN open_at SET DEFAULT '2125-01-01 00:00:00+00';

-- Add state column (replaces payment_status for clearer state machine)
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS state VARCHAR(50) DEFAULT 'draft';

-- Migrate payment_status to state
UPDATE capsules 
SET state = CASE 
  WHEN payment_status = 'pending' THEN 'pending_payment'
  WHEN payment_status = 'paid' THEN 'paid'
  ELSE 'draft'
END
WHERE state = 'draft';

-- Add CHECK constraint for state
ALTER TABLE capsules DROP CONSTRAINT IF EXISTS capsules_state_check;
ALTER TABLE capsules ADD CONSTRAINT capsules_state_check 
  CHECK (state IN ('draft', 'pending_payment', 'paid', 'sealed'));

-- Add indexes for Phase 1
CREATE INDEX IF NOT EXISTS idx_capsules_public_id ON capsules(public_id);
CREATE INDEX IF NOT EXISTS idx_capsules_state ON capsules(state);
CREATE INDEX IF NOT EXISTS idx_capsules_open_at ON capsules(open_at);

-- Add webhook idempotency table for Stripe events
CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  capsule_id INTEGER REFERENCES capsules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);

-- ============================================
-- Verification Queries (optioneel - check of alles werkt)
-- ============================================

-- Check if all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'capsules'
ORDER BY ordinal_position;

-- Check constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'capsules'::regclass;

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'capsules';

-- Check webhook_events table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'webhook_events';
