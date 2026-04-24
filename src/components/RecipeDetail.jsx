import { useState } from "react";
import { t, serif, sans, body } from "../theme";
import { useLanguage } from "../i18n";
import IngredientList from "./IngredientList";
import StepList from "./StepList";
import NoteList from "./NoteList";
import NutritionLabel from "./NutritionLabel";
import RecipeForm from "./RecipeForm";
import PrintView from "./PrintView";

const EMOJI_FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

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

function scaleAmount(str, factor) {
  if (!str || factor === 1) return str;
  const FRAC = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };
  let s = str.trim();
  for (const [sym, val] of Object.entries(FRAC))
    s = s.replace(sym, (Math.round(val * 1000) / 1000).toString());
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)(.*)/);
  if (mixed) return fmtN((+mixed[1] + +mixed[2] / +mixed[3]) * factor) + mixed[4];
  const frac = s.match(/^(\d+)\/(\d+)(.*)/);
  if (frac) return fmtN((+frac[1] / +frac[2]) * factor) + frac[3];
  const num = s.match(/^(\d*\.?\d+)(.*)/);
  if (num) return fmtN(parseFloat(num[1]) * factor) + num[2];
  return str;
}
function fmtN(n) { const r = Math.round(n * 100) / 100; return String(r); }

function NutritionForm({ initial, onSave, onCancel }) {
  const { tr } = useLanguage();
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
      <p style={{ fontFamily: sans, fontSize: "13px", color: t.inkFaint, margin: "0 0 16px 0", lineHeight: 1.6 }}>
        {tr("enter_nutrition")}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "20px" }}>
        {NUTRITION_FIELDS.map((f) => (
          <div key={f.key}>
            <label style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, display: "block", marginBottom: "3px" }}>
              {f.label} <span style={{ opacity: 0.6 }}>({f.unit})</span>
            </label>
            <input
              type="number" min="0" step="any"
              value={vals[f.key]}
              onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              style={{ width: "100%", fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "7px 10px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={handleSave} disabled={saving} style={{ background: t.green, border: "none", color: "#fff", fontFamily: sans, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "8px 20px", borderRadius: "20px", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? tr("btn_saving") : tr("save_nutrition")}
        </button>
        {onCancel && (
          <button onClick={onCancel} style={{ background: "none", border: `1px solid ${t.border}`, color: t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "8px 16px", borderRadius: "20px", cursor: "pointer" }}>
            {tr("btn_cancel")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RecipeDetail({ recipe, tags, recipeCategories = [], isEditor, onBack, onSave, onDelete }) {
  const [tab, setTab] = useState("ingredients");
  const [editing, setEditing] = useState(false);
  const [editingNutrition, setEditingNutrition] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [checkedSteps, setCheckedSteps] = useState(new Set());
  const [servingsCount, setServingsCount] = useState(() => parseFloat(recipe.servings) || 1);

  const baseServings = parseFloat(recipe.servings) || 1;
  const scaleFactor = servingsCount / baseServings;

  const scaledIngredients = (recipe.ingredients || []).map(ing => ({
    ...ing,
    amount: scaleAmount(ing.amount, scaleFactor),
  }));

  const recipeTags = (recipe.tag_ids || [])
    .map((id) => tags.find((tg) => tg.id === id))
    .filter(Boolean);

  const accentColor = recipeTags[0]?.color || t.green;
  const { tr, tcat } = useLanguage();
  const tabs = ["ingredients", "steps", "notes", "nutrition"];

  function toggleIngredient(i) {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function toggleStep(i) {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function handleSaveNutrition(nutrition) {
    await onSave({ ...recipe, nutrition });
    setEditingNutrition(false);
  }

  if (editing && isEditor) {
    return (
      <RecipeForm
        initial={recipe}
        tags={tags}
        recipeCategories={recipeCategories}
        onCancel={() => setEditing(false)}
        onSave={async (data) => { await onSave(data); setEditing(false); }}
      />
    );
  }

  if (printing) {
    return <PrintView recipe={recipe} tags={tags} scaleFactor={scaleFactor} onClose={() => setPrinting(false)} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
          {tr("btn_back_recipes")}
        </button>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => setPrinting(true)} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
            {tr("btn_print")}
          </button>
          <button onClick={() => { setCookMode(m => !m); setCheckedIngredients(new Set()); setCheckedSteps(new Set()); }} style={{ background: cookMode ? accentColor : "transparent", border: `1px solid ${cookMode ? accentColor : t.border}`, color: cookMode ? "#fff" : t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
            {cookMode ? tr("btn_exit_cook") : tr("btn_cook_mode")}
          </button>
          {isEditor && (
            <button onClick={() => setEditing(true)} style={{ background: "transparent", border: `1px solid ${accentColor}`, color: accentColor, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
              {tr("btn_edit")}
            </button>
          )}
          {isEditor && (
            <button onClick={() => { if (confirm(tr("confirm_delete_recipe"))) onDelete(recipe.id); }} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
              {tr("btn_delete")}
            </button>
          )}
        </div>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "32px", marginBottom: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
            {recipe.category && (
              <span style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color: t.inkFaint, background: t.surface2, border: `1px solid ${t.border}`, padding: "3px 8px", borderRadius: "20px" }}>
                {tcat(recipe.category)}
              </span>
            )}
            {recipeTags.map((tag) => (
              <span key={tag.id} style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color: tag.color, background: tag.color + "18", border: `1px solid ${tag.color}40`, padding: "3px 8px", borderRadius: "20px" }}>
                {tag.name}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "10px" }}>
            {recipe.image_url ? (
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${accentColor}40` }}>
                <img src={recipe.image_url} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: recipe.image_position || "50% 50%" }} />
              </div>
            ) : (
              <span style={{ fontSize: "56px", lineHeight: 1, flexShrink: 0, display: "flex", alignItems: "center", fontFamily: EMOJI_FONT }}>{recipe.emoji}</span>
            )}
            <h1 style={{ fontSize: "clamp(22px, 5vw, 34px)", fontWeight: "400", color: t.ink, margin: 0, fontFamily: serif }}>{recipe.title}</h1>
          </div>
          <p style={{ fontSize: "20px", color: t.inkLight, fontFamily: body, lineHeight: 1.7, margin: 0 }}>{recipe.description}</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: "16px", alignItems: "center", gap: "0" }}>
          {[
            { l: tr("lbl_prep"), v: recipe.prep_time },
            { l: tr("lbl_cook"), v: recipe.cook_time },
            { l: tr("lbl_total"), v: recipe.total_time },
            { l: tr("lbl_dose"), v: recipe.dose },
          ].filter((s) => s.v).map((s, i, arr) => (
            <div key={i} style={{ flex: "1 1 auto", padding: "10px 16px", borderRight: i < arr.length - 1 ? `1px solid ${t.border}` : `1px solid ${t.border}`, minWidth: "80px" }}>
              <div style={{ fontSize: "14px", color: t.ink, fontFamily: body }}>{s.v}</div>
              <div style={{ fontSize: "10px", color: t.inkFaint, fontFamily: sans, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: "3px" }}>{s.l}</div>
            </div>
          ))}
          {/* Servings with scale control */}
          {recipe.servings && (
            <div style={{ flex: "1 1 auto", padding: "10px 16px", minWidth: "100px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button onClick={() => setServingsCount(c => Math.max(0.5, c - (c <= 1 ? 0.5 : 1)))} style={{ width: "22px", height: "22px", borderRadius: "50%", border: `1px solid ${t.border}`, background: t.surface2, color: t.inkMid, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}>−</button>
                <span style={{ fontSize: "14px", color: scaleFactor !== 1 ? accentColor : t.ink, fontFamily: body, minWidth: "24px", textAlign: "center" }}>{servingsCount}</span>
                <button onClick={() => setServingsCount(c => c + 1)} style={{ width: "22px", height: "22px", borderRadius: "50%", border: `1px solid ${t.border}`, background: t.surface2, color: t.inkMid, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}>+</button>
              </div>
              <div style={{ fontSize: "10px", color: scaleFactor !== 1 ? accentColor : t.inkFaint, fontFamily: sans, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: "3px" }}>
                {tr("lbl_servings")}{scaleFactor !== 1 ? ` · ×${Math.round(scaleFactor * 100) / 100}` : ""}
              </div>
            </div>
          )}
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
            {tr(`tab_${tb}`)}
          </button>
        ))}
      </div>

      <div key={tab} style={{ animation: "fadeSlideIn 0.18s ease" }}>
        {tab === "ingredients" && (
          <IngredientList
            ingredients={scaledIngredients}
            accentColor={accentColor}
            cookMode={cookMode}
            checkedItems={checkedIngredients}
            onToggle={toggleIngredient}
          />
        )}
        {tab === "steps" && (
          <StepList
            steps={recipe.steps}
            accentColor={accentColor}
            cookMode={cookMode}
            checkedSteps={checkedSteps}
            onToggleStep={toggleStep}
          />
        )}
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
