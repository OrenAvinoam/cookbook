// One-time seeding script — run with: node scripts/seed_recipes.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local manually (no dotenv dependency needed)
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter(l => l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY   // service role key bypasses RLS
);

// ── Helper: call Google Translate free endpoint ───────────────────────────────
async function gt(text, from, to) {
  if (!text?.trim()) return text ?? "";
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GT ${r.status}`);
  const d = await r.json();
  return d[0].map(x => x[0]).join("").replace(/[\u0591-\u05C7]/g, ""); // strip niqqud
}

async function translateContent(c) {
  const T = s => s ? gt(s, "en", "he") : Promise.resolve(s);
  const [title, description, dose, total_time] = await Promise.all([
    T(c.title), T(c.description), T(c.dose), T(c.total_time),
  ]);
  const ingredients = await Promise.all(
    (c.ingredients || []).map(async i => ({ ...i, name: await T(i.name) }))
  );
  const steps = await Promise.all(
    (c.steps || []).map(async s => ({ ...s, title: await T(s.title), body: await T(s.body) }))
  );
  const notes = await Promise.all(
    (c.notes || []).map(async n => ({ ...n, title: await T(n.title), body: await T(n.body) }))
  );
  return { title, description, dose, total_time, ingredients, steps, notes };
}

// ── Recipes ───────────────────────────────────────────────────────────────────

const recipes = [

  // ── 1. Keto Cereal ──────────────────────────────────────────────────────────
  {
    emoji: "🥣",
    category: "breakfast",
    tag_ids: [],
    servings: "8",
    prep_time: "20 min",
    cook_time: "40 min",
    total_time: "1 hour",
    dose: null,
    title: "Keto Cereal",
    description: "Crunchy, protein-rich keto cereal made from a cream cheese and egg white base. Comes in cinnamon, chocolate, and puppy chow variations.",
    ingredients: [
      { amount: "226g",    name: "cream cheese, softened" },
      { amount: "2",       name: "eggs, separated" },
      { amount: "3.5 tbsp", name: "unflavored gelatin" },
      { amount: "2 tbsp",  name: "egg white powder" },
      { amount: "1 tbsp",  name: "collagen peptides" },
      { amount: "to taste", name: "sweetener (allulose or erythritol)" },
      { amount: "to taste", name: "salt" },
    ],
    steps: [
      { title: "Prep", body: "Bring cream cheese to room temperature. Preheat oven to 150–160°C. Line two baking sheets with parchment.", time: "5 min" },
      { title: "Mix base", body: "In a large bowl, combine egg yolks, cream cheese, all dry ingredients (gelatin, egg white powder, collagen), sweetener, salt, and any variation flavorings (see Notes). Mix until smooth.", time: "5 min" },
      { title: "Whip whites", body: "In a clean bowl, beat egg whites to stiff, glossy peaks.", time: "3 min" },
      { title: "Fold", body: "Gently fold whipped whites into the cream cheese mixture in three additions, keeping as much air as possible.", time: "2 min" },
      { title: "Spread & bake", body: "Spread the batter as thinly and evenly as possible on the lined baking sheets. Bake at 150–160°C for 25–35 min until set and lightly golden.", time: "30 min" },
      { title: "Break & dry", body: "Remove from oven and break into cereal-sized pieces. Return to the oven on very low heat (100°C) or leave in the turned-off warm oven until completely dry and crunchy, 20–30 min more.", time: "30 min" },
    ],
    notes: [
      { title: "Cinnamon variation", body: "Add to the base: 2 tbsp butter powder, 1 tsp vanilla extract, ½ tsp almond extract, 1.5–2 tsp cinnamon." },
      { title: "Chocolate variation", body: "Add to the base: 1 tbsp butter powder, 2 tbsp unsweetened cocoa, 1 tsp vanilla extract, and optionally ½ tbsp extra collagen." },
      { title: "Puppy Chow variation", body: "Start with chocolate cereal. Melt 60g sugar-free chocolate chips with 1.5 tbsp 100% peanut butter and 1 tbsp butter. Toss cereal in the coating, then dust with a mixture of 30–40g powdered allulose + 1 tbsp cocoa + pinch salt (and optionally collagen)." },
      { title: "Storage", body: "Keeps in an airtight container at room temperature for up to 1 week. Ensure pieces are fully dry before storing or they will soften." },
    ],
  },

  // ── 2. Keto Cookie Butter ───────────────────────────────────────────────────
  {
    emoji: "🍪",
    category: "snack",
    tag_ids: [],
    servings: "20 tbsp",
    prep_time: "10 min",
    cook_time: "10 min",
    total_time: "20 min",
    dose: null,
    title: "Keto Cookie Butter",
    description: "A ketovore Biscoff-style spread — silky, glossy, and warmly spiced with cinnamon. Yields ~400g. Keeps refrigerated for 2–3 weeks.",
    ingredients: [
      { amount: "138g",     name: "unsalted butter" },
      { amount: "115g",     name: "heavy cream" },
      { amount: "40–46g",   name: "nonfat milk powder" },
      { amount: "12–17g",   name: "butter powder" },
      { amount: "30–35g",   name: "allulose" },
      { amount: "1¾–2¼ tsp", name: "cinnamon" },
      { amount: "¼ tsp",    name: "salt" },
      { amount: "¾–1 tsp",  name: "vanilla extract" },
    ],
    steps: [
      { title: "Melt butter", body: "Melt butter in a small saucepan over medium heat. For deeper flavor, continue cooking until the milk solids turn lightly golden and it smells nutty (brown butter). Watch closely.", time: "5 min" },
      { title: "Combine", body: "Reduce heat to low. Whisk in the heavy cream, nonfat milk powder, butter powder, allulose, cinnamon, and salt until fully incorporated.", time: "3 min" },
      { title: "Add vanilla", body: "Remove from heat and stir in vanilla extract.", time: "—" },
      { title: "Blend", body: "While still warm, transfer to a food processor and blend continuously for 1–2 min until the mixture turns silky and glossy.", time: "2 min" },
      { title: "Adjust consistency", body: "If too thick, add 1–2 tsp warm cream and blend again briefly.", time: "—" },
      { title: "Jar & store", body: "Pour into a clean jar, seal, and refrigerate. Keeps for 2–3 weeks.", time: "—" },
    ],
    notes: [
      { title: "Serving from cold", body: "To soften from the fridge: place jar in hot water for 5–10 min, or microwave on low power for 10–15 seconds." },
      { title: "Brown butter tip", body: "Browning the butter (taking it just past melted to lightly nutty) adds a significant depth of flavor reminiscent of the real Biscoff spread." },
    ],
  },

  // ── 3. Carnivore Vanilla Ice Cream ──────────────────────────────────────────
  {
    emoji: "🍦",
    category: "dessert",
    tag_ids: [],
    servings: "7 scoops",
    prep_time: "20 min",
    cook_time: "15 min",
    total_time: "7 hours",
    dose: "~5g collagen · ~170–180 kcal per scoop",
    title: "Carnivore Vanilla Ice Cream",
    description: "A rich, custard-based vanilla ice cream fortified with collagen peptides. Clean carnivore ingredients, approximately 170–180 kcal per scoop.",
    ingredients: [
      { amount: "300ml",   name: "heavy cream" },
      { amount: "3",       name: "egg yolks" },
      { amount: "40–45g",  name: "allulose" },
      { amount: "1–1.5 tsp", name: "vanilla extract" },
      { amount: "35g",     name: "unflavored collagen peptides" },
      { amount: "pinch",   name: "salt" },
    ],
    steps: [
      { title: "Heat cream", body: "Combine heavy cream, allulose, and salt in a saucepan. Heat over medium heat until steaming and just about to simmer — do not boil.", time: "5 min" },
      { title: "Temper yolks", body: "Whisk egg yolks in a separate bowl. Slowly ladle a third of the hot cream into the yolks while whisking constantly to raise their temperature without scrambling.", time: "3 min" },
      { title: "Cook custard", body: "Pour the tempered yolk mixture back into the saucepan. Cook over low heat, stirring constantly with a spatula, until the custard slightly thickens and coats the back of a spoon (~75–80°C). Do not let it boil.", time: "7 min" },
      { title: "Add collagen & vanilla", body: "Remove from heat immediately. Add vanilla extract and collagen peptides, whisking until completely smooth and no lumps remain.", time: "2 min" },
      { title: "Chill", body: "Transfer to a bowl or container. Place plastic wrap directly on the surface to prevent a skin. Refrigerate for at least 4–6 hours, or overnight for best results.", time: "6 hours" },
      { title: "Churn", body: "Churn in an ice cream machine for 15–20 min until thick and creamy. Transfer to a container and freeze for 1–2 hours to firm up before scooping.", time: "20 min + 2 hours" },
    ],
    notes: [
      { title: "No-machine method", body: "Pour chilled custard into a shallow freezer-safe dish. Every 30 min for 2–3 hours, scrape and vigorously stir with a fork to break up ice crystals." },
      { title: "Macros (per scoop)", body: "~5g collagen, ~170–180 kcal. Exact macros depend on the cream and collagen brand used." },
      { title: "Key tip", body: "Don't rush the custard — cooking it too hot will scramble the eggs. If you see any lumps forming, remove from heat immediately and strain through a fine mesh sieve." },
    ],
  },

  // ── 4. Keto Apple Crumble Cake ──────────────────────────────────────────────
  {
    emoji: "🍎",
    category: "dessert",
    tag_ids: [],
    servings: "10 slices",
    prep_time: "25 min",
    cook_time: "45 min",
    total_time: "1.5 hours",
    dose: null,
    title: "Keto Apple Crumble Cake",
    description: "A moist keto cake made with unsweetened applesauce and a protein-flour blend, topped with a buttery cinnamon crumble and vanilla glaze.",
    ingredients: [
      // Wet
      { amount: "2 large + 1 yolk", name: "eggs (or 2 XL + 1 yolk)" },
      { amount: "260g",    name: "unsweetened applesauce" },
      { amount: "115–120g", name: "butter, melted and cooled" },
      { amount: "100ml",   name: "heavy cream" },
      { amount: "1 tsp",   name: "vanilla extract" },
      // Dry
      { amount: "110g",    name: "fine almond flour" },
      { amount: "20g",     name: "egg white powder" },
      { amount: "20g",     name: "whey protein isolate (unflavored)" },
      { amount: "20g",     name: "acacia fiber" },
      { amount: "1 tbsp",  name: "gelatin (dry, no blooming)" },
      { amount: "1.5 tsp", name: "baking powder" },
      { amount: "½ tsp",   name: "baking soda" },
      { amount: "1.5 tsp", name: "cinnamon" },
      { amount: "½ tsp",   name: "salt" },
      // Sweetener
      { amount: "½ cup",   name: "allulose" },
      { amount: "⅓ cup",   name: "erythritol" },
      // Crumble
      { amount: "6 tbsp",  name: "almond flour (for crumble)" },
      { amount: "2 tbsp",  name: "cold butter (for crumble)" },
      { amount: "2 tbsp",  name: "allulose (for crumble)" },
      { amount: "2 tbsp",  name: "erythritol (for crumble)" },
      { amount: "½ tsp",   name: "cinnamon (for crumble)" },
      { amount: "pinch",   name: "salt (for crumble)" },
      // Glaze
      { amount: "2 tbsp",  name: "heavy cream (for glaze)" },
      { amount: "2 tbsp",  name: "powdered sweetener (for glaze)" },
      { amount: "to taste", name: "vanilla extract (for glaze)" },
      { amount: "pinch",   name: "cinnamon (for glaze)" },
      { amount: "½ tsp",   name: "soft butter (for glaze, optional)" },
    ],
    steps: [
      { title: "Preheat & prep pan", body: "Preheat oven to 170°C. Grease a loaf pan or a 22cm round baking pan.", time: "5 min" },
      { title: "Mix wet ingredients", body: "In a large bowl, whisk together the eggs, extra yolk, applesauce, cooled melted butter, heavy cream, and vanilla extract until smooth.", time: "3 min" },
      { title: "Mix dry ingredients", body: "In a separate bowl, whisk together almond flour, egg white powder, whey isolate, acacia fiber, dry gelatin, baking powder, baking soda, cinnamon, salt, allulose, and erythritol until evenly combined.", time: "3 min" },
      { title: "Combine", body: "Add the dry mixture to the wet and stir just until no dry streaks remain and the batter is smooth. Do not overmix.", time: "2 min" },
      { title: "Make crumble", body: "In a small bowl, combine almond flour, cold butter, allulose, erythritol, cinnamon, and salt. Rub with fingertips until the mixture resembles coarse crumbs.", time: "3 min" },
      { title: "Assemble & bake", body: "Pour batter into the prepared pan. Distribute crumble evenly over the top. Bake for 40–50 min, until a toothpick inserted in the center comes out with moist crumbs (not wet batter).", time: "45 min" },
      { title: "Cool", body: "Cool in the pan for 20–30 min, then transfer to a wire rack and cool completely before glazing.", time: "30 min" },
      { title: "Make & drizzle glaze", body: "Whisk together cream, powdered sweetener, vanilla, cinnamon, and optional butter until smooth. Drizzle over the fully cooled cake.", time: "2 min" },
    ],
    notes: [
      { title: "Doneness tip", body: "Moist crumbs on the toothpick is the target — a perfectly clean toothpick usually means it's slightly overdone. The cake firms up as it cools." },
      { title: "Acacia fiber", body: "Adds moisture retention and prebiotic fiber. Can be substituted with psyllium husk powder (use slightly less)." },
      { title: "Sweetener note", body: "The allulose-erythritol blend keeps sweetness clean. Allulose helps the crumble caramelize; erythritol adds structure." },
    ],
  },

  // ── 5. Keto Crepes ──────────────────────────────────────────────────────────
  {
    emoji: "🥞",
    category: "breakfast",
    tag_ids: [],
    servings: "7 crepes",
    prep_time: "15 min",
    cook_time: "20 min",
    total_time: "45 min",
    dose: null,
    title: "Keto Crepes",
    description: "Thin, flexible, and lightly sweet keto crepes using a gelatin base for structure. Makes 6–8 crepes that hold fillings without tearing.",
    ingredients: [
      { amount: "4",       name: "eggs" },
      { amount: "120ml",   name: "heavy cream" },
      { amount: "60ml",    name: "water" },
      { amount: "20g",     name: "butter, melted" },
      { amount: "25g",     name: "unflavored beef or marine gelatin" },
      { amount: "40ml",    name: "cold water (for blooming gelatin)" },
      { amount: "15g",     name: "nonfat milk powder" },
      { amount: "15g",     name: "butter powder" },
      { amount: "20–30g",  name: "allulose" },
      { amount: "1 tsp",   name: "vanilla extract" },
      { amount: "pinch",   name: "salt" },
    ],
    steps: [
      { title: "Bloom gelatin", body: "Sprinkle gelatin over the 40ml cold water in a small bowl. Let it sit undisturbed for 5–10 min until it absorbs the water and becomes spongy.", time: "10 min" },
      { title: "Dissolve gelatin", body: "Gently heat the bloomed gelatin over very low heat or in the microwave in short bursts until just dissolved and liquid. Do not boil.", time: "2 min" },
      { title: "Blend batter", body: "Combine eggs, heavy cream, 60ml water, melted butter, dissolved gelatin, milk powder, butter powder, allulose, vanilla, and salt in a blender. Blend until completely smooth.", time: "2 min" },
      { title: "Rest batter", body: "Let the batter rest for 10–15 min. It should be thin and pourable like classic crepe batter. If too thick, add 1–2 tbsp water and stir.", time: "15 min" },
      { title: "Cook crepes", body: "Lightly butter a non-stick pan or crepe pan and heat over medium-low. Pour a small ladle of batter and immediately tilt and swirl the pan to spread it thinly across the surface.", time: "—" },
      { title: "Flip", body: "Cook for 45–60 seconds until the edges look set and the surface is mostly dry. Flip carefully and cook the second side for 20–30 seconds. Slide onto a plate.", time: "1.5 min per crepe" },
    ],
    notes: [
      { title: "Why gelatin?", body: "The gelatin replaces the gluten that normally gives crepes their flexibility. Without it, egg-based crepes tend to crack and tear." },
      { title: "Make-ahead tip", body: "The batter can rest in the fridge overnight — the crepes will be even thinner and more pliable the next day." },
      { title: "Serving ideas", body: "Fill with keto cookie butter and a sprinkle of cinnamon, whipped cream and berries, or cream cheese with a drop of vanilla." },
    ],
  },

];

// ── Insert ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Translating and inserting recipes…\n");

  for (const recipe of recipes) {
    process.stdout.write(`  → ${recipe.title}… `);
    try {
      const heContent = await translateContent(recipe);

      const payload = {
        emoji: recipe.emoji,
        category: recipe.category,
        tag_ids: recipe.tag_ids,
        servings: recipe.servings,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        total_time: recipe.total_time,
        dose: recipe.dose,
        nutrition: null,
        image_url: null,
        image_position: "50% 50%",
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        notes: recipe.notes,
        translations: { he: heContent },
      };

      const { data, error } = await supabase.from("recipes").insert(payload).select("id, title").single();
      if (error) throw error;
      console.log(`✓ (id ${data.id})`);
    } catch (err) {
      console.log(`✗ ERROR: ${err.message}`);
    }

    // Small delay to avoid rate-limiting Google Translate
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("\nDone.");
}

main();
