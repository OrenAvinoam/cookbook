import { useState } from "react";
import { t, serif, sans } from "../theme";

const EMOJI_FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
const RECIPE_CATS = ["all", "breakfast", "lunch", "dinner", "snack", "dessert"];

export default function AddItemModal({ recipes, ingredients, categories, mappings, tags, onAdd, onClose }) {
  const [tab, setTab] = useState("recipes");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeCat, setRecipeCat] = useState("all");
  const [recipeTagId, setRecipeTagId] = useState(null);
  const [ingrSearch, setIngrSearch] = useState("");
  const [ingrCat, setIngrCat] = useState("all");
  const [flash, setFlash] = useState(new Set());

  const getMapping = (id) => mappings.find(m => m.ingredient_id === id);
  const getCat = (id) => categories.find(c => c.id === id);

  const filteredRecipes = recipes.filter(r => {
    const catOk = recipeCat === "all" || r.category === recipeCat;
    const tagOk = !recipeTagId || (r.tag_ids || []).includes(recipeTagId);
    const q = recipeSearch.trim().toLowerCase();
    return catOk && tagOk && (!q || r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  });

  const filteredIngredients = ingredients.filter(ing => {
    const catOk = ingrCat === "all" || ing.category_id === ingrCat;
    const q = ingrSearch.trim().toLowerCase();
    return catOk && (!q || ing.name.toLowerCase().includes(q) || (ing.aliases || []).some(a => a.toLowerCase().includes(q)));
  });

  const handleAdd = (type, id) => {
    onAdd(type, id);
    const key = `${type}-${id}`;
    setFlash(prev => new Set([...prev, key]));
    setTimeout(() => setFlash(prev => { const n = new Set(prev); n.delete(key); return n; }), 1400);
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      flex: 1, padding: "11px 0", border: "none", cursor: "pointer",
      fontFamily: sans, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase",
      background: tab === id ? t.surface : t.surface2,
      color: tab === id ? t.ink : t.inkLight,
      borderBottom: tab === id ? `2px solid ${t.green}` : `2px solid transparent`,
      transition: "all 0.15s",
    }}>{label}</button>
  );

  const FilterChip = ({ active, onClick, label }) => (
    <button onClick={onClick} style={{
      padding: "4px 11px", borderRadius: "20px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
      background: active ? t.ink : t.surface2, color: active ? "#fff" : t.inkLight,
      fontFamily: sans, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase",
      transition: "background 0.15s",
    }}>{label}</button>
  );

  const AddBtn = ({ type, id }) => {
    const added = flash.has(`${type}-${id}`);
    return (
      <button onClick={() => handleAdd(type, id)} style={{
        background: added ? t.green : "transparent",
        border: `1px solid ${added ? t.green : t.border}`,
        color: added ? "#fff" : t.inkLight,
        fontFamily: sans, fontSize: "11px", letterSpacing: "0.08em",
        padding: "5px 14px", borderRadius: "20px", cursor: "pointer",
        transition: "all 0.2s", flexShrink: 0, minWidth: "72px",
      }}>{added ? "✓ Added" : "+ Add"}</button>
    );
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(44,36,24,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
    >
      <div style={{
        background: t.bg, borderRadius: "16px", width: "100%", maxWidth: "680px",
        maxHeight: "82vh", display: "flex", flexDirection: "column",
        boxShadow: "0 28px 72px rgba(0,0,0,0.25)", border: `1px solid ${t.border}`,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0" }}>
          <h3 style={{ fontFamily: serif, fontSize: "20px", fontWeight: "400", color: t.ink, margin: 0 }}>Add to day</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.inkFaint, cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, marginTop: "12px" }}>
          <TabBtn id="recipes" label="Recipes" />
          <TabBtn id="ingredients" label="Ingredients" />
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>

          {/* ── RECIPES TAB ── */}
          {tab === "recipes" && (
            <div>
              {/* Search */}
              <div style={{ position: "relative", marginBottom: "10px" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: t.inkFaint, pointerEvents: "none", fontSize: "13px" }}>🔍</span>
                <input type="text" value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)}
                  placeholder="Search recipes…"
                  style={{ width: "100%", fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface, border: `1px solid ${t.border}`, borderRadius: "24px", padding: "8px 14px 8px 32px", outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Category chips */}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
                {RECIPE_CATS.map(cat => (
                  <FilterChip key={cat} active={recipeCat === cat} onClick={() => setRecipeCat(cat)} label={cat === "all" ? "All" : cat} />
                ))}
              </div>

              {/* Tag chips */}
              {tags.length > 0 && (
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontFamily: sans, color: t.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>Tags:</span>
                  {tags.map(tag => {
                    const active = recipeTagId === tag.id;
                    return (
                      <button key={tag.id} onClick={() => setRecipeTagId(active ? null : tag.id)} style={{
                        padding: "3px 10px", borderRadius: "20px", border: `1px solid ${tag.color}`,
                        background: active ? tag.color : "transparent", color: active ? "#fff" : tag.color,
                        fontFamily: sans, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                      }}>{tag.name}</button>
                    );
                  })}
                  {recipeTagId && <button onClick={() => setRecipeTagId(null)} style={{ background: "none", border: "none", color: t.inkFaint, fontFamily: sans, fontSize: "10px", cursor: "pointer" }}>× clear</button>}
                </div>
              )}

              {/* Recipe list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {filteredRecipes.map(r => {
                  const recipeTags = (r.tag_ids || []).map(id => tags.find(tg => tg.id === id)).filter(Boolean);
                  const accent = recipeTags[0]?.color || t.green;
                  return (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: t.surface, border: `1px solid ${t.border}`, borderLeft: `3px solid ${accent}`, borderRadius: "8px" }}>
                      {r.image_url ? (
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `1px solid ${accent}30` }}>
                          <img src={r.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: r.image_position || "50% 50%" }} />
                        </div>
                      ) : (
                        <span style={{ fontSize: "22px", fontFamily: EMOJI_FONT, flexShrink: 0 }}>{r.emoji}</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "15px", fontFamily: serif, color: t.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                        {r.category && <div style={{ fontSize: "10px", fontFamily: sans, color: t.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "2px" }}>{r.category}</div>}
                      </div>
                      <AddBtn type="recipe" id={r.id} />
                    </div>
                  );
                })}
                {filteredRecipes.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>No recipes found.</div>
                )}
              </div>
            </div>
          )}

          {/* ── INGREDIENTS TAB ── */}
          {tab === "ingredients" && (
            <div>
              {/* Search */}
              <div style={{ position: "relative", marginBottom: "10px" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: t.inkFaint, pointerEvents: "none", fontSize: "13px" }}>🔍</span>
                <input type="text" value={ingrSearch} onChange={e => setIngrSearch(e.target.value)}
                  placeholder="Search ingredients…"
                  style={{ width: "100%", fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface, border: `1px solid ${t.border}`, borderRadius: "24px", padding: "8px 14px 8px 32px", outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Category chips */}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "12px" }}>
                <FilterChip active={ingrCat === "all"} onClick={() => setIngrCat("all")} label="All" />
                {categories.map(cat => (
                  <FilterChip key={cat.id} active={ingrCat === cat.id} onClick={() => setIngrCat(cat.id)} label={`${cat.icon ? cat.icon + " " : ""}${cat.name}`} />
                ))}
              </div>

              {/* Ingredient list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {filteredIngredients.map(ing => {
                  const cat = getCat(ing.category_id);
                  const mapping = getMapping(ing.id);
                  return (
                    <div key={ing.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: t.surface, border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.green}`, borderRadius: "8px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "15px", fontFamily: serif, color: t.ink }}>{ing.name}</div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "2px", flexWrap: "wrap", alignItems: "center" }}>
                          {cat && <span style={{ fontSize: "10px", fontFamily: sans, color: t.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>{cat.icon ? `${cat.icon} ` : ""}{cat.name}</span>}
                          {mapping?.nutrients?.calories != null && <span style={{ fontSize: "10px", fontFamily: sans, color: t.terra }}>{mapping.nutrients.calories} kcal/100g</span>}
                        </div>
                      </div>
                      <AddBtn type="ingredient" id={ing.id} />
                    </div>
                  );
                })}
                {filteredIngredients.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>
                    {ingredients.length === 0 ? "No ingredients in catalogue yet." : "No ingredients found."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: t.green, border: "none", color: "#fff", fontFamily: sans, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "9px 26px", borderRadius: "20px", cursor: "pointer" }}>Done</button>
        </div>
      </div>
    </div>
  );
}
