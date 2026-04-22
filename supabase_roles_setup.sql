-- ============================================================
-- Read-only viewer roles
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id   UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can insert their own profile row (from trigger)
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. Auto-create viewer profile on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, role) VALUES (NEW.id, 'viewer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 3. Insert profiles for all EXISTING users (default viewer)
--    Then immediately set your own account to editor below.
-- ============================================================
INSERT INTO profiles (id, role)
SELECT id, 'viewer' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. SET YOURSELF AS EDITOR
--    Replace YOUR_USER_ID with your actual user UUID.
--    Find it in: Supabase Dashboard → Authentication → Users
-- ============================================================
-- UPDATE profiles SET role = 'editor' WHERE id = 'YOUR_USER_ID';

-- ============================================================
-- 5. Lock down write access on recipes to editors only
-- ============================================================
DROP POLICY IF EXISTS "recipes_insert" ON recipes;
DROP POLICY IF EXISTS "recipes_update" ON recipes;
DROP POLICY IF EXISTS "recipes_delete" ON recipes;

CREATE POLICY "recipes_insert" ON recipes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "recipes_update" ON recipes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "recipes_delete" ON recipes FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

-- ============================================================
-- 6. Lock down tags
-- ============================================================
DROP POLICY IF EXISTS "tags_insert" ON tags;
DROP POLICY IF EXISTS "tags_update" ON tags;
DROP POLICY IF EXISTS "tags_delete" ON tags;

CREATE POLICY "tags_insert" ON tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "tags_update" ON tags FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "tags_delete" ON tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

-- ============================================================
-- 7. Lock down meal_plans and app_config
-- ============================================================
DROP POLICY IF EXISTS "meal_plans_insert" ON meal_plans;
DROP POLICY IF EXISTS "meal_plans_update" ON meal_plans;
DROP POLICY IF EXISTS "meal_plans_delete" ON meal_plans;

CREATE POLICY "meal_plans_insert" ON meal_plans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "meal_plans_update" ON meal_plans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "meal_plans_delete" ON meal_plans FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

DROP POLICY IF EXISTS "app_config_insert" ON app_config;
DROP POLICY IF EXISTS "app_config_update" ON app_config;

CREATE POLICY "app_config_insert" ON app_config FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "app_config_update" ON app_config FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));
