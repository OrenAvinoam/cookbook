import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { t, serif, sans } from "./theme";
import RecipeCard from "./components/RecipeCard";
import RecipeDetail from "./components/RecipeDetail";
import RecipeForm from "./components/RecipeForm";
import "./App.css";

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    setLoading(true);
    const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setRecipes(data);
    setLoading(false);
  }

  async function handleSave(form) {
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      tag: form.tag,
      tag_color: form.tag_color,
      emoji: form.emoji,
      description: form.description,
      servings: form.servings,
      prep_time: form.prep_time,
      cook_time: form.cook_time,
      total_time: form.total_time,
      dose: form.dose,
      ingredients: form.ingredients,
      steps: form.steps,
      notes: form.notes,
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

  const selectedRecipe = recipes.find(r => r.id === selected);

  return (
    <div style={{ background: t.bg, minHeight: "100vh", color: t.ink }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%, rgba(106,158,130,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(196,122,90,0.05) 0%, transparent 50%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ borderBottom: `1px solid ${t.border}`, padding: "40px 28px 32px", background: t.surface }}>
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            <p style={{ fontSize: "11px", color: t.green, fontFamily: sans, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 8px 0" }}>a personal collection</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h1 style={{ fontSize: "clamp(30px, 7vw, 52px)", fontWeight: "400", color: t.ink, margin: "0 0 6px 0", fontFamily: serif, letterSpacing: "0.01em" }}>
                  Oren's Cookbook
                </h1>
                <p style={{ fontSize: "15px", color: t.terra, fontFamily: serif, fontStyle: "italic", margin: "0 0 20px 0", letterSpacing: "0.02em" }}>
                  Collagen · Skin Health · Carnivore Protocol
                </p>
                {!selected && !adding && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {["Zero sugar", "Low carb", "Skin optimised", `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""}`].map((tag, i) => (
                      <span key={i} style={{ fontSize: "10px", color: t.inkLight, fontFamily: sans, letterSpacing: "0.1em", background: t.surface2, border: `1px solid ${t.border}`, padding: "3px 10px", borderRadius: "20px" }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              {!selected && !adding && (
                <button onClick={() => setAdding(true)} style={{ background: t.green, border: "none", color: "#fff", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, padding: "9px 20px", borderRadius: "20px", cursor: "pointer", flexShrink: 0 }}>
                  + New recipe
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 20px 60px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>Loading recipes…</div>
          )}
          {error && (
            <div style={{ background: "#FFF0EE", border: "1px solid #F5C6C0", borderRadius: "8px", padding: "16px", color: "#8B3A3A", fontFamily: sans, fontSize: "13px" }}>
              <strong>Connection error:</strong> {error}
              <br /><span style={{ fontSize: "12px", opacity: 0.8 }}>Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local</span>
            </div>
          )}
          {!loading && !error && adding && (
            <RecipeForm
              initial={null}
              onCancel={() => setAdding(false)}
              onSave={handleSave}
            />
          )}
          {!loading && !error && !adding && !selected && (
            <div>
              <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 16px 0", paddingBottom: "10px", borderBottom: `1px solid ${t.border}` }}>All Recipes</p>
              {recipes.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>
                  No recipes yet.{" "}
                  <button onClick={() => setAdding(true)} style={{ background: "none", border: "none", color: t.green, cursor: "pointer", fontFamily: sans, fontSize: "13px", textDecoration: "underline" }}>
                    Add your first one
                  </button>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recipes.map(r => <RecipeCard key={r.id} recipe={r} onClick={() => setSelected(r.id)} />)}
              </div>
            </div>
          )}
          {!loading && !error && selected && selectedRecipe && (
            <RecipeDetail
              recipe={selectedRecipe}
              onBack={() => setSelected(null)}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
