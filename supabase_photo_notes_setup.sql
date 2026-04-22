-- ============================================================
-- Photo + Day Notes setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add image columns to recipes
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS image_url      TEXT,
  ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT '50% 50%';

-- 2. Add day_notes column to meal_plans
ALTER TABLE meal_plans
  ADD COLUMN IF NOT EXISTS day_notes JSONB DEFAULT '{}';

-- ============================================================
-- 3. Supabase Storage: recipe-images bucket
-- Go to: Storage → New bucket
--   Name: recipe-images
--   Public: YES (so images load without auth tokens)
--
-- Then add this RLS policy to the bucket:
--   Policy name: Authenticated users can upload
--   Operation: INSERT
--   Target roles: authenticated
--   Policy definition: (auth.uid() IS NOT NULL)
--
-- And this policy for reads:
--   Policy name: Public read
--   Operation: SELECT
--   Target roles: public
--   Policy definition: true
-- ============================================================
