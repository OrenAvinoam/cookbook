import { useState } from "react";
import { t, serif, sans } from "../theme";
import IngredientList from "./IngredientList";
import StepList from "./StepList";
import NoteList from "./NoteList";
import NutritionLabel from "./NutritionLabel";
import RecipeForm from "./RecipeForm";

const NUTRITION_FIELDS = [
  { key: "calories",     label: "Calories",          unit: "kcal" },
  { key: "totalFat",     label: "Total Fat",          unit: "g" },
  { key: "saturatedFat", label: "Saturated Fat",      unit: "g" },
  { key: "transFat",     label: "Trans Fat",          unit: "g" },
  { key: "cholesterol",  label: "Cholesterol",        unit: "mg" },
  { key: "sodium",       label: "Sodium",             unit: "mg" },
  { key: "totalCarb",    label: "Total Carbohydrate", unit: "g" },
  { key: "fiber",        label: "Dietary Fiber",      unit: "g" },
  { key: "sugars",       label: "Total Sugars",       unit: "g" },
  { key: "protein",      label: "Protein",            unit: "g" },
  { key: "vitaminD",     label: "Vitamin D",          unit: "mcg" },
  { key: "calcium",      label: "Calcium",            unit: "mg" },
  { key: "iron",         label: "Iron",               unit: "mg" },
  { key: "potassium",    label: "Potassium",          unit: "mg" },
];

const emptyNutrition = Object.fromEntries(NUTRITION_FIELDS.map((f) => [f.key, ""]));

function NutritionForm({ initial, onSave, onCancel }) {
  const [vals, setVals] = useState(
    initial ? Object.fromEntries(NUTRITION_FIELDS.map((f) => [f.key, initial[f.key] ?? ""])) : emptyNutrition
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const nutrition = Object.fromEntries(
      NUTRITION_FIELDS.map((f) => [f.key, vals[f.key] === "" ? null : Number(vals[f.key])])
    );
    try { await onSave(nutrition); } finally { setSaving(false); }
  };

  return (
    <div>
      <p style={{ fontFamily: sans, fontSize: "12px", color: t.inkFaint, margin: "0 0 16px 0", lineHeight: 1.6 }}>
        Enter per-serving values. Leave blank for any you don't have.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "20px" }}>
        {NUTRITION_FIELDS.map((f) => (
          <div key={f.key}>
            <label style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, display: "block", marginBottom: "3px" }}>
              {f.label} <span style={{ opacity: 0.6 }}>({f.unit})</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={vals[f.key]}
              onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              style={{ width: "100%", fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "7px 10px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={handleSave} disabled={saving} style={{ background: t.green, border: "none", color: "#fff", fontFamily: sans, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "8px 20px", borderRadius: "20px", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Save nutrition"}
        </button>
        {onCancel && (
          <button onClick={onCancel} style={{ background: "none", border: `1px solid ${t.border}`, color: t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "8px 16px", borderRadius: "20px", cursor: "pointer" }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function RecipeDetail({ recipe, tags, onBack, onSave, onDelete }) {
  const [tab, setTab] = useState("ingredients");
  const [editing, setEditing] = useState(false);
  const [editingNutrition, setEditingNutrition] = useState(false);

  const recipeTags = (recipe.tag_ids || [])
    .map((id) => tags.find((tg) => tg.id === id))
    .filter(Boolean);

  const accentColor = recipeTags[0]?.color || t.green;
  const tabs = ["ingredients", "steps", "notes", "nutrition"];

  async function handleSaveNutrition(nutrition) {
    await onSave({ ...recipe, nutrition });
    setEditingNutrition(false);
  }

  if (editing) {
    return (
      <RecipeForm
        initial={recipe}
        tags={tags}
        onCancel={() => setEditing(false)}
        onSave={async (data) => { await onSave(data); setEditing(false); }}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
          ← All recipes
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setEditing(true)} style={{ background: "transparent", border: `1px solid ${accentColor}`, color: accentColor, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
            Edit
          </button>
          <button onClick={() => { if (confirm("Delete this recipe?")) onDelete(recipe.id); }} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
            Delete
          </button>
        </div>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "32px", marginBottom: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "56px", lineHeight: 1 }}>{recipe.emoji}</span>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
              {recipe.category && (
                <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color: t.inkFaint, background: t.surface2, border: `1px solid ${t.border}`, padding: "3px 8px", borderRadius: "20px" }}>
                  {recipe.category}
                </span>
              )}
              {recipeTags.map((tag) => (
                <span key={tag.id} style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color: tag.color, background: tag.color + "18", border: `1px solid ${tag.color}40`, padding: "3px 8px", borderRadius: "20px" }}>
                  {tag.name}
                </span>
              ))}
            </div>
            <h1 style={{ fontSize: "clamp(22px, 5vw, 34px)", fontWeight: "400", color: t.ink, margin: "0 0 10px 0", fontFamily: serif }}>{recipe.title}</h1>
            <p style={{ fontSize: "13px", color: t.inkLight, fontFamily: sans, lineHeight: 1.7, margin: 0 }}>{recipe.description}</p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: "16px" }}>
          {[
            { l: "Prep", v: recipe.prep_time },
            { l: "Cook", v: recipe.cook_time },
            { l: "Total", v: recipe.total_time },
            { l: "Servings", v: recipe.servings },
            { l: "Daily dose", v: recipe.dose },
          ].filter((s) => s.v).map((s, i, arr) => (
            <div key={i} style={{ flex: "1 1 auto", padding: "10px 16px", borderRight: i < arr.length - 1 ? `1px solid ${t.border}` : "none", minWidth: "80px" }}>
              <div style={{ fontSize: "13px", color: t.ink, fontFamily: sans, fontWeight: "500" }}>{s.v}</div>
              <div style={{ fontSize: "9px", color: t.inkFaint, fontFamily: sans, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: "3px" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: `2px solid ${t.border}`, marginBottom: "20px" }}>
        {tabs.map((tb) => (
          <button key={tb} onClick={() => { setTab(tb); setEditingNutrition(false); }} style={{
            padding: "10px 20px", background: "transparent", border: "none",
            borderBottom: tab === tb ? `2px solid ${accentColor}` : "2px solid transparent",
            marginBottom: "-2px", color: tab === tb ? accentColor : t.inkFaint,
            cursor: "pointer", fontSize: "11px", letterSpacing: "0.14em",
            textTransform: "uppercase", fontFamily: sans, transition: "color 0.2s",
          }}>
            {tb}
          </button>
        ))}
      </div>

      <div key={tab} style={{ animation: "fadeSlideIn 0.18s ease" }}>
        {tab === "ingredients" && <IngredientList ingredients={recipe.ingredients} accentColor={accentColor} />}
        {tab === "steps" && <StepList steps={recipe.steps} accentColor={accentColor} />}
        {tab === "notes" && <NoteList notes={recipe.notes} accentColor={accentColor} />}
        {tab === "nutrition" && (
          <div>
            {editingNutrition || !recipe.nutrition ? (
              <NutritionForm
                initial={recipe.nutrition}
                onSave={handleSaveNutrition}
                onCancel={recipe.nutrition ? () => setEditingNutrition(false) : null}
              />
            ) : (
              <div>
                <NutritionLabel nutrition={recipe.nutrition} servings={recipe.servings} />
                <button onClick={() => setEditingNutrition(true)} style={{ marginTop: "16px", background: "none", border: `1px solid ${t.border}`, color: t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 14px", borderRadius: "20px", cursor: "pointer" }}>
                  Edit nutrition
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
