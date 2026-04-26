import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./lib/supabase";
import { t, serif, sans } from "./theme";
import RecipeCard from "./components/RecipeCard";
import RecipeDetail from "./components/RecipeDetail";
import RecipeForm from "./components/RecipeForm";
import TagManager from "./components/TagManager";
import RecipeCategoryManager from "./components/RecipeCategoryManager";
import LoginPage from "./components/LoginPage";
import MealPlanList from "./components/MealPlanList";
import MealPlanDetail from "./components/MealPlanDetail";
import IngredientCatalogue from "./components/IngredientCatalogue";
import { useLanguage } from "./i18n";
import { translateText, translateIngredientName, translateRecipeContent, localizeRecipe, localizeItem } from "./lib/translate";
import "./App.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_RECIPE_CATEGORIES = [
  { id: "breakfast", name: "breakfast", sort_order: 0 },
  { id: "lunch",     name: "lunch",     sort_order: 1 },
  { id: "dinner",    name: "dinner",    sort_order: 2 },
  { id: "snack",     name: "snack",     sort_order: 3 },
  { id: "dessert",   name: "dessert",   sort_order: 4 },
];
const DEFAULT_CONFIG = {
  overtitle: "a personal collection",
  title: "Oren's Cookbook",
  subtitle: "Collagen · Skin Health · Carnivore Protocol",
};

function useSessionState(key, def) {
  const [state, setState] = useState(() => {
    try { const v = sessionStorage.getItem(key); return v !== null ? JSON.parse(v) : def; } catch { return def; }
  });
  const set = useCallback((v) => {
    setState(v);
    try { sessionStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  return [state, set];
}

function SidebarBtn({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  const { isRTL } = useLanguage();
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block", width: "100%", textAlign: isRTL ? "right" : "left",
        padding: "8px 12px",
        borderRadius: "8px", border: "none",
        boxShadow: active ? (isRTL ? `inset -3px 0 0 ${t.green}` : `inset 3px 0 0 ${t.green}`) : "none",
        background: active ? t.ink : hovered ? t.green + "22" : "transparent",
        color: active ? "#fff" : hovered ? t.inkMid : t.inkLight,
        fontFamily: sans, fontSize: "11px", letterSpacing: "0.13em", textTransform: "uppercase",
        cursor: "pointer", transition: "background 0.18s, color 0.18s, box-shadow 0.18s", marginBottom: "2px",
      }}
    >{label}</button>
  );
}

function CauldronMark() {
  return (
    <svg width="80" height="104" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      {/* Page edge right */}
      <rect x="38.5" y="3" width="1.5" height="46" rx="0.5" fill="#F0EBE3" opacity="0.75"/>
      {/* Spine */}
      <rect x="1" y="2" width="7" height="48" rx="3" fill="#8A4428"/>
      <rect x="1.5" y="2" width="3" height="48" rx="2" fill="#6A9E82" opacity="0.35"/>
      {/* Front cover */}
      <rect x="7" y="2" width="32" height="48" rx="3" fill="#C47A5A"/>
      {/* Cover top sheen */}
      <rect x="7" y="2" width="32" height="10" rx="3" fill="#D4896A" opacity="0.32"/>
      {/* Sage tint strip at bottom of cover */}
      <rect x="7" y="42" width="32" height="8" rx="3" fill="#6A9E82" opacity="0.22"/>
      {/* Binding groove */}
      <rect x="8.5" y="2" width="1" height="48" fill="#A05030" opacity="0.45"/>
      {/* Cover border frame — sage */}
      <rect x="10.5" y="5" width="26" height="42" rx="2" fill="none" stroke="#6A9E82" strokeWidth="0.8" opacity="0.7"/>
      {/* Spine ribs — sage accent */}
      <rect x="2" y="11" width="5" height="1.5" rx="0.5" fill="#6A9E82" opacity="0.8"/>
      <rect x="2" y="40" width="5" height="1.5" rx="0.5" fill="#6A9E82" opacity="0.8"/>
      {/* Spatula on cover (cream, behind) */}
      <g transform="translate(23,26) scale(0.068) rotate(38)">
        <path d="M-44,-188 L44,-188 L44,-82 L12,-60 L12,-48 L-12,-48 L-12,-60 L-44,-82 Z" fill="#F0EBE3" opacity="0.88"/>
        <rect x="-12" y="-48" width="24" height="228" rx="12" fill="#F0EBE3" opacity="0.88"/>
        <rect x="-12" y="62" width="24" height="52" fill="#6A9E82"/>
      </g>
      {/* Spoon on cover (cream, in front) */}
      <g transform="translate(23,26) scale(0.068) rotate(-38)">
        <ellipse cx="0" cy="-148" rx="58" ry="72" fill="#F0EBE3"/>
        <rect x="-11" y="-76" width="22" height="248" rx="11" fill="#F0EBE3"/>
        <rect x="-11" y="62" width="22" height="52" fill="#6A9E82"/>
      </g>
    </svg>
  );
}

export default function App() {
  const { tr, tcat, lang, setLang, isRTL } = useLanguage();
  const [session, setSession] = useState(undefined);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerDraft, setHeaderDraft] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [tags, setTags] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientCategories, setIngredientCategories] = useState([]);
  const [ingredientMappings, setIngredientMappings] = useState([]);
  const [recipeCategories, setRecipeCategories] = useState(DEFAULT_RECIPE_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useSessionState("nav_cat", "all");
  const [selectedTagId, setSelectedTagId] = useSessionState("nav_tag", null);
  const [selected, setSelected] = useSessionState("nav_recipe", null);
  const [adding, setAdding] = useState(false);
  const [section, setSection] = useSessionState("nav_section", "recipes");
  const [selectedPlan, setSelectedPlan] = useSessionState("nav_plan", null);
  const [ingrKey, setIngrKey] = useState(0);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState("editor");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);
  const isTranslatingRef = useRef(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 680);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 680);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => { if (session) fetchAll(); }, [session]);

  async function fetchAll() {
    if (!hasLoadedRef.current) setLoading(true);
    const [{ data: recipesData, error: rErr }, { data: tagsData, error: tErr }] = await Promise.all([
      supabase.from("recipes").select("*").order("created_at", { ascending: true }),
      supabase.from("tags").select("*").order("name"),
    ]);
    if (rErr || tErr) { setError((rErr || tErr).message); setLoading(false); return; }
    setRecipes(recipesData);
    setTags(tagsData);

    const [{ data: configData }, { data: plansData }] = await Promise.all([
      supabase.from("app_config").select("*"),
      supabase.from("meal_plans").select("*").order("created_at", { ascending: false }),
    ]);
    if (configData?.length) setConfig(prev => ({ ...prev, ...Object.fromEntries(configData.map(r => [r.key, r.value])) }));
    if (plansData) setMealPlans(plansData);

    // Fetch user role — default 'editor' if no profile row (backwards compat for existing user)
    const { data: profileData } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
    setUserRole(profileData?.role || "editor");

    const [{ data: ingrData }, { data: catData }, { data: mapData }, { data: rcData }] = await Promise.all([
      supabase.from("ingredients").select("*").order("name"),
      supabase.from("ingredient_categories").select("*").order("sort_order"),
      supabase.from("ingredient_usda_mapping").select("*"),
      supabase.from("recipe_categories").select("*").order("sort_order"),
    ]);
    if (ingrData) setIngredients(ingrData);
    if (catData) setIngredientCategories(catData);
    if (mapData) setIngredientMappings(mapData);
    if (rcData?.length) setRecipeCategories(rcData);

    hasLoadedRef.current = true;
    setLoading(false);
  }

  async function handleCreateRecipeCategory(name) {
    const otherLang = lang === "en" ? "he" : "en";
    const translated = await translateText(name, lang, otherLang);
    const enName = lang === "en" ? name : translated;
    const heName = lang === "he" ? name : translated;
    const { data, error } = await supabase.from("recipe_categories")
      .insert({ name: enName, name_he: heName, sort_order: recipeCategories.length }).select().single();
    if (error) throw error;
    setRecipeCategories(prev => [...prev, data]);
  }

  async function handleUpdateRecipeCategory(id, name) {
    const otherLang = lang === "en" ? "he" : "en";
    const translated = await translateText(name, lang, otherLang);
    const enName = lang === "en" ? name : translated;
    const heName = lang === "he" ? name : translated;
    const { error } = await supabase.from("recipe_categories").update({ name: enName, name_he: heName }).eq("id", id);
    if (error) throw error;
    setRecipeCategories(prev => prev.map(c => c.id === id ? { ...c, name: enName, name_he: heName } : c));
    setRecipes(prev => prev.map(r => {
      const old = recipeCategories.find(c => c.id === id);
      return old && r.category === old.name ? { ...r, category: enName } : r;
    }));
  }

  async function handleDeleteRecipeCategory(id) {
    const { error } = await supabase.from("recipe_categories").delete().eq("id", id);
    if (error) throw error;
    setRecipeCategories(prev => prev.filter(c => c.id !== id));
    // Don't touch recipes — they still show in "All recipes"
  }

  async function saveConfigField(key, value) {
    setConfig(c => ({ ...c, [key]: value }));
    await supabase.from("app_config").upsert({ key, value }, { onConflict: "key" });
  }

  // When navigating away from a section, reset its sub-state so returning starts fresh
  const navTo = (newSection) => {
    if (section !== newSection && section === "ingredients") {
      setIngrKey(k => k + 1);
      try { sessionStorage.removeItem("ingr_expanded"); } catch {}
    }
    setSection(newSection);
    setSelected(null);
    setAdding(false);
  };

  // Returns a recipe ready for display in the current language.
  // Adds category_display so display components don't need recipeCategories lookup.
  const enrichForDisplay = (recipe) => {
    const loc = localizeRecipe(recipe, lang);
    const cat = recipeCategories.find(c => c.name === recipe.category);
    const catDisplay = lang === "he" ? (cat?.name_he || tcat(recipe.category)) : recipe.category;
    return { ...loc, category_display: catDisplay };
  };

  const openHeaderEdit = () => {
    setHeaderDraft({
      overtitle: lang === "he" ? (config.overtitle_he || config.overtitle) : config.overtitle,
      title:     lang === "he" ? (config.title_he     || config.title)     : config.title,
      subtitle:  lang === "he" ? (config.subtitle_he  || config.subtitle)  : config.subtitle,
    });
    setEditingHeader(true);
  };
  const saveHeaderEdit = async () => {
    const otherLang = lang === "en" ? "he" : "en";
    for (const f of ["overtitle", "title", "subtitle"]) {
      const val = headerDraft[f] || "";
      if (lang === "en") {
        await saveConfigField(f, val);
        if (val.trim()) { const he = await translateText(val, "en", "he"); await saveConfigField(`${f}_he`, he); }
      } else {
        await saveConfigField(`${f}_he`, val);
        if (val.trim()) { const en = await translateText(val, "he", "en"); await saveConfigField(f, en); }
      }
    }
    setEditingHeader(false);
  };

  const filteredRecipes = recipes.filter(r => {
    const catOk = selectedCategory === "all" || r.category === selectedCategory;
    const tagOk = !selectedTagId || (r.tag_ids || []).includes(selectedTagId);
    const q = search.trim().toLowerCase();
    const searchOk = !q ||
      r.title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      (r.ingredients || []).some(ing => ing.name?.toLowerCase().includes(q));
    return catOk && tagOk && searchOk;
  });

  async function handleSave(form) {
    const otherLang = lang === "en" ? "he" : "en";
    const srcContent = {
      title: form.title, description: form.description,
      dose: form.dose, total_time: form.total_time,
      ingredients: form.ingredients || [], steps: form.steps || [], notes: form.notes || [],
    };
    const tgtContent = await translateRecipeContent(srcContent, lang, otherLang);
    const enContent  = lang === "en" ? srcContent : tgtContent;
    const heContent  = lang === "he" ? srcContent : tgtContent;

    const payload = {
      emoji: form.emoji, category: form.category || "other", tag_ids: form.tag_ids || [],
      servings: form.servings, prep_time: form.prep_time, cook_time: form.cook_time,
      total_time: form.total_time, dose: form.dose,
      nutrition: form.nutrition || null, image_url: form.image_url || null,
      image_position: form.image_position || "50% 50%",
      title: enContent.title, description: enContent.description,
      ingredients: enContent.ingredients, steps: enContent.steps, notes: enContent.notes,
      translations: { he: heContent },
    };
    if (form.id) {
      const { error } = await supabase.from("recipes").update(payload).eq("id", form.id);
      if (error) throw error;
      setRecipes(prev => prev.map(r => r.id === form.id ? { ...r, ...payload } : r));
    } else {
      const { data, error } = await supabase.from("recipes").insert(payload).select().single();
      if (error) throw error;
      setRecipes(prev => [...prev, data]);
      setAdding(false);
      setSelected(data.id);
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) { alert("Delete failed: " + error.message); return; }
    setRecipes(prev => prev.filter(r => r.id !== id));
    setSelected(null);
  }

  async function createTag(name, color) {
    const otherLang = lang === "en" ? "he" : "en";
    const translated = await translateText(name, lang, otherLang);
    const enName = lang === "en" ? name : translated;
    const heName = lang === "he" ? name : translated;
    const { data, error } = await supabase.from("tags").insert({ name: enName, color, name_he: heName }).select().single();
    if (error) throw error;
    setTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function updateTag(id, updates) {
    let finalUpdates = { ...updates };
    if (updates.name) {
      const otherLang = lang === "en" ? "he" : "en";
      const translated = await translateText(updates.name, lang, otherLang);
      finalUpdates.name    = lang === "en" ? updates.name : translated;
      finalUpdates.name_he = lang === "he" ? updates.name : translated;
    }
    const { error } = await supabase.from("tags").update(finalUpdates).eq("id", id);
    if (error) throw error;
    setTags(prev => prev.map(tg => tg.id === id ? { ...tg, ...finalUpdates } : tg));
  }

  async function deleteTag(id) {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw error;
    setTags(prev => prev.filter(tg => tg.id !== id));
    setRecipes(prev => prev.map(r => ({ ...r, tag_ids: (r.tag_ids || []).filter(tid => tid !== id) })));
    if (selectedTagId === id) setSelectedTagId(null);
  }

  async function handleSavePlan(plan) {
    const { error } = await supabase.from("meal_plans").update({
      name: plan.name, days: plan.days, day_notes: plan.day_notes || {}
    }).eq("id", plan.id);
    if (error) throw error;
    setMealPlans(prev => prev.map(p => p.id === plan.id ? { ...p, name: plan.name, days: plan.days, day_notes: plan.day_notes } : p));
  }

  async function handleDeletePlan(id) {
    const { error } = await supabase.from("meal_plans").delete().eq("id", id);
    if (error) { alert("Delete failed: " + error.message); return; }
    setMealPlans(prev => prev.filter(p => p.id !== id));
    setSelectedPlan(null);
  }

  async function handleRenamePlan(id, name) {
    const otherLang = lang === "en" ? "he" : "en";
    const translated = await translateText(name, lang, otherLang);
    const enName = lang === "en" ? name : translated;
    const heName = lang === "he" ? name : translated;
    const { error } = await supabase.from("meal_plans").update({ name: enName, name_he: heName }).eq("id", id);
    if (error) { alert("Rename failed: " + error.message); return; }
    setMealPlans(prev => prev.map(p => p.id === id ? { ...p, name: enName, name_he: heName } : p));
  }

  async function handleCreateIngredient(data) {
    const otherLang = lang === "en" ? "he" : "en";
    // Respect manually-provided name_he override (from IngredientForm); only auto-translate if absent
    let heName = data.name_he?.trim() || null;
    if (!heName) {
      const translated = data.name ? await translateIngredientName(data.name, lang, otherLang) : "";
      heName = lang === "he" ? data.name : translated;
    }
    const enName = lang === "en" ? data.name : (data.name ? await translateIngredientName(data.name, "he", "en") : data.name);
    const payload = { ...data, name: enName, name_he: heName };
    const { data: row, error } = await supabase.from("ingredients").insert(payload).select().single();
    if (error) throw error;
    setIngredients(prev => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
    return row;
  }

  async function handleUpdateIngredient(id, updates) {
    let finalUpdates = { ...updates };
    if (updates.name) {
      const otherLang = lang === "en" ? "he" : "en";
      // If a manual Hebrew override was provided, use it directly
      if (updates.name_he?.trim()) {
        finalUpdates.name    = lang === "en" ? updates.name : await translateIngredientName(updates.name, "he", "en");
        finalUpdates.name_he = updates.name_he.trim();
      } else {
        const translated = await translateIngredientName(updates.name, lang, otherLang);
        finalUpdates.name    = lang === "en" ? updates.name : translated;
        finalUpdates.name_he = lang === "he" ? updates.name : translated;
      }
    }
    const { error } = await supabase.from("ingredients").update(finalUpdates).eq("id", id);
    if (error) throw error;
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...finalUpdates } : i));
  }

  async function handleDeleteIngredient(id) {
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    if (error) throw error;
    setIngredients(prev => prev.filter(i => i.id !== id));
    setIngredientMappings(prev => prev.filter(m => m.ingredient_id !== id));
  }

  async function handleCreateCategory(data) {
    const otherLang = lang === "en" ? "he" : "en";
    const translated = data.name ? await translateText(data.name, lang, otherLang) : "";
    const enName = lang === "en" ? data.name : translated;
    const heName = lang === "he" ? data.name : translated;
    const { data: row, error } = await supabase.from("ingredient_categories").insert({ ...data, name: enName, name_he: heName }).select().single();
    if (error) throw error;
    setIngredientCategories(prev => [...prev, row].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    return row;
  }

  async function handleSaveMapping(ingredientId, mapping) {
    const payload = { ingredient_id: ingredientId, ...mapping };
    const { data: row, error } = await supabase.from("ingredient_usda_mapping").upsert(payload, { onConflict: "ingredient_id" }).select().single();
    if (error) throw error;
    setIngredientMappings(prev => {
      const filtered = prev.filter(m => m.ingredient_id !== ingredientId);
      return [...filtered, row];
    });
  }

  async function handleCreatePlan() {
    const days = Object.fromEntries(DAYS.map(d => [d, []]));
    const name_he = await translateText("Week Plan", "en", "he");
    const { data, error } = await supabase.from("meal_plans").insert({ name: "Week Plan", name_he, days }).select().single();
    if (error) { alert("Failed: " + error.message); return; }
    setMealPlans(prev => [data, ...prev]);
    setSelectedPlan(data.id);
  }

  // Auto-translate all existing content the first time Hebrew is selected (and after any new content is added)
  useEffect(() => {
    if (lang === "he" && !loading && !isTranslatingRef.current) {
      isTranslatingRef.current = true;
      translateMissingContent().finally(() => { isTranslatingRef.current = false; });
    }
  }, [lang, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function translateMissingContent() {
    // Recipes (sequential to avoid rate-limiting; each recipe fans out internally)
    for (const recipe of recipes.filter(r => !r.translations?.he?.title)) {
      try {
        const src = { title: recipe.title, description: recipe.description, dose: recipe.dose, total_time: recipe.total_time, ingredients: recipe.ingredients || [], steps: recipe.steps || [], notes: recipe.notes || [] };
        const he = await translateRecipeContent(src, "en", "he");
        const translations = { ...(recipe.translations || {}), he };
        await supabase.from("recipes").update({ translations }).eq("id", recipe.id);
        setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, translations } : r));
      } catch (e) { console.warn("recipe translate failed", recipe.id, e); }
    }
    // Tags, ingredient categories, recipe categories, plans — parallel (1 call each)
    await Promise.all([
      ...tags.filter(t => !t.name_he).map(async tag => {
        try {
          const name_he = await translateText(tag.name, "en", "he");
          await supabase.from("tags").update({ name_he }).eq("id", tag.id);
          setTags(prev => prev.map(t => t.id === tag.id ? { ...t, name_he } : t));
        } catch {}
      }),
      ...ingredientCategories.filter(c => !c.name_he).map(async cat => {
        try {
          const name_he = await translateText(cat.name, "en", "he");
          await supabase.from("ingredient_categories").update({ name_he }).eq("id", cat.id);
          setIngredientCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name_he } : c));
        } catch {}
      }),
      ...recipeCategories.filter(c => !c.name_he).map(async cat => {
        try {
          const name_he = await translateText(cat.name, "en", "he");
          await supabase.from("recipe_categories").update({ name_he }).eq("id", cat.id);
          setRecipeCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name_he } : c));
        } catch {}
      }),
      ...mealPlans.filter(p => !p.name_he).map(async plan => {
        try {
          const name_he = await translateText(plan.name, "en", "he");
          await supabase.from("meal_plans").update({ name_he }).eq("id", plan.id);
          setMealPlans(prev => prev.map(p => p.id === plan.id ? { ...p, name_he } : p));
        } catch {}
      }),
    ]);
    // Ingredients (sequential — catalogue can be large)
    for (const ing of ingredients.filter(i => !i.name_he)) {
      try {
        const name_he = await translateIngredientName(ing.name, "en", "he");
        await supabase.from("ingredients").update({ name_he }).eq("id", ing.id);
        setIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, name_he } : i));
      } catch {}
    }
    // Header config keys
    for (const f of ["overtitle", "title", "subtitle"]) {
      if (config[f] && !config[`${f}_he`]) {
        try {
          const he = await translateText(config[f], "en", "he");
          await saveConfigField(`${f}_he`, he);
        } catch {}
      }
    }
  }

  if (session === undefined) {
    return (
      <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: sans, fontSize: "13px", color: t.inkFaint }}>Loading…</p>
      </div>
    );
  }
  if (!session) return <LoginPage />;

  const isEditor = userRole === "editor";

  const selectedRecipe   = recipes.find(r => r.id === selected);
  const selectedPlanData = mealPlans.find(p => p.id === selectedPlan);
  const inListView         = !selected && !adding && section === "recipes";
  const inPlanListView     = isEditor && section === "mealplans" && !selectedPlan;
  const inTagsView         = isEditor && section === "tags";
  const inCategoriesView   = isEditor && section === "categories";
  const inIngredientsView  = section === "ingredients";
  const showSidebar        = !isMobile && (inListView || inPlanListView || inTagsView || inCategoriesView || inIngredientsView);

  const overStyle  = { fontSize: "11px", color: t.green,  fontFamily: sans, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 4px 0" };
  const titleStyle = { fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "400", color: "#F7F3EE", margin: "0 0 3px 0", fontFamily: serif, letterSpacing: "0.01em" };
  const subStyle   = { fontSize: "11px", color: t.terra,  fontFamily: sans, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 };
  const inStyle    = (base) => ({ ...base, background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.25)", outline: "none", padding: "2px 0", display: "block", width: "280px", boxSizing: "border-box" });

  return (
    <div style={{ background: t.bg, minHeight: "100vh", color: t.ink }} dir={isRTL ? "rtl" : "ltr"}>
      {/* Background: sage green blobs + subtle dot grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: [
          "radial-gradient(ellipse 60% 55% at 0% 100%, rgba(106,158,130,0.14) 0%, transparent 70%)",
          "radial-gradient(ellipse 40% 40% at 100% 0%, rgba(106,158,130,0.09) 0%, transparent 70%)",
          "radial-gradient(ellipse 30% 30% at 80% 85%, rgba(106,158,130,0.06) 0%, transparent 70%)",
          "radial-gradient(circle at 85% 15%, rgba(196,122,90,0.06) 0%, transparent 45%)",
          "radial-gradient(rgba(106,158,130,0.055) 1.5px, transparent 1.5px)",
        ].join(", "),
        backgroundSize: "auto, auto, auto, auto, 30px 30px",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ background: t.ink, padding: "10px 24px 18px", borderBottom: `3px solid ${t.terra}` }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            {/* Top-left utility row: always physically left, regardless of language direction */}
            <div dir="ltr" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
              <button
                onClick={() => setLang(lang === "en" ? "he" : "en")}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.65)", fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", padding: "4px 12px", borderRadius: "20px", cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
                title={lang === "en" ? "Switch to Hebrew" : "Switch to English"}
              >{tr("lang_toggle")}</button>
              {isEditor && (editingHeader ? (
                <>
                  <button onClick={saveHeaderEdit} style={{ background: t.green, border: "none", color: "#fff", fontFamily: sans, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 12px", borderRadius: "20px", cursor: "pointer" }}>{tr("btn_save")}</button>
                  <button onClick={() => setEditingHeader(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.55)", fontFamily: sans, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "20px", cursor: "pointer" }}>{tr("btn_cancel")}</button>
                </>
              ) : (
                <button onClick={openHeaderEdit} style={{ background: "none", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.45)", fontFamily: sans, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "20px", cursor: "pointer" }}>{tr("btn_edit")}</button>
              ))}
            </div>

            {/* Main header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }} dir={isRTL ? "rtl" : "ltr"}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <CauldronMark />
                <div>
                  {editingHeader ? (
                    <>
                      <input value={headerDraft.overtitle || ""} onChange={e => setHeaderDraft(d => ({ ...d, overtitle: e.target.value }))} style={inStyle(overStyle)} />
                      <input value={headerDraft.title || ""} onChange={e => setHeaderDraft(d => ({ ...d, title: e.target.value }))} style={inStyle(titleStyle)} />
                      <input value={headerDraft.subtitle || ""} onChange={e => setHeaderDraft(d => ({ ...d, subtitle: e.target.value }))} style={inStyle(subStyle)} />
                    </>
                  ) : (
                    <>
                      <p style={overStyle}>{lang === "he" ? (config.overtitle_he || config.overtitle) : config.overtitle}</p>
                      <h1 style={titleStyle}>{lang === "he" ? (config.title_he || config.title) : config.title}</h1>
                      <p style={subStyle}>{lang === "he" ? (config.subtitle_he || config.subtitle) : config.subtitle}</p>
                    </>
                  )}
                </div>
              </div>
              {/* Context-sensitive action buttons (New Recipe / New Plan) */}
              {isEditor && (inListView || inPlanListView) && (
                <div style={{ display: "flex", gap: "8px" }}>
                  {inListView && (
                    <button onClick={() => setAdding(true)} style={{ background: t.terra, border: "none", color: "#fff", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, padding: "8px 18px", borderRadius: "20px", cursor: "pointer" }}>
                      {tr("btn_new_recipe")}
                    </button>
                  )}
                  {inPlanListView && (
                    <button onClick={handleCreatePlan} style={{ background: t.green, border: "none", color: "#fff", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, padding: "8px 18px", borderRadius: "20px", cursor: "pointer" }}>
                      {tr("btn_new_plan")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page body */}
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: isMobile ? "20px 16px 60px" : "28px 20px 60px" }}>
          {loading && <div style={{ textAlign: "center", padding: "60px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>{tr("loading")}</div>}
          {error && (
            <div style={{ background: "#FFF0EE", border: "1px solid #F5C6C0", borderRadius: "8px", padding: "16px", color: "#8B3A3A", fontFamily: sans, fontSize: "13px" }}>
              <strong>Connection error:</strong> {error}
              <br /><span style={{ fontSize: "12px", opacity: 0.8 }}>Check your .env.local</span>
            </div>
          )}

          {!loading && !error && adding && (
            <RecipeForm initial={null} tags={tags} recipeCategories={recipeCategories} onCancel={() => setAdding(false)} onSave={handleSave} />
          )}

          {!loading && !error && !adding && selected && selectedRecipe && (
            <RecipeDetail
              recipe={enrichForDisplay(selectedRecipe)}
              tags={tags.map(t => localizeItem(t, lang))}
              recipeCategories={recipeCategories}
              isEditor={isEditor}
              onBack={() => setSelected(null)}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}

          {!loading && !error && section === "mealplans" && selectedPlan && selectedPlanData && (
            <MealPlanDetail
              plan={localizeItem(selectedPlanData, lang)}
              recipes={recipes.map(r => enrichForDisplay(r))}
              ingredients={ingredients.map(i => localizeItem(i, lang))}
              ingredientCategories={ingredientCategories.map(c => localizeItem(c, lang))}
              ingredientMappings={ingredientMappings}
              tags={tags.map(t => localizeItem(t, lang))}
              recipeCategories={recipeCategories}
              onBack={() => setSelectedPlan(null)}
              onSave={handleSavePlan}
              onDelete={handleDeletePlan}
            />
          )}

          {!loading && !error && (inListView || inPlanListView || inTagsView || inCategoriesView || inIngredientsView) && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>

              {/* Desktop sidebar */}
              {showSidebar && (
                <aside style={{ width: "172px", flexShrink: 0, position: "sticky", top: "24px", alignSelf: "flex-start", [isRTL ? "paddingLeft" : "paddingRight"]: "20px", [isRTL ? "borderLeft" : "borderRight"]: `1px solid ${t.border}`, [isRTL ? "marginLeft" : "marginRight"]: "24px" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 6px 4px" }}>{tr("nav_recipes")}</p>
                  <SidebarBtn label={tr("nav_all")} active={section === "recipes" && selectedCategory === "all"} onClick={() => { setSelectedCategory("all"); setSelectedTagId(null); navTo("recipes"); }} />
                  {recipeCategories.map(cat => (
                    <SidebarBtn key={cat.id} label={tcat(cat.name)} active={section === "recipes" && selectedCategory === cat.name} onClick={() => { setSelectedCategory(cat.name); setSelectedTagId(null); navTo("recipes"); }} />
                  ))}
                  {isEditor && (
                    <div style={{ borderTop: `1px solid ${t.border}`, marginTop: "14px", paddingTop: "14px" }}>
                      <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 6px 4px" }}>{tr("nav_planning")}</p>
                      <SidebarBtn label={tr("nav_mealplans")} active={section === "mealplans"} onClick={() => navTo("mealplans")} />
                    </div>
                  )}
                  <div style={{ borderTop: `1px solid ${t.border}`, marginTop: "14px", paddingTop: "14px" }}>
                    <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 6px 4px" }}>{tr("nav_catalogue")}</p>
                    <SidebarBtn label={tr("nav_catalogue")} active={section === "ingredients"} onClick={() => navTo("ingredients")} />
                  </div>
                  {isEditor && (
                    <div style={{ borderTop: `1px solid ${t.border}`, marginTop: "14px", paddingTop: "14px" }}>
                      <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 6px 4px" }}>{tr("nav_manage")}</p>
                      <SidebarBtn label={tr("nav_tags")} active={section === "tags"} onClick={() => navTo("tags")} />
                      <SidebarBtn label={tr("nav_categories")} active={section === "categories"} onClick={() => navTo("categories")} />
                    </div>
                  )}
                </aside>
              )}

              {/* Main area */}
              <main style={{ flex: 1, minWidth: 0 }}>
                {/* Mobile nav tabs */}
                {isMobile && (
                  <div style={{ display: "flex", gap: "4px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
                    <button onClick={() => { setSelectedCategory("all"); setSelectedTagId(null); navTo("recipes"); }} style={{ padding: "7px 12px", borderRadius: "20px", border: "none", whiteSpace: "nowrap", background: section === "recipes" && selectedCategory === "all" ? t.ink : t.surface2, color: section === "recipes" && selectedCategory === "all" ? "#fff" : t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer" }}>{tr("cat_all")}</button>
                    {recipeCategories.map(cat => (
                      <button key={cat.id} onClick={() => { setSelectedCategory(cat.name); setSelectedTagId(null); navTo("recipes"); }} style={{ padding: "7px 12px", borderRadius: "20px", border: "none", whiteSpace: "nowrap", background: section === "recipes" && selectedCategory === cat.name ? t.ink : t.surface2, color: section === "recipes" && selectedCategory === cat.name ? "#fff" : t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>{tcat(cat.name)}</button>
                    ))}
                    {isEditor && <button onClick={() => navTo("mealplans")} style={{ padding: "7px 12px", borderRadius: "20px", border: "none", whiteSpace: "nowrap", background: section === "mealplans" ? t.terra : t.surface2, color: section === "mealplans" ? "#fff" : t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>{tr("nav_mealplans")}</button>}
                    {isEditor && <button onClick={() => navTo("tags")} style={{ padding: "7px 12px", borderRadius: "20px", border: "none", whiteSpace: "nowrap", background: section === "tags" ? t.green : t.surface2, color: section === "tags" ? "#fff" : t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>{tr("nav_tags")}</button>}
                    <button onClick={() => navTo("ingredients")} style={{ padding: "7px 12px", borderRadius: "20px", border: "none", whiteSpace: "nowrap", background: section === "ingredients" ? t.green : t.surface2, color: section === "ingredients" ? "#fff" : t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>{tr("nav_catalogue")}</button>
                  </div>
                )}

                {/* Recipes list */}
                {section === "recipes" && (
                  <div>
                    <div style={{ position: "relative", marginBottom: "16px" }}>
                      <span style={{ position: "absolute", [isRTL ? "right" : "left"]: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: t.inkFaint, pointerEvents: "none" }}>🔍</span>
                      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={tr("search_ph")}
                        style={{ width: "100%", fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface, border: `1px solid ${t.border}`, borderRadius: "24px", padding: isRTL ? "10px 36px 10px 16px" : "10px 16px 10px 36px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                        onFocus={e => e.target.style.borderColor = t.green} onBlur={e => e.target.style.borderColor = t.border}
                      />
                      {search && <button onClick={() => setSearch("")} style={{ position: "absolute", [isRTL ? "left" : "right"]: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: t.inkFaint, cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>}
                    </div>
                    {tags.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: t.inkFaint, fontFamily: sans, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>{tr("search_filter")}</span>
                        {tags.map(tag => {
                          const active = selectedTagId === tag.id;
                          return (
                            <button key={tag.id} onClick={() => setSelectedTagId(active ? null : tag.id)} style={{ padding: "3px 10px", borderRadius: "20px", border: `1px solid ${tag.color}`, background: active ? tag.color : "transparent", color: active ? "#fff" : tag.color, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>{tag.name}</button>
                          );
                        })}
                        {selectedTagId && <button onClick={() => setSelectedTagId(null)} style={{ background: "none", border: "none", color: t.inkFaint, fontFamily: sans, fontSize: "11px", cursor: "pointer", padding: "2px 4px" }}>{tr("search_clear")}</button>}
                      </div>
                    )}
                    <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 14px 0", paddingBottom: "10px", borderBottom: `1px solid ${t.border}` }}>
                      {search ? tr("search_count_q", filteredRecipes.length, search) : tr("search_count", filteredRecipes.length)}
                    </p>
                    {filteredRecipes.length === 0 && (
                      <div style={{ textAlign: "center", padding: "60px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>
                        {search ? tr("search_none_q", search) : tr("search_none")}
                      </div>
                    )}
                    <div key={`${selectedCategory}-${selectedTagId}`} style={{ display: "flex", flexDirection: "column", gap: "12px", animation: "fadeSlideIn 0.2s ease" }}>
                      {filteredRecipes.map(r => <RecipeCard key={r.id} recipe={enrichForDisplay(r)} tags={tags.map(t => localizeItem(t, lang))} onClick={() => setSelected(r.id)} />)}
                    </div>
                  </div>
                )}

                {section === "mealplans" && (
                  <MealPlanList plans={mealPlans.map(p => localizeItem(p, lang))} onCreate={handleCreatePlan} onOpen={id => setSelectedPlan(id)} onDelete={handleDeletePlan} onRename={handleRenamePlan} />
                )}
                {section === "tags" && (
                  <TagManager tags={tags} onCreate={createTag} onUpdate={updateTag} onDelete={deleteTag} />
                )}
                {section === "categories" && (
                  <RecipeCategoryManager categories={recipeCategories} onCreate={handleCreateRecipeCategory} onUpdate={handleUpdateRecipeCategory} onDelete={handleDeleteRecipeCategory} />
                )}
                {section === "ingredients" && (
                  <IngredientCatalogue key={ingrKey} ingredients={ingredients} categories={ingredientCategories} mappings={ingredientMappings} isEditor={isEditor} onCreate={handleCreateIngredient} onUpdate={handleUpdateIngredient} onDelete={handleDeleteIngredient} onCreateCategory={handleCreateCategory} onSaveMapping={handleSaveMapping} />
                )}
              </main>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
