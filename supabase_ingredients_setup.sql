-- ============================================================
-- Ingredient Catalogue + USDA Mapping Tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Ingredient categories
CREATE TABLE IF NOT EXISTS ingredient_categories (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  icon       text,
  sort_order int  DEFAULT 0,
  user_id    uuid REFERENCES auth.users(id)
);

ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingcat_select" ON ingredient_categories;
DROP POLICY IF EXISTS "ingcat_insert" ON ingredient_categories;
DROP POLICY IF EXISTS "ingcat_update" ON ingredient_categories;
DROP POLICY IF EXISTS "ingcat_delete" ON ingredient_categories;

CREATE POLICY "ingcat_select" ON ingredient_categories FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ingcat_insert" ON ingredient_categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "ingcat_update" ON ingredient_categories FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "ingcat_delete" ON ingredient_categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

-- ============================================================
-- 2. Ingredients
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name           text NOT NULL,
  aliases        text[]  DEFAULT '{}',
  category_id    uuid    REFERENCES ingredient_categories(id),
  nutrition_mode text    DEFAULT 'tracked' CHECK (nutrition_mode IN ('tracked', 'ignored', 'custom')),
  default_unit   text    DEFAULT 'g',
  notes          text,
  user_id        uuid    REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingr_select" ON ingredients;
DROP POLICY IF EXISTS "ingr_insert" ON ingredients;
DROP POLICY IF EXISTS "ingr_update" ON ingredients;
DROP POLICY IF EXISTS "ingr_delete" ON ingredients;

CREATE POLICY "ingr_select" ON ingredients FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ingr_insert" ON ingredients FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "ingr_update" ON ingredients FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "ingr_delete" ON ingredients FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

-- ============================================================
-- 3. USDA mappings (per 100g nutrients)
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredient_usda_mapping (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id  uuid REFERENCES ingredients(id) ON DELETE CASCADE UNIQUE,
  fdc_id         text NOT NULL,
  description    text,
  -- Nutrients stored per 100g:
  -- calories (kcal), protein (g), totalFat (g), totalCarb (g),
  -- fiber (g), sodium (mg), sugars (g), cholesterol (mg), saturatedFat (g)
  nutrients      jsonb DEFAULT '{}',
  fetched_at     timestamptz DEFAULT now()
);

ALTER TABLE ingredient_usda_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usdamap_select" ON ingredient_usda_mapping;
DROP POLICY IF EXISTS "usdamap_insert" ON ingredient_usda_mapping;
DROP POLICY IF EXISTS "usdamap_update" ON ingredient_usda_mapping;
DROP POLICY IF EXISTS "usdamap_delete" ON ingredient_usda_mapping;

CREATE POLICY "usdamap_select" ON ingredient_usda_mapping FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "usdamap_insert" ON ingredient_usda_mapping FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "usdamap_update" ON ingredient_usda_mapping FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

CREATE POLICY "usdamap_delete" ON ingredient_usda_mapping FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));

-- ============================================================
-- 4. Seed some starter categories (optional — delete if unwanted)
-- ============================================================
INSERT INTO ingredient_categories (name, icon, sort_order)
VALUES
  ('Proteins',     '🥩', 0),
  ('Vegetables',   '🥦', 1),
  ('Fruits',       '🍎', 2),
  ('Dairy & Eggs', '🥚', 3),
  ('Grains',       '🌾', 4),
  ('Fats & Oils',  '🫒', 5),
  ('Spices',       '🌿', 6),
  ('Sauces',       '🍯', 7)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. USDA API key
--    Add VITE_USDA_API_KEY=your_key to .env.local
--    Get a free key at: https://fdc.nal.usda.gov/api-key-signup.html
-- ============================================================
