import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { t, serif, sans } from "./theme";
import RecipeCard from "./components/RecipeCard";
import RecipeDetail from "./components/RecipeDetail";
import RecipeForm from "./components/RecipeForm";
import TagManager from "./components/TagManager";
import LoginPage from "./components/LoginPage";
import MealPlanList from "./components/MealPlanList";
import MealPlanDetail from "./components/MealPlanDetail";
import "./App.css";

const CATEGORIES = ["all", "breakfast", "lunch", "dinner", "snack", "dessert"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_CONFIG = {
  overtitle: "a personal collection",
  title: "Oren's Cookbook",
  subtitle: "Collagen · Skin Health · Carnivore Protocol",
};

function SidebarBtn({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block", width: "100%", textAlign: "left",
        padding: "8px 12px 8px 9px",
        borderRadius: "8px", border: "none",
        borderLeft: active ? `3px solid ${t.green}` : "3px solid transparent",
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
    <svg width="28" height="56" viewBox="0 0 28 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      {/* Steam */}
      <path d="M9,13 C8,9 10,6 9,2" stroke="#C47A5A" strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
      <path d="M14,12 C13,8 15,5 14,1" stroke="#C47A5A" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
      <path d="M19,13 C20,9 18,6 19,2" stroke="#C47A5A" strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
      {/* Lid knob */}
      <circle cx="14" cy="15" r="2.5" stroke="#C47A5A" strokeWidth="1.5"/>
      {/* Lid dome */}
      <path d="M4,22 C4,16 24,16 24,22" stroke="#C47A5A" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Rim */}
      <ellipse cx="14" cy="22" rx="11" ry="2.5" stroke="#6A9E82" strokeWidth="1.5"/>
      {/* Body */}
      <path d="M5,22 C3,24 2,34 2,38 C2,42 7,45 14,45 C21,45 26,42 26,38 C26,34 25,24 23,22" stroke="#6A9E82" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Handles */}
      <path d="M5,27 C0,27 0,38 5,38" stroke="#C47A5A" strokeWidth="2" strokeLinecap="round"/>
      <path d="M23,27 C28,27 28,38 23,38" stroke="#C47A5A" strokeWidth="2" strokeLinecap="round"/>
      {/* Bubbles */}
      <circle cx="10" cy="35" r="1.8" stroke="#6A9E82" strokeWidth="1" opacity="0.7"/>
      <circle cx="17" cy="32" r="2.2" stroke="#6A9E82" strokeWidth="1" opacity="0.55"/>
      <circle cx="14" cy="40" r="1.2" stroke="#6A9E82" strokeWidth="1" opacity="0.5"/>
      {/* Legs */}
      <rect x="5.5" y="44" width="3.5" height="9" rx="1.75" stroke="#6A9E82" strokeWidth="1.4"/>
      <rect x="12.25" y="45.5" width="3.5" height="7.5" rx="1.75" stroke="#6A9E82" strokeWidth="1.4"/>
      <rect x="19" y="44" width="3.5" height="9" rx="1.75" stroke="#6A9E82" strokeWidth="1.4"/>
    </svg>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [editingField, setEditingField] = useState(null);
  const [configDraft, setConfigDraft] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [tags, setTags] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [section, setSection] = useState("recipes");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    setLoading(true);
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
    setLoading(false);
  }

  async function saveConfigField(key, value) {
    setConfig(c => ({ ...c, [key]: value }));
    await supabase.from("app_config").upsert({ key, value }, { onConflict: "key" });
  }

  const startEdit = (field) => { setEditingField(field); setConfigDraft({ ...config }); };
  const saveEdit  = (field) => { setEditingField(null); if (configDraft[field] !== config[field]) saveConfigField(field, configDraft[field]); };
  const cancelEdit = () => setEditingField(null);

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

  const selectedRecipe   = recipes.find(r => r.id === selected);
  const selectedPlanData = mealPlans.find(p => p.id === selectedPlan);
  const inListView     = !selected && !adding && section === "recipes";
  const inPlanListView = section === "mealplans" && !selectedPlan;
  const inTagsView     = section === "tags";
  const showSidebar    = !isMobile && (inListView || inPlanListView || inTagsView);

  const overStyle  = { fontSize: "11px", color: t.green,  fontFamily: sans, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 4px 0",  background: "none", border: "none", outline: "none", padding: 0 };
  const titleStyle = { fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "400", color: "#F7F3EE", margin: "0 0 3px 0", fontFamily: serif, letterSpacing: "0.01em", background: "none", border: "none", outline: "none", padding: 0 };
  const subStyle   = { fontSize: "11px", color: t.terra,  fontFamily: sans, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0,             background: "none", border: "none", outline: "none", padding: 0 };

  const EditableText = ({ field, baseStyle, tag: Tag = "p" }) => {
    if (editingField === field) {
      return (
        <input
          value={configDraft[field]}
          onChange={e => setConfigDraft(d => ({ ...d, [field]: e.target.value }))}
          onBlur={() => saveEdit(field)}
          onKeyDown={e => { if (e.key === "Enter") saveEdit(field); if (e.key === "Escape") cancelEdit(); }}
          autoFocus
          style={{ ...baseStyle, display: "block", borderBottom: "1px solid rgba(255,255,255,0.25)", width: "280px", boxSizing: "border-box" }}
        />
      );
    }
    return <Tag onClick={() => startEdit(field)} style={{ ...baseStyle, cursor: "text" }} title="Click to edit">{config[field]}</Tag>;
  };

  return (
    <div style={{ background: t.bg, minHeight: "100vh", color: t.ink }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle at 15% 85%, rgba(106,158,130,0.07) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(196,122,90,0.07) 0%, transparent 45%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ background: t.ink, padding: "20px 24px 18px", borderBottom: `3px solid ${t.terra}` }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <CauldronMark />
                <div>
                  <EditableText field="overtitle" baseStyle={overStyle} tag="p" />
                  <EditableText field="title" baseStyle={titleStyle} tag="h1" />
                  <EditableText field="subtitle" baseStyle={subStyle} tag="p" />
                </div>
              </div>
              {(inListView || inPlanListView || inTagsView) && (
                <div style={{ display: "flex", gap: "8px" }}>
                  {inListView && (
                    <button onClick={() => setAdding(true)} style={{ background: t.terra, border: "none", color: "#fff", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, padding: "8px 18px", borderRadius: "20px", cursor: "pointer" }}>
                      + New recipe
                    </button>
                  )}
                  {inPlanListView && (
                    <button onClick={handleCreatePlan} style={{ background: t.green, border: "none", color: "#fff", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, padding: "8px 18px", borderRadius: "20px", cursor: "pointer" }}>
                      + New plan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page body */}
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: isMobile ? "20px 16px 60px" : "28px 20px 60px" }}>
          {loading && <div style={{ textAlign: "center", padding: "60px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>Loading…</div>}
          {error && (
            <div style={{ background: "#FFF0EE", border: "1px solid #F5C6C0", borderRadius: "8px", padding: "16px", color: "#8B3A3A", fontFamily: sans, fontSize: "13px" }}>
              <strong>Connection error:</strong> {error}
              <br /><span style={{ fontSize: "12px", opacity: 0.8 }}>Check your .env.local</span>
            </div>
          )}

          {!loading && !error && adding && (
            <RecipeForm initial={null} tags={tags} onCancel={() => setAdding(false)} onSave={handleSave} />
          )}

          {!loading && !error && !adding && selected && selectedRecipe && (
            <RecipeDetail recipe={selectedRecipe} tags={tags} onBack={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />
          )}

          {!loading && !error && section === "mealplans" && selectedPlan && selectedPlanData && (
            <MealPlanDetail plan={selectedPlanData} recipes={recipes} onBack={() => setSelectedPlan(null)} onSave={handleSavePlan} onDelete={handleDeletePlan} />
          )}

          {!loading && !error && (inListView || inPlanListView || inTagsView) && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>

              {/* Desktop sidebar */}
              {showSidebar && (
                <aside style={{ width: "172px", flexShrink: 0, position: "sticky", top: "24px", alignSelf: "flex-start", paddingRight: "20px", borderRight: `1px solid ${t.border}`, marginRight: "24px" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 6px 4px" }}>Recipes</p>
                  {CATEGORIES.map(cat => (
                    <SidebarBtn key={cat}
                      label={cat === "all" ? "All recipes" : cat}
                      active={section === "recipes" && selectedCategory === cat}
                      onClick={() => { setSelectedCategory(cat); setSelectedTagId(null); setSection("recipes"); }}
                    />
                  ))}
                  <div style={{ borderTop: `1px solid ${t.border}`, marginTop: "14px", paddingTop: "14px" }}>
                    <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 6px 4px" }}>Planning</p>
                    <SidebarBtn label="Meal plans" active={section === "mealplans"} onClick={() => { setSection("mealplans"); setSelected(null); setAdding(false); }} />
                  </div>
                  <div style={{ borderTop: `1px solid ${t.border}`, marginTop: "14px", paddingTop: "14px" }}>
                    <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 6px 4px" }}>Manage</p>
                    <SidebarBtn label="Tags" active={section === "tags"} onClick={() => { setSection("tags"); setSelected(null); setAdding(false); }} />
                  </div>
                </aside>
              )}

              {/* Main area */}
              <main style={{ flex: 1, minWidth: 0 }}>
                {/* Mobile nav tabs */}
                {isMobile && (
                  <div style={{ display: "flex", gap: "4px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => { setSelectedCategory(cat); setSelectedTagId(null); setSection("recipes"); }} style={{
                        padding: "7px 12px", borderRadius: "20px", border: "none", whiteSpace: "nowrap",
                        background: section === "recipes" && selectedCategory === cat ? t.ink : t.surface2,
                        color: section === "recipes" && selectedCategory === cat ? "#fff" : t.inkLight,
                        fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                      }}>{cat === "all" ? "All" : cat}</button>
                    ))}
                    <button onClick={() => setSection("mealplans")} style={{
                      padding: "7px 12px", borderRadius: "20px", border: "none", whiteSpace: "nowrap",
                      background: section === "mealplans" ? t.terra : t.surface2,
                      color: section === "mealplans" ? "#fff" : t.inkLight,
                      fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                    }}>Meal plans</button>
                    <button onClick={() => setSection("tags")} style={{
                      padding: "7px 12px", borderRadius: "20px", border: "none", whiteSpace: "nowrap",
                      background: section === "tags" ? t.green : t.surface2,
                      color: section === "tags" ? "#fff" : t.inkLight,
                      fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                    }}>Tags</button>
                  </div>
                )}

                {/* Recipes list */}
                {section === "recipes" && (
                  <div>
                    {/* Search bar */}
                    <div style={{ position: "relative", marginBottom: "16px" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: t.inkFaint, pointerEvents: "none" }}>🔍</span>
                      <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search recipes, ingredients…"
                        style={{ width: "100%", fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface, border: `1px solid ${t.border}`, borderRadius: "24px", padding: "10px 16px 10px 36px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                        onFocus={e => e.target.style.borderColor = t.green}
                        onBlur={e => e.target.style.borderColor = t.border}
                      />
                      {search && (
                        <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: t.inkFaint, cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>
                      )}
                    </div>

                    {tags.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: t.inkFaint, fontFamily: sans, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>Filter:</span>
                        {tags.map(tag => {
                          const active = selectedTagId === tag.id;
                          return (
                            <button key={tag.id} onClick={() => setSelectedTagId(active ? null : tag.id)} style={{
                              padding: "3px 10px", borderRadius: "20px", border: `1px solid ${tag.color}`,
                              background: active ? tag.color : "transparent", color: active ? "#fff" : tag.color,
                              fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                            }}>{tag.name}</button>
                          );
                        })}
                        {selectedTagId && (
                          <button onClick={() => setSelectedTagId(null)} style={{ background: "none", border: "none", color: t.inkFaint, fontFamily: sans, fontSize: "11px", cursor: "pointer", padding: "2px 4px" }}>× clear</button>
                        )}
                      </div>
                    )}
                    <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 14px 0", paddingBottom: "10px", borderBottom: `1px solid ${t.border}` }}>
                      {filteredRecipes.length} {filteredRecipes.length === 1 ? "recipe" : "recipes"}
                      {search && <span style={{ color: t.terra }}> · "{search}"</span>}
                    </p>
                    {filteredRecipes.length === 0 && (
                      <div style={{ textAlign: "center", padding: "60px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>
                        {search ? `No recipes matching "${search}"` : "No recipes in this category."}
                      </div>
                    )}
                    <div key={`${selectedCategory}-${selectedTagId}`} style={{ display: "flex", flexDirection: "column", gap: "12px", animation: "fadeSlideIn 0.2s ease" }}>
                      {filteredRecipes.map(r => (
                        <RecipeCard key={r.id} recipe={r} tags={tags} onClick={() => setSelected(r.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Meal plans list */}
                {section === "mealplans" && (
                  <MealPlanList plans={mealPlans} onCreate={handleCreatePlan} onOpen={id => setSelectedPlan(id)} onDelete={handleDeletePlan} onRename={handleRenamePlan} />
                )}

                {/* Tags section */}
                {section === "tags" && (
                  <TagManager tags={tags} onCreate={createTag} onUpdate={updateTag} onDelete={deleteTag} />
                )}
              </main>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
