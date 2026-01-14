-- Migration 002: Phase 2 - Supabase Storage Integration
-- Replaces base64 media storage with Supabase Storage paths
-- Adds storage reference fields while keeping legacy fields for backward compatibility

-- Add new storage reference fields
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS photos_paths TEXT[] DEFAULT '{}';
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS photos_meta JSONB DEFAULT '[]'::jsonb;
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS video_path TEXT;
ALTER TABLE capsules ADD COLUMN IF NOT EXISTS video_meta JSONB;

-- Add constraint to ensure photos_paths is not null (default handles this, but explicit is better)
ALTER TABLE capsules ALTER COLUMN photos_paths SET DEFAULT '{}';
ALTER TABLE capsules ALTER COLUMN photos_paths SET NOT NULL;

-- Add indexes for storage paths (if needed for queries later)
CREATE INDEX IF NOT EXISTS idx_capsules_photos_paths ON capsules USING GIN(photos_paths);
CREATE INDEX IF NOT EXISTS idx_capsules_video_path ON capsules(video_path) WHERE video_path IS NOT NULL;

-- Mark legacy base64 fields as deprecated (keep for backward compatibility during migration)
-- TODO: Remove these columns after migration is complete and all data is migrated
-- photos TEXT[] -- DEPRECATED: Use photos_paths instead
-- video TEXT -- DEPRECATED: Use video_path instead
-- 
-- Note: These fields are kept for now to allow gradual migration.
-- New code should NOT write to photos/video fields.
-- Existing data can be migrated separately if needed.

-- Migration notes:
-- 1. Old base64 data in photos[] and video columns will remain but should not be used
-- 2. New media uploads use photos_paths[] and video_path
-- 3. Frontend should read from new fields first, fallback to old fields if needed
-- 4. After migration period, old fields can be dropped
