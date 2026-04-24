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
  const borderSide = isRTL ? "borderRight" : "borderLeft";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block", width: "100%", textAlign: isRTL ? "right" : "left",
        padding: "8px 12px 8px 9px",
        borderRadius: "8px", border: "none",
        [borderSide]: active ? `3px solid ${t.green}` : "3px solid transparent",
        background: active ? t.ink : hovered ? t.green + "22" : "transparent",
        color: active ? "#fff" : hovered ? t.inkMid : t.inkLight,
        fontFamily: sans, fontSize: "11px", letterSpacing: "0.13em", textTransform: "uppercase",
        cursor: "pointer", transition: "background 0.18s, color 0.18s", marginBottom: "2px",
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
  const { tr, lang, setLang, isRTL } = useLanguage();
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
    const { data, error } = await supabase.from("recipe_categories")
      .insert({ name, sort_order: recipeCategories.length }).select().single();
    if (error) throw error;
    setRecipeCategories(prev => [...prev, data]);
  }

  async function handleUpdateRecipeCategory(id, name) {
    const { error } = await supabase.from("recipe_categories").update({ name }).eq("id", id);
    if (error) throw error;
    setRecipeCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    // Update matching recipes so their category text stays in sync
    setRecipes(prev => prev.map(r => {
      const old = recipeCategories.find(c => c.id === id);
      return old && r.category === old.name ? { ...r, category: name } : r;
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

  const openHeaderEdit = () => { setHeaderDraft({ ...config }); setEditingHeader(true); };
  const saveHeaderEdit = () => {
    ["overtitle", "title", "subtitle"].forEach(f => { if (headerDraft[f] !== config[f]) saveConfigField(f, headerDraft[f]); });
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
    const payload = {
      title: form.title, emoji: form.emoji, description: form.description,
      category: form.category || "other", tag_ids: form.tag_ids || [],
      servings: form.servings, prep_time: form.prep_time, cook_time: form.cook_time,
      total_time: form.total_time, dose: form.dose,
      ingredients: form.ingredients, steps: form.steps, notes: form.notes,
      nutrition: form.nutrition || null,
      image_url: form.image_url || null,
      image_position: form.image_position || "50% 50%",
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
    const { data, error } = await supabase.from("tags").insert({ name, color }).select().single();
    if (error) throw error;
    setTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function updateTag(id, updates) {
    const { error } = await supabase.from("tags").update(updates).eq("id", id);
    if (error) throw error;
    setTags(prev => prev.map(tg => tg.id === id ? { ...tg, ...updates } : tg));
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
    const { error } = await supabase.from("meal_plans").update({ name }).eq("id", id);
    if (error) { alert("Rename failed: " + error.message); return; }
    setMealPlans(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }

  async function handleCreateIngredient(data) {
    const { data: row, error } = await supabase.from("ingredients").insert(data).select().single();
    if (error) throw error;
    setIngredients(prev => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
    return row;
  }

  async function handleUpdateIngredient(id, updates) {
    const { error } = await supabase.from("ingredients").update(updates).eq("id", id);
    if (error) throw error;
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }

  async function handleDeleteIngredient(id) {
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    if (error) throw error;
    setIngredients(prev => prev.filter(i => i.id !== id));
    setIngredientMappings(prev => prev.filter(m => m.ingredient_id !== id));
  }

  async function handleCreateCategory(data) {
    const { data: row, error } = await supabase.from("ingredient_categories").insert(data).select().single();
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
    const { data, error } = await supabase.from("meal_plans").insert({ name: "Week Plan", days }).select().single();
    if (error) { alert("Failed: " + error.message); return; }
    setMealPlans(prev => [data, ...prev]);
    setSelectedPlan(data.id);
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
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle at 15% 85%, rgba(106,158,130,0.07) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(196,122,90,0.07) 0%, transparent 45%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ background: t.ink, padding: "20px 24px 18px", borderBottom: `3px solid ${t.terra}` }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
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
                      <p style={overStyle}>{config.overtitle}</p>
                      <h1 style={titleStyle}>{config.title}</h1>
                      <p style={subStyle}>{config.subtitle}</p>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                {isEditor && (
                  <>
                    {(inListView || inPlanListView || inTagsView || inCategoriesView) && (
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
                    {editingHeader ? (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={saveHeaderEdit} style={{ background: t.green, border: "none", color: "#fff", fontFamily: sans, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", borderRadius: "20px", cursor: "pointer" }}>{tr("btn_save")}</button>
                        <button onClick={() => setEditingHeader(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.55)", fontFamily: sans, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "20px", cursor: "pointer" }}>{tr("btn_cancel")}</button>
                      </div>
                    ) : (
                      <button onClick={openHeaderEdit} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.45)", fontFamily: sans, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 12px", borderRadius: "20px", cursor: "pointer" }}>{tr("btn_edit")}</button>
                    )}
                  </>
                )}
                {/* Language toggle — always visible */}
                <button
                  onClick={() => setLang(lang === "en" ? "he" : "en")}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.6)", fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", padding: "5px 13px", borderRadius: "20px", cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
                  title={lang === "en" ? "Switch to Hebrew" : "Switch to English"}
                >
                  {tr("lang_toggle")}
                </button>
              </div>
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
            <RecipeDetail recipe={selectedRecipe} tags={tags} recipeCategories={recipeCategories} isEditor={isEditor} onBack={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />
          )}

          {!loading && !error && section === "mealplans" && selectedPlan && selectedPlanData && (
            <MealPlanDetail plan={selectedPlanData} recipes={recipes} ingredients={ingredients} ingredientCategories={ingredientCategories} ingredientMappings={ingredientMappings} tags={tags} recipeCategories={recipeCategories} onBack={() => setSelectedPlan(null)} onSave={handleSavePlan} onDelete={handleDeletePlan} />
          )}

          {!loading && !error && (inListView || inPlanListView || inTagsView || inCategoriesView || inIngredientsView) && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>

              {/* Desktop sidebar */}
              {showSidebar && (
                <aside style={{ width: "172px", flexShrink: 0, position: "sticky", top: "24px", alignSelf: "flex-start", [isRTL ? "paddingLeft" : "paddingRight"]: "20px", [isRTL ? "borderLeft" : "borderRight"]: `1px solid ${t.border}`, [isRTL ? "marginLeft" : "marginRight"]: "24px" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 6px 4px" }}>{tr("nav_recipes")}</p>
                  <SidebarBtn label={tr("nav_all")} active={section === "recipes" && selectedCategory === "all"} onClick={() => { setSelectedCategory("all"); setSelectedTagId(null); navTo("recipes"); }} />
                  {recipeCategories.map(cat => (
                    <SidebarBtn key={cat.id} label={cat.name} active={section === "recipes" && selectedCategory === cat.name} onClick={() => { setSelectedCategory(cat.name); setSelectedTagId(null); navTo("recipes"); }} />
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
                      <button key={cat.id} onClick={() => { setSelectedCategory(cat.name); setSelectedTagId(null); navTo("recipes"); }} style={{ padding: "7px 12px", borderRadius: "20px", border: "none", whiteSpace: "nowrap", background: section === "recipes" && selectedCategory === cat.name ? t.ink : t.surface2, color: section === "recipes" && selectedCategory === cat.name ? "#fff" : t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>{cat.name}</button>
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
                      {filteredRecipes.map(r => <RecipeCard key={r.id} recipe={r} tags={tags} onClick={() => setSelected(r.id)} />)}
                    </div>
                  </div>
                )}

                {section === "mealplans" && (
                  <MealPlanList plans={mealPlans} onCreate={handleCreatePlan} onOpen={id => setSelectedPlan(id)} onDelete={handleDeletePlan} onRename={handleRenamePlan} />
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
