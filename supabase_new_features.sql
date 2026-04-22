-- Run this in Supabase SQL Editor (new query)
-- Creates app_config (editable header titles) and meal_plans tables

-- App config
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON app_config;
CREATE POLICY "Authenticated access" ON app_config
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

INSERT INTO app_config (key, value) VALUES
  ('overtitle', 'a personal collection'),
  ('title', 'Oren''s Cookbook'),
  ('subtitle', 'Collagen · Skin Health · Carnivore Protocol')
ON CONFLICT (key) DO NOTHING;

-- Meal plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Week Plan',
  days jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access" ON meal_plans;
CREATE POLICY "Authenticated access" ON meal_plans
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
