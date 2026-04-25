// Google Translate unofficial free endpoint — no API key required
const GT = "https://translate.googleapis.com/translate_a/single";

async function gtFetch(text, from, to) {
  const r = await fetch(`${GT}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`);
  if (!r.ok) throw new Error(`GT HTTP ${r.status}`);
  const d = await r.json();
  return d[0].map(x => x[0]).join("");
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
