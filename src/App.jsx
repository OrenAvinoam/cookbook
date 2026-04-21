import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { t, serif, sans } from "./theme";
import RecipeCard from "./components/RecipeCard";
import RecipeDetail from "./components/RecipeDetail";
import RecipeForm from "./components/RecipeForm";
import TagManager from "./components/TagManager";
import "./App.css";

const CATEGORIES = ["all", "breakfast", "lunch", "dinner", "snack", "dessert"];

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: recipesData, error: rErr }, { data: tagsData, error: tErr }] = await Promise.all([
      supabase.from("recipes").select("*").order("created_at", { ascending: true }),
      supabase.from("tags").select("*").order("name"),
    ]);
    if (rErr || tErr) setError((rErr || tErr).message);
    else { setRecipes(recipesData); setTags(tagsData); }
    setLoading(false);
  }

  const filteredRecipes = recipes.filter((r) => {
    const catOk = selectedCategory === "all" || r.category === selectedCategory;
    const tagOk = !selectedTagId || (r.tag_ids || []).includes(selectedTagId);
    return catOk && tagOk;
  });

  async function handleSave(form) {
    const payload = {
      title: form.title, emoji: form.emoji, description: form.description,
      category: form.category || "other",
      tag_ids: form.tag_ids || [],
      servings: form.servings, prep_time: form.prep_time, cook_time: form.cook_time,
      total_time: form.total_time, dose: form.dose,
      ingredients: form.ingredients, steps: form.steps, notes: form.notes,
      nutrition: form.nutrition || null,
    };
    if (form.id) {
      const { error } = await supabase.from("recipes").update(payload).eq("id", form.id);
      if (error) throw error;
      setRecipes((prev) => prev.map((r) => r.id === form.id ? { ...r, ...payload } : r));
    } else {
      const { data, error } = await supabase.from("recipes").insert(payload).select().single();
      if (error) throw error;
      setRecipes((prev) => [...prev, data]);
      setAdding(false);
      setSelected(data.id);
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) { alert("Delete failed: " + error.message); return; }
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setSelected(null);
  }

  async function createTag(name, color) {
    const { data, error } = await supabase.from("tags").insert({ name, color }).select().single();
    if (error) throw error;
    setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function updateTag(id, updates) {
    const { error } = await supabase.from("tags").update(updates).eq("id", id);
    if (error) throw error;
    setTags((prev) => prev.map((tg) => tg.id === id ? { ...tg, ...updates } : tg));
  }

  async function deleteTag(id) {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw error;
    setTags((prev) => prev.filter((tg) => tg.id !== id));
    setRecipes((prev) => prev.map((r) => ({ ...r, tag_ids: (r.tag_ids || []).filter((tid) => tid !== id) })));
    if (selectedTagId === id) setSelectedTagId(null);
  }

  const selectedRecipe = recipes.find((r) => r.id === selected);
  const inList = !selected && !adding;

  return (
    <div style={{ background: t.bg, minHeight: "100vh", color: t.ink }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%, rgba(106,158,130,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(196,122,90,0.05) 0%, transparent 50%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${t.border}`, padding: "32px 28px 24px", background: t.surface }}>
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            <p style={{ fontSize: "11px", color: t.green, fontFamily: sans, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 6px 0" }}>a personal collection</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h1 style={{ fontSize: "clamp(28px, 6vw, 48px)", fontWeight: "400", color: t.ink, margin: "0 0 4px 0", fontFamily: serif, letterSpacing: "0.01em" }}>
                  Oren's Cookbook
                </h1>
                <p style={{ fontSize: "11px", color: t.terra, fontFamily: sans, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>
                  Collagen · Skin Health · Carnivore Protocol
                </p>
              </div>
              {inList && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setShowTagManager(true)} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 14px", borderRadius: "20px", cursor: "pointer" }}>
                    Tags
                  </button>
                  <button onClick={() => setAdding(true)} style={{ background: t.green, border: "none", color: "#fff", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, padding: "8px 18px", borderRadius: "20px", cursor: "pointer" }}>
                    + New recipe
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 20px 60px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>Loading…</div>
          )}
          {error && (
            <div style={{ background: "#FFF0EE", border: "1px solid #F5C6C0", borderRadius: "8px", padding: "16px", color: "#8B3A3A", fontFamily: sans, fontSize: "13px" }}>
              <strong>Connection error:</strong> {error}
              <br /><span style={{ fontSize: "12px", opacity: 0.8 }}>Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local</span>
            </div>
          )}

          {!loading && !error && adding && (
            <RecipeForm initial={null} tags={tags} onCancel={() => setAdding(false)} onSave={handleSave} />
          )}

          {!loading && !error && inList && (
            <div>
              {/* Category tabs */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => { setSelectedCategory(cat); setSelectedTagId(null); }} style={{
                    padding: "7px 16px", borderRadius: "20px", border: "none", whiteSpace: "nowrap",
                    background: selectedCategory === cat ? t.ink : t.surface2,
                    color: selectedCategory === cat ? "#fff" : t.inkLight,
                    fontFamily: sans, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
                    cursor: "pointer", transition: "background 0.18s, color 0.18s",
                  }}>
                    {cat === "all" ? "All recipes" : cat}
                  </button>
                ))}
              </div>

              {/* Tag filter */}
              {tags.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: t.inkFaint, fontFamily: sans, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>Filter:</span>
                  {tags.map((tag) => {
                    const active = selectedTagId === tag.id;
                    return (
                      <button key={tag.id} onClick={() => setSelectedTagId(active ? null : tag.id)} style={{
                        padding: "3px 10px", borderRadius: "20px", border: `1px solid ${tag.color}`,
                        background: active ? tag.color : "transparent",
                        color: active ? "#fff" : tag.color,
                        fontFamily: sans, fontSize: "10px", letterSpacing: "0.1em",
                        textTransform: "uppercase", cursor: "pointer", transition: "background 0.18s, color 0.18s",
                      }}>{tag.name}</button>
                    );
                  })}
                  {selectedTagId && (
                    <button onClick={() => setSelectedTagId(null)} style={{ background: "none", border: "none", color: t.inkFaint, fontFamily: sans, fontSize: "11px", cursor: "pointer", padding: "2px 4px" }}>× clear</button>
                  )}
                </div>
              )}

              <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 14px 0", paddingBottom: "10px", borderBottom: `1px solid ${t.border}` }}>
                {filteredRecipes.length} {filteredRecipes.length === 1 ? "recipe" : "recipes"}
              </p>

              {filteredRecipes.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>
                  No recipes in this category.
                </div>
              )}

              <div key={`${selectedCategory}-${selectedTagId}`} style={{ display: "flex", flexDirection: "column", gap: "12px", animation: "fadeSlideIn 0.2s ease" }}>
                {filteredRecipes.map((r) => (
                  <RecipeCard key={r.id} recipe={r} tags={tags} onClick={() => setSelected(r.id)} />
                ))}
              </div>
            </div>
          )}

          {!loading && !error && selected && selectedRecipe && (
            <RecipeDetail
              recipe={selectedRecipe}
              tags={tags}
              onBack={() => setSelected(null)}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {showTagManager && (
        <TagManager
          tags={tags}
          onCreate={createTag}
          onUpdate={updateTag}
          onDelete={deleteTag}
          onClose={() => setShowTagManager(false)}
        />
      )}
    </div>
  );
}
