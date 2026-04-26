// Google Translate unofficial free endpoint — no API key required
const GT = "https://translate.googleapis.com/translate_a/single";

// ─── Food ingredient dictionary ──────────────────────────────────────────────
// Overrides Google Translate for terms that have wrong default translations
// (e.g. "drumsticks" → drum sticks, "sage" → wise person, etc.).
// Keys are lowercase English; add more as needed.
const FOOD_DICT = {
  // Poultry / meat cuts
  "drumstick": "רגל עוף",
  "drumsticks": "רגלי עוף",
  "chicken drumstick": "רגל עוף",
  "chicken drumsticks": "רגלי עוף",
  "chicken thigh": "ירך עוף",
  "chicken thighs": "ירכי עוף",
  "chicken breast": "חזה עוף",
  "chicken breasts": "חזות עוף",
  "chicken wing": "כנף עוף",
  "chicken wings": "כנפי עוף",
  "chicken liver": "כבד עוף",
  "bone marrow": "מח עצם",
  "oxtail": "זנב שור",
  "tripe": "כרס",
  "lard": "שומן חזיר",
  "tallow": "חלב בקר",
  "suet": "שד בקר",
  "drippings": "שמן טיגון",
  // Herbs & spices
  "sage": "מרווה",
  "bay leaf": "עלה דפנה",
  "bay leaves": "עלי דפנה",
  "mace": "מייס",
  "lemongrass": "לימון דשא",
  "tarragon": "טרגון",
  "chervil": "צ׳רוויל",
  "marjoram": "מיורן",
  // Produce
  "dates": "תמרים",
  "date": "תמר",
  "prune": "שזיף מיובש",
  "prunes": "שזיפים מיובשים",
  "spring onion": "בצל ירוק",
  "spring onions": "בצלים ירוקים",
  "green onion": "בצל ירוק",
  "green onions": "בצלים ירוקים",
  "scallion": "בצל ירוק",
  "scallions": "בצלים ירוקים",
  "leek": "כרישה",
  "leeks": "כרישות",
  "chard": "מנגולד",
  "kale": "קייל",
  "beet": "סלק",
  "beets": "סלק",
  "beetroot": "סלק",
  // Pantry / liquids
  "stock": "ציר",
  "chicken stock": "ציר עוף",
  "beef stock": "ציר בקר",
  "vegetable stock": "ציר ירקות",
  "broth": "ציר",
  "chicken broth": "ציר עוף",
  "shortening": "שומן מוצק",
  "molasses": "דבש שחור",
  "tahini": "טחינה",
  "collagen": "קולגן",
  // Fish
  "bass": "דג בס",
  "anchovy": "אנשובי",
  "anchovies": "אנשובי",
  "mackerel": "מקרל",
  "halibut": "הליבוט",
  "cod": "בקלה",
  "sole": "סול",
};

// Strip Hebrew niqqud (vowel diacritics U+0591–U+05C7) from a string
function stripNikud(s) {
  if (!s) return s;
  return s.replace(/[\u0591-\u05C7]/g, "");
}

async function gtFetch(text, from, to) {
  const r = await fetch(`${GT}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`);
  if (!r.ok) throw new Error(`GT HTTP ${r.status}`);
  const d = await r.json();
  const result = d[0].map(x => x[0]).join("");
  return to === "he" ? stripNikud(result) : result;
}

export async function translateText(text, from = "en", to = "he") {
  if (!text?.trim() || from === to) return text ?? "";
  try { return await gtFetch(text.trim(), from, to); }
  catch (e) { console.warn("translate:", e.message); return text; }
}

// Like translateText but checks the food dictionary first (use for ingredient names).
export async function translateIngredientName(name, from = "en", to = "he") {
  if (!name?.trim() || from === to) return name ?? "";
  if (from === "en" && to === "he") {
    const key = name.trim().toLowerCase();
    if (FOOD_DICT[key]) return FOOD_DICT[key];
  }
  return translateText(name, from, to);
}

// Translate all text content of a recipe object.
// Amounts/units/times are left unchanged here — use localizeAmount / localizeTime for those.
export async function translateRecipeContent(content, from, to) {
  if (from === to) return content;
  const T = s => translateText(s, from, to);
  const TI = s => translateIngredientName(s, from, to);
  const [title, description, dose, total_time] = await Promise.all([
    T(content.title),
    T(content.description),
    T(content.dose),
    T(content.total_time),
  ]);
  const ingredients = await Promise.all(
    (content.ingredients || []).map(async i => ({ ...i, name: await TI(i.name) }))
  );
  const steps = await Promise.all(
    (content.steps || []).map(async s => ({ ...s, title: await T(s.title), body: await T(s.body) }))
  );
  const notes = await Promise.all(
    (content.notes || []).map(async n => ({ ...n, title: await T(n.title), body: await T(n.body) }))
  );
  return { title, description, dose, total_time, ingredients, steps, notes };
}

// Return a display-ready copy of a recipe in the given language.
// Falls back gracefully to English if no translation stored yet.
export function localizeRecipe(recipe, lang) {
  if (!recipe || lang === "en") return recipe;
  const t = recipe.translations?.[lang];
  if (!t) return recipe;
  return {
    ...recipe,
    title:       t.title       || recipe.title,
    description: t.description || recipe.description,
    ingredients: t.ingredients?.length ? t.ingredients : recipe.ingredients,
    steps:       t.steps?.length       ? t.steps       : recipe.steps,
    notes:       t.notes?.length       ? t.notes       : recipe.notes,
    dose:        t.dose        || recipe.dose,
    total_time:  t.total_time  || recipe.total_time,
  };
}

// Return a display-ready copy of a simple named item (tag, ingredient, category, plan).
export function localizeItem(item, lang) {
  if (!item || lang === "en") return item;
  return { ...item, name: item.name_he || item.name };
}

// Convert a time string like "30 min", "1.5 hours", "1h 30m" to Hebrew.
// Returns the original string unchanged if it cannot be parsed or lang !== "he".
export function localizeTime(str, lang) {
  if (!str || lang !== "he") return str;
  const s = str.trim().toLowerCase();

  if (/overnight|over\s*night/.test(s)) return "לילה שלם";
  if (/few\s*days|couple\s*of\s*days/.test(s)) return "כמה ימים";

  let hours = 0, mins = 0;

  // "H:MM"
  let m = s.match(/^(\d+):(\d{2})$/);
  if (m) { hours = parseInt(m[1]); mins = parseInt(m[2]); }

  // "Xh Ym" or "X hour(s) [and] Y min(s)"
  if (!hours && !mins) {
    m = s.match(/(\d+(?:[.,]\d+)?)\s*(?:h(?:r?s?|ours?)?)[\s,]+(?:and\s+)?(\d+(?:[.,]\d+)?)\s*(?:m(?:in(?:utes?|s?)?)?)/);
    if (m) { hours = parseFloat(m[1]); mins = parseFloat(m[2]); }
  }

  // Just hours: "Xh" / "X hr(s)" / "X hour(s)"
  if (!hours && !mins) {
    m = s.match(/^~?(\d+(?:[.,]\d+)?)\s*(?:h(?:r?s?|ours?)?)[.+]?\s*$/);
    if (m) hours = parseFloat(m[1].replace(",", "."));
  }

  // Just minutes: "X min(s)" / "X minute(s)"
  if (!hours && !mins) {
    m = s.match(/^~?(\d+(?:[.,]\d+)?)\s*(?:m(?:in(?:utes?|s?)?)?)[.+]?\s*$/);
    if (m) mins = parseFloat(m[1].replace(",", "."));
  }

  if (!hours && !mins) return str;

  if (hours % 1 !== 0) { mins += Math.round((hours % 1) * 60); hours = Math.floor(hours); }
  mins = Math.round(mins);

  const heHours = h => h === 1 ? "שעה" : h === 2 ? "שעתיים" : `${h} שעות`;
  const heMins  = m => m === 1 ? "דקה" : m === 2 ? "שתי דקות" : `${m} דקות`;

  if (!hours) return heMins(mins);
  if (!mins)  return heHours(hours);
  if (mins === 30) return hours === 1 ? "שעה וחצי" : hours === 2 ? "שעתיים וחצי" : `${heHours(hours)} וחצי`;
  return `${heHours(hours)} ו-${heMins(mins)}`;
}

// ─── Measurement unit translation ────────────────────────────────────────────
// Converts English unit words/abbreviations inside an amount string to Hebrew.
// Applied at display time — no DB changes needed.
const UNIT_WORDS = [
  // Longest entries first to avoid partial matches
  ["tablespoons", "כפות"], ["tablespoon", "כף"],
  ["teaspoons", "כפיות"], ["teaspoon", "כפית"],
  ["tbsps", "כפות"], ["tbsp", "כף"],
  ["tsps", "כפיות"], ["tsp", "כפית"],
  ["cups", "כוסות"], ["cup", "כוס"],
  ["liters", "ליטר"], ["litres", "ליטר"], ["liter", "ליטר"], ["litre", "ליטר"],
  ["kilograms", "ק\"ג"], ["kilogram", "ק\"ג"], ["kg", "ק\"ג"],
  ["grams", "גרם"], ["gram", "גרם"],
  ["ounces", "אונקיות"], ["ounce", "אונקיה"], ["oz", "אונקיה"],
  ["pounds", "פאונד"], ["pound", "פאונד"], ["lbs", "פאונד"], ["lb", "פאונד"],
  ["milliliters", "מ\"ל"], ["millilitres", "מ\"ל"], ["milliliter", "מ\"ל"], ["millilitre", "מ\"ל"], ["ml", "מ\"ל"],
  ["pieces", "יח׳"], ["piece", "יח׳"],
  ["pinches", "קמצוץ"], ["pinch", "קמצוץ"],
  ["handfuls", "חופן"], ["handful", "חופן"],
  ["bunches", "אגודות"], ["bunch", "אגודה"],
  ["cloves", "שיני"], ["clove", "שן"],
  ["slices", "פרוסות"], ["slice", "פרוסה"],
  ["strips", "רצועות"], ["strip", "רצועה"],
  ["cans", "פחיות"], ["can", "פחית"],
  ["packages", "חבילות"], ["package", "חבילה"],
  ["packs", "חבילות"], ["pack", "חבילה"],
  ["large", "גדול"], ["medium", "בינוני"], ["small", "קטן"],
];

export function localizeAmount(str, lang) {
  if (!str || lang !== "he") return str;
  let s = str;

  // Word-boundary replacements (handles "2 tbsp", "100 grams", etc.)
  for (const [en, he] of UNIT_WORDS) {
    s = s.replace(new RegExp(`\\b${en}\\b`, "gi"), he);
  }

  // Compact form "100g" / "500ml" / "2kg" (no space between number and unit)
  s = s.replace(/(\d)(g)\b(?![א-ת\w])/g, "$1 גרם");

  return s;
}
