-- Run this in Supabase SQL Editor to enable full bilingual content storage.

-- Recipes: stores translated content keyed by language code, e.g. { "he": { title, description, ingredients, steps, notes } }
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- Tags
ALTER TABLE tags ADD COLUMN IF NOT EXISTS name_he TEXT;

-- Ingredient catalogue
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS name_he TEXT;

-- Ingredient categories
ALTER TABLE ingredient_categories ADD COLUMN IF NOT EXISTS name_he TEXT;

-- Recipe categories
ALTER TABLE recipe_categories ADD COLUMN IF NOT EXISTS name_he TEXT;

-- Meal plans
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS name_he TEXT;
