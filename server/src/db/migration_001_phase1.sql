-- Migration 001: Phase 1 Backend Safety Updates
-- Adds public_id, fixes timestamps, adds state constraints

-- Add public_id column (UUID)
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS public_id UUID UNIQUE;

-- Generate UUIDs for existing rows (if any)
UPDATE capsules SET public_id = gen_random_uuid() WHERE public_id IS NULL;

-- Make public_id NOT NULL after populating
ALTER TABLE capsules ALTER COLUMN public_id SET NOT NULL;

-- Add open_at TIMESTAMPTZ column (replaces archival_year/month/day/time)
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS open_at TIMESTAMPTZ;

-- Migrate existing archival data to open_at (if any rows exist)
-- Assuming archival data is for year 2125, we'll calculate the timestamp
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

-- Keep payment_status for backward compatibility during migration, but prefer state
-- We'll remove payment_status in a later migration if needed

-- Add indexes
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
