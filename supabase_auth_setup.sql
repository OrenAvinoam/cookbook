-- Run this in Supabase SQL Editor to enable auth-gated access.
-- IMPORTANT: Create your user first via Supabase Dashboard > Authentication > Users > "Add user"
-- Use your email + a strong password. Then run this script.

-- Update RLS policies so only authenticated users can access data

-- Recipes table
DROP POLICY IF EXISTS "Allow all" ON recipes;
DROP POLICY IF EXISTS "Authenticated access" ON recipes;
CREATE POLICY "Authenticated access" ON recipes
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tags table
DROP POLICY IF EXISTS "Allow all" ON tags;
DROP POLICY IF EXISTS "Authenticated access" ON tags;
CREATE POLICY "Authenticated access" ON tags
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
