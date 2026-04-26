// Google Translate unofficial free endpoint — no API key required
const GT = "https://translate.googleapis.com/translate_a/single";

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

// Translate all text content of a recipe object (title, description, ingredient names, steps, notes).
// Amounts/units/times are left unchanged.
export async function translateRecipeContent(content, from, to) {
  if (from === to) return content;
  const T = s => translateText(s, from, to);
  const [title, description] = await Promise.all([T(content.title), T(content.description)]);
  const ingredients = await Promise.all(
    (content.ingredients || []).map(async i => ({ ...i, name: await T(i.name) }))
  );
  const steps = await Promise.all(
    (content.steps || []).map(async s => ({ ...s, title: await T(s.title), body: await T(s.body) }))
  );
  const notes = await Promise.all(
    (content.notes || []).map(async n => ({ ...n, title: await T(n.title), body: await T(n.body) }))
  );
  return { title, description, ingredients, steps, notes };
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
  };
}

// Return a display-ready copy of a simple named item (tag, ingredient, category, plan).
// Picks name_he for Hebrew; falls back to name.
export function localizeItem(item, lang) {
  if (!item || lang === "en") return item;
  return { ...item, name: item.name_he || item.name };
}

// Convert a time string like "30 min", "1.5 hours", "1h 30m" to Hebrew.
// Returns the original string unchanged if it cannot be parsed or lang !== "he".
export function localizeTime(str, lang) {
  if (!str || lang !== "he") return str;
  const s = str.trim().toLowerCase();

  // Special cases
  if (/overnight|over\s*night/.test(s)) return "לילה שלם";
  if (/few\s*days|couple\s*of\s*days/.test(s)) return "כמה ימים";

  let hours = 0, mins = 0;

  // "H:MM" or "HH:MM"
  let m = s.match(/^(\d+):(\d{2})$/);
  if (m) { hours = parseInt(m[1]); mins = parseInt(m[2]); }

  // "Xh Ym" or "X hour(s) [and] Y min(s)"
  if (!hours && !mins) {
    m = s.match(/(\d+(?:[.,]\d+)?)\s*(?:h(?:r?s?|ours?)?)[\s,]+(?:and\s+)?(\d+(?:[.,]\d+)?)\s*(?:m(?:in(?:utes?|s?)?)?)/);
    if (m) { hours = parseFloat(m[1]); mins = parseFloat(m[2]); }
  }

  // Just hours: "Xh" / "X hr" / "X hour(s)"
  if (!hours && !mins) {
    m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:h(?:r?s?|ours?)?)\s*$/);
    if (m) hours = parseFloat(m[1].replace(",", "."));
  }

  // Just minutes: "X min(s)" / "X minute(s)"
  if (!hours && !mins) {
    m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:m(?:in(?:utes?|s?)?)?)\s*$/);
    if (m) mins = parseFloat(m[1].replace(",", "."));
  }

  if (!hours && !mins) return str; // unparseable

  // Distribute fractional hours into minutes
  if (hours % 1 !== 0) {
    mins += Math.round((hours % 1) * 60);
    hours = Math.floor(hours);
  }
  mins = Math.round(mins);

  const heHours = h => {
    if (h === 1) return "שעה";
    if (h === 2) return "שעתיים";
    return `${h} שעות`;
  };
  const heMins = m => {
    if (m === 1) return "דקה";
    if (m === 2) return "שתי דקות";
    return `${m} דקות`;
  };

  if (!hours) return heMins(mins);
  if (!mins)  return heHours(hours);
  if (mins === 30) {
    if (hours === 1) return "שעה וחצי";
    if (hours === 2) return "שעתיים וחצי";
    return `${heHours(hours)} וחצי`;
  }
  return `${heHours(hours)} ו-${heMins(mins)}`;
}
