-- Run this in your Supabase SQL Editor to set up the recipes table

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  subtitle text,
  tag text,
  tag_color text default '#6A9E82',
  emoji text default '🍽️',
  description text,
  servings text,
  prep_time text,
  cook_time text,
  total_time text,
  dose text,
  ingredients jsonb default '[]'::jsonb,
  steps jsonb default '[]'::jsonb,
  notes jsonb default '[]'::jsonb
);

-- Allow public read/write (private use — no auth needed)
alter table recipes enable row level security;
create policy "Allow all" on recipes for all using (true) with check (true);

-- Seed data: Collagen Bone Broth
insert into recipes (title, subtitle, tag, tag_color, emoji, description, servings, prep_time, cook_time, total_time, dose, ingredients, steps, notes)
values (
  'Collagen Bone Broth',
  'Oxtail & Chicken Wings · Ninja Foodi Max OP500',
  'Daily Morning',
  '#6A9E82',
  '🍲',
  'A balanced, gently flavoured broth optimised for collagen and skin health. Pressure cooked in the Ninja Foodi Max — higher collagen yield than stovetop in a fraction of the time.',
  '8',
  '45 min',
  '2h 30min',
  '~4 hours',
  '300ml daily, warm, on empty stomach',
  '[
    {"amount": "800g", "name": "oxtail pieces"},
    {"amount": "700g", "name": "chicken wings (whole, including tips)"},
    {"amount": "2 tbsp", "name": "apple cider vinegar"},
    {"amount": "2 litres", "name": "cold water (do not exceed MAX fill line)"},
    {"amount": "2", "name": "celery stalks"},
    {"amount": "2", "name": "medium carrots"},
    {"amount": "4 sprigs", "name": "fresh thyme"},
    {"amount": "2", "name": "bay leaves"},
    {"amount": "1 tsp", "name": "black peppercorns"},
    {"amount": "1 tsp", "name": "sea salt (to taste, at end only)"}
  ]'::jsonb,
  '[
    {"title": "Blanch the bones", "time": "10 min", "body": "Place oxtail and chicken wings in the Ninja Foodi pot, cover with cold water, and use Sear/Sauté on High to bring to a boil. Boil hard for 8–10 minutes. Drain, rinse all bones under cold water, wipe out the pot. This removes impurities and ensures a clean-tasting broth."},
    {"title": "Optional: Sear for depth", "time": "5–6 min", "body": "Return blanched bones to the dry pot. Sear/Sauté on High, turning oxtail pieces until lightly golden. Adds gentle richness without making the broth heavy. Skip for a lighter, cleaner taste."},
    {"title": "ACV soak", "time": "30 min", "body": "Add apple cider vinegar and 2 litres cold water. Do not exceed the MAX fill line. Let sit off-heat for 30 minutes. The acid draws collagen out of the bone matrix — this step meaningfully increases yield."},
    {"title": "Add aromatics", "time": "2 min", "body": "Add celery, carrots, thyme, bay leaves, and peppercorns. Do not add salt yet."},
    {"title": "Pressure cook", "time": "2h 30min", "body": "Close and lock the lid. Set valve to SEAL. Select Pressure Cook on High for 2 hours 30 minutes. The Ninja takes 20–25 minutes to pressurise before the timer begins. This extracts more collagen than 12 hours of stovetop simmering."},
    {"title": "Natural pressure release", "time": "30 min", "body": "When the cycle ends, allow pressure to release naturally for at least 30 minutes. Do not force-release — natural release keeps broth clearer and prevents fat from emulsifying."},
    {"title": "Strain and season", "time": "10 min", "body": "Strain through a fine mesh sieve or cheesecloth into a large bowl, discarding all solids. Season with sea salt to taste. Let cool to room temperature."},
    {"title": "Gel test", "time": "1 hour", "body": "Refrigerate until fully cold. A good broth gels solid like jelly — this is your collagen. The firmer the gel, the higher the yield. Skim the fat cap for a cleaner morning drink, or leave a thin layer for richness."},
    {"title": "Store and serve", "time": "—", "body": "Portion into jars or silicone moulds and freeze as daily 300ml servings. Reheat until warm but not boiling. Keeps 5 days in the fridge, 3 months in the freezer."}
  ]'::jsonb,
  '[
    {"title": "Chicken wings over drumsticks", "body": "Wings have a far higher ratio of cartilage and connective tissue to muscle. Wing tips especially are almost pure collagen. Drumsticks are predominantly muscle — poor collagen yield."},
    {"title": "The gel test", "body": "If broth stays liquid after refrigerating, next batch: more wing tips, extend pressure cook to 3 hours, or increase ACV soak time. A firm jelly = high collagen."},
    {"title": "Drink warm, not hot", "body": "Very hot liquids first thing on an empty stomach can irritate the gut lining. Warm is ideal for absorption and comfort."}
  ]'::jsonb
);

-- Seed data: Collagen Gummies
insert into recipes (title, subtitle, tag, tag_color, emoji, description, servings, prep_time, cook_time, total_time, dose, ingredients, steps, notes)
values (
  'Collagen Gummies',
  'Berry · Marine Collagen · Vitamin C',
  'Daily Snack',
  '#C47A5A',
  '🍬',
  'Sweet, slightly sour, berry-flavoured collagen gummies. Nearly zero carb, no sugar, carnivore-friendly. Marine collagen and vitamin C added off-heat for maximum skin synthesis benefit.',
  '20',
  '15 min',
  '5 min',
  '2h 20min (incl. setting)',
  '2–3 gummies daily with morning broth',
  '[
    {"amount": "30g", "name": "beef gelatin powder (unflavoured, grass-fed)"},
    {"amount": "120ml", "name": "cold water"},
    {"amount": "120ml", "name": "hot water"},
    {"amount": "80g", "name": "frozen raspberries or mixed berries"},
    {"amount": "2 tbsp", "name": "fresh lemon juice"},
    {"amount": "10g (1 scoop)", "name": "Further Food marine collagen powder"},
    {"amount": "1½ tsp", "name": "sodium ascorbate powder (buffered vitamin C)"},
    {"amount": "1 tbsp", "name": "allulose sweetener"},
    {"amount": "½ tsp", "name": "monk fruit sweetener"},
    {"amount": "¼ tsp", "name": "citric acid (optional, for extra sourness)"}
  ]'::jsonb,
  '[
    {"title": "Bloom the gelatin", "time": "5 min", "body": "Pour 120ml cold water into a small saucepan. Sprinkle gelatin evenly over the surface — do not stir. Let sit for 5 minutes to bloom. Un-bloomed gelatin creates lumps and uneven texture."},
    {"title": "Make the berry base", "time": "3 min", "body": "Blend 80g frozen berries with 120ml hot water using a hand blender until smooth. Strain through a fine sieve to remove seeds. You should have about 150–160ml of berry liquid."},
    {"title": "Melt and combine", "time": "5 min", "body": "Warm the bloomed gelatin over low heat, stirring gently until fully dissolved — about 2–3 minutes. Do not boil. Remove from heat and cool 3–4 minutes until below 70°C. Add berry liquid and lemon juice. Stir to combine."},
    {"title": "Add collagen and vitamin C off-heat", "time": "2 min", "body": "Critical — add marine collagen and sodium ascorbate only once below 70°C. Never add to boiling liquid. Heat degrades both significantly. Stir well until fully dissolved."},
    {"title": "Sweeten and taste", "time": "2 min", "body": "Add allulose, monk fruit, and citric acid if using. Stir well and taste. Should be sweet with a noticeable sour edge. Sourness mellows slightly once set. Adjust to preference."},
    {"title": "Pour and set", "time": "2 hours", "body": "Pour into silicone gummy moulds or a parchment-lined dish. Refrigerate for at least 2 hours until fully firm."},
    {"title": "Store and dose", "time": "—", "body": "Store in an airtight container in the fridge for up to 10 days. Eat 2–3 daily alongside your morning broth for optimal collagen synthesis timing."}
  ]'::jsonb,
  '[
    {"title": "Why allulose + monk fruit", "body": "Allulose is the best sweetener for gummies — clean sweetness identical to sugar, no cooling aftertaste, stays smooth when chilled. Erythritol crystallises and creates a gritty texture when refrigerated. Both are zero glycemic impact."},
    {"title": "Citric acid", "body": "Optional but great if you enjoy sour candy-style tartness. Purely a taste tool — zero carbs, completely carnivore-compatible."},
    {"title": "Marine collagen timing", "body": "Adding off-heat with vitamin C is the optimal window. Vitamin C is a direct cofactor for collagen synthesis — the two together are more effective than either alone."}
  ]'::jsonb
);
