import { useState } from "react";
import { t, serif, sans } from "../theme";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const EMOJI_FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

const NUTRITION_FIELDS = [
  { key: "calories",  label: "Calories",  unit: "kcal" },
  { key: "protein",   label: "Protein",   unit: "g"    },
  { key: "totalFat",  label: "Total Fat", unit: "g"    },
  { key: "totalCarb", label: "Carbs",     unit: "g"    },
  { key: "fiber",     label: "Fiber",     unit: "g"    },
  { key: "sodium",    label: "Sodium",    unit: "mg"   },
];

export default function MealPlanDetail({ plan, recipes, onBack, onSave, onDelete }) {
  const normalize = (raw) => Object.fromEntries(DAYS.map(d => [d, (raw || {})[d] || []]));
  const [localDays, setLocalDays] = useState(() => normalize(plan.days));
  const [name, setName] = useState(plan.name);
  const [saving, setSaving] = useState(false);
  const [addingToDay, setAddingToDay] = useState(null);

  const getRecipe = (id) => recipes.find(r => r.id === id);

  const addRecipe = (day, recipeId) => {
    setLocalDays(d => ({ ...d, [day]: [...d[day], recipeId] }));
    setAddingToDay(null);
  };

  const removeRecipe = (day, idx) => {
    setLocalDays(d => ({ ...d, [day]: d[day].filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave({ ...plan, name, days: localDays }); }
    finally { setSaving(false); }
  };

  // Unique recipes across all days, with which days they appear on
  const allIds = Object.values(localDays).flat();
  const uniqueIds = [...new Set(allIds)];
  const assignedRecipes = uniqueIds.map(id => {
    const r = getRecipe(id);
    if (!r) return null;
    const assignedDays = DAYS.filter(d => localDays[d].includes(id));
    return { ...r, assignedDays };
  }).filter(Boolean);

  // Nutrition daily average (sum unique recipes ÷ 7)
  const totals = {};
  assignedRecipes.forEach(r => {
    if (!r.nutrition) return;
    NUTRITION_FIELDS.forEach(({ key }) => {
      const v = r.nutrition[key];
      if (v != null) totals[key] = (totals[key] || 0) + v;
    });
  });
  const dailyAvg = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, +(v / 7).toFixed(1)]));
  const hasNutrition = Object.keys(totals).length > 0;

  const sectionHdr = (label) => (
    <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "32px 0 14px 0", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>{label}</p>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
          ← All plans
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { if (confirm("Delete this plan?")) onDelete(plan.id); }} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
            Delete
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background: t.green, border: "none", color: "#fff", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "8px 20px", borderRadius: "20px", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save plan"}
          </button>
        </div>
      </div>

      {/* Plan name */}
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Plan name"
        style={{ fontFamily: serif, fontSize: "28px", color: t.ink, background: "transparent", border: "none", borderBottom: `2px solid ${t.border}`, outline: "none", width: "100%", padding: "4px 0", marginBottom: "4px", boxSizing: "border-box" }}
      />

      {sectionHdr("Week")}

      {/* Days grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
        {DAYS.map(day => (
          <div key={day} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "12px 14px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 10px 0" }}>{day}</p>
            {localDays[day].map((recipeId, idx) => {
              const r = getRecipe(recipeId);
              if (!r) return null;
              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "5px 8px", background: t.surface2, borderRadius: "6px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "16px", fontFamily: EMOJI_FONT, flexShrink: 0, lineHeight: 1 }}>{r.emoji}</span>
                  <span style={{ fontSize: "13px", fontFamily: serif, color: t.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                  <button onClick={() => removeRecipe(day, idx)} style={{ background: "none", border: "none", color: t.inkFaint, cursor: "pointer", padding: "0 2px", fontSize: "16px", lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              );
            })}
            {addingToDay === day ? (
              <select
                autoFocus
                defaultValue=""
                onChange={e => { if (e.target.value) addRecipe(day, e.target.value); }}
                onBlur={() => setAddingToDay(null)}
                style={{ width: "100%", fontFamily: sans, fontSize: "12px", padding: "6px 8px", border: `1px solid ${t.border}`, borderRadius: "6px", background: t.surface, color: t.ink, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
              >
                <option value="">Add recipe…</option>
                {recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            ) : (
              <button onClick={() => setAddingToDay(day)} style={{ width: "100%", background: "none", border: `1px dashed ${t.border}`, color: t.inkFaint, fontFamily: sans, fontSize: "11px", letterSpacing: "0.08em", padding: "6px", borderRadius: "6px", cursor: "pointer" }}>
                + Add recipe
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Nutrition */}
      {hasNutrition && (
        <>
          {sectionHdr("Nutrition — Daily Average (total ÷ 7)")}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {NUTRITION_FIELDS.filter(f => dailyAvg[f.key] != null).map(f => (
              <div key={f.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "12px 18px", minWidth: "90px" }}>
                <div style={{ fontSize: "18px", fontFamily: serif, color: t.ink }}>
                  {dailyAvg[f.key]}
                  <span style={{ fontSize: "11px", color: t.inkFaint, marginLeft: "3px", fontFamily: sans }}>{f.unit}</span>
                </div>
                <div style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, marginTop: "3px" }}>{f.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Shopping list */}
      {assignedRecipes.length > 0 && (
        <>
          {sectionHdr("Shopping List")}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {assignedRecipes.map(r => (
              <div key={r.id}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "22px", fontFamily: EMOJI_FONT, lineHeight: 1 }}>{r.emoji}</span>
                  <span style={{ fontFamily: serif, fontSize: "16px", color: t.ink }}>{r.title}</span>
                  <span style={{ fontFamily: sans, fontSize: "10px", color: t.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {r.assignedDays.map(d => d.slice(0, 3)).join(" · ")}
                  </span>
                </div>
                <div style={{ paddingLeft: "32px", borderLeft: `2px solid ${t.border}` }}>
                  {(r.ingredients || []).map((ing, i) => (
                    <div key={i} style={{ fontSize: "14px", fontFamily: serif, color: t.inkLight, padding: "4px 0 4px 12px" }}>
                      <span style={{ color: t.green, marginRight: "6px" }}>{ing.amount}</span>
                      {ing.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
