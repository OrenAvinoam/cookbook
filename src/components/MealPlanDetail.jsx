import { useState } from "react";
import { t, serif, sans, body } from "../theme";
import AddItemModal from "./AddItemModal";

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

const UNIT_MAP = {
  g: { fam: "w", f: 1 }, gram: { fam: "w", f: 1 }, grams: { fam: "w", f: 1 },
  kg: { fam: "w", f: 1000 },
  oz: { fam: "w", f: 28.35 }, lb: { fam: "w", f: 453.59 }, lbs: { fam: "w", f: 453.59 },
  ml: { fam: "v", f: 1 }, l: { fam: "v", f: 1000 }, liter: { fam: "v", f: 1000 },
  tbsp: { fam: "v", f: 14.79 }, tsp: { fam: "v", f: 4.93 },
  cup: { fam: "v", f: 236.59 }, cups: { fam: "v", f: 236.59 },
  pcs: { fam: "pcs", f: 1 }, piece: { fam: "pcs", f: 1 }, pieces: { fam: "pcs", f: 1 },
};

const UNICODE_FRACS = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1/3, "⅔": 2/3, "⅛": 0.125 };

function parseQty(s) {
  let str = s.trim();
  for (const [sym, val] of Object.entries(UNICODE_FRACS)) str = str.replace(sym, String(val));
  str = str.replace(/(\d+)\s+(\d+)\/(\d+)/, (_, w, n, d) => parseFloat(w) + parseFloat(n) / parseFloat(d));
  str = str.replace(/(\d+)\/(\d+)/, (_, n, d) => parseFloat(n) / parseFloat(d));
  return parseFloat(str.replace(",", "."));
}

function parseIngAmt(amtStr) {
  if (!amtStr?.trim()) return { qty: null, unit: "", fam: "other", f: null, raw: amtStr || "" };
  const m = amtStr.trim().match(/^([½¼¾⅓⅔⅛\d.,/\s]+?)\s*([a-zA-Z][\w]*)?\s*$/);
  if (!m) return { qty: null, unit: "", fam: "other", f: null, raw: amtStr };
  const qty = parseQty(m[1]);
  const unit = (m[2] || "").trim().toLowerCase();
  const info = UNIT_MAP[unit];
  return { qty: isNaN(qty) ? null : qty, unit, fam: info?.fam || "other", f: info?.f ?? null, raw: amtStr };
}

function formatTotal(base, fam) {
  if (fam === "w") return base >= 1000 ? `${+(base/1000).toFixed(3).replace(/\.?0+$/,"")} kg` : `${+base.toFixed(1).replace(/\.?0+$/,"")} g`;
  if (fam === "v") return base >= 1000 ? `${+(base/1000).toFixed(3).replace(/\.?0+$/,"")} L` : `${+base.toFixed(1).replace(/\.?0+$/,"")} ml`;
  return null;
}

function aggregateIngredients(ings) {
  const groups = {};
  for (const ing of ings) {
    if (!ing?.name) continue;
    const p = parseIngAmt(ing.amount);
    const key = `${ing.name.trim().toLowerCase()}::${p.fam !== "other" ? p.fam : p.unit}`;
    if (!groups[key]) groups[key] = { displayName: ing.name.trim(), entries: [] };
    groups[key].entries.push(p);
  }
  return Object.values(groups).map(({ displayName, entries }) => {
    if (entries.length === 1) return { name: displayName, amount: entries[0].raw };
    const { fam } = entries[0];
    if (fam !== "other" && entries.every(e => e.qty != null && e.f != null)) {
      const total = entries.reduce((s, e) => s + e.qty * e.f, 0);
      if (fam === "pcs") return { name: displayName, amount: `${+total.toFixed(2).replace(/\.?0+$/,"")} pcs` };
      const fmt = formatTotal(total, fam);
      if (fmt) return { name: displayName, amount: fmt };
    }
    if (entries.every(e => e.unit === entries[0].unit && e.qty != null)) {
      const total = entries.reduce((s, e) => s + e.qty, 0);
      return { name: displayName, amount: `${+total.toFixed(2).replace(/\.?0+$/,"")}${entries[0].unit ? " "+entries[0].unit : ""}` };
    }
    return { name: displayName, amount: entries.map(e => e.raw).join(" + ") };
  });
}

function normalizeDayItems(arr) {
  return (arr || []).map(item =>
    typeof item === "string" ? { type: "recipe", id: item, note: "" } : item
  );
}

export default function MealPlanDetail({
  plan, recipes, ingredients = [], ingredientCategories = [], ingredientMappings = [],
  tags = [], onBack, onSave, onDelete,
}) {
  const normalize = (raw) => Object.fromEntries(DAYS.map(d => [d, normalizeDayItems((raw || {})[d])]));

  const [localDays, setLocalDays] = useState(() => normalize(plan.days));
  const [name, setName] = useState(plan.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingToDay, setAddingToDay] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});

  const getRecipe = (id) => recipes.find(r => r.id === id);
  const getIngredient = (id) => ingredients.find(i => i.id === id);
  const getMapping = (id) => ingredientMappings.find(m => m.ingredient_id === id);

  const addItem = (day, type, id) => {
    setLocalDays(d => ({ ...d, [day]: [...d[day], { type, id, note: "" }] }));
  };

  const removeItem = (day, idx) =>
    setLocalDays(d => ({ ...d, [day]: d[day].filter((_, i) => i !== idx) }));

  const updateItemNote = (day, idx, note) =>
    setLocalDays(d => ({ ...d, [day]: d[day].map((item, i) => i === idx ? { ...item, note } : item) }));

  const toggleNote = (day, idx) => {
    const key = `${day}-${idx}`;
    setExpandedNotes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave({ ...plan, name, days: localDays }); }
    finally { setSaving(false); }
  };

  // Shopping list: recipe ingredients + ingredient items with amount
  const allRecipeIngs = Object.values(localDays).flat()
    .filter(item => item.type === "recipe")
    .flatMap(item => getRecipe(item.id)?.ingredients || []);

  const standaloneIngs = Object.values(localDays).flat()
    .filter(item => item.type === "ingredient" && item.amount)
    .map(item => {
      const ing = getIngredient(item.id);
      return ing ? { name: ing.name, amount: `${item.amount}${item.unit ? " " + item.unit : ""}` } : null;
    }).filter(Boolean);

  const shoppingList = aggregateIngredients([...allRecipeIngs, ...standaloneIngs]);

  const copyShoppingList = () => {
    const text = shoppingList.map(item => `• ${item.amount}  ${item.name}`).join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };

  const uniqueRecipeIds = [...new Set(Object.values(localDays).flat().filter(i => i.type === "recipe").map(i => i.id))];
  const totals = {};
  uniqueRecipeIds.forEach(id => {
    const r = getRecipe(id);
    if (!r?.nutrition) return;
    NUTRITION_FIELDS.forEach(({ key }) => { const v = r.nutrition[key]; if (v != null) totals[key] = (totals[key] || 0) + v; });
  });
  const dailyAvg = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, +(v / 7).toFixed(1)]));
  const hasNutrition = Object.keys(totals).length > 0;

  const sectionHdr = (label, extra) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "32px 0 14px 0", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: 0 }}>{label}</p>
      {extra}
    </div>
  );

  return (
    <div>
      {addingToDay && (
        <AddItemModal
          recipes={recipes}
          ingredients={ingredients}
          categories={ingredientCategories}
          mappings={ingredientMappings}
          tags={tags}
          onAdd={(type, id) => addItem(addingToDay, type, id)}
          onClose={() => setAddingToDay(null)}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>← All plans</button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { if (confirm("Delete this plan?")) onDelete(plan.id); }} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>Delete</button>
          <button onClick={handleSave} disabled={saving} style={{ background: t.green, border: "none", color: "#fff", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "8px 20px", borderRadius: "20px", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save plan"}
          </button>
        </div>
      </div>

      {/* Plan name */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        {isEditingName ? (
          <input value={name} onChange={e => setName(e.target.value)}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setIsEditingName(false); }}
            autoFocus
            style={{ fontFamily: serif, fontSize: "28px", color: t.ink, background: "transparent", border: "none", borderBottom: `2px solid ${t.green}`, outline: "none", flex: 1, padding: "4px 0", boxSizing: "border-box" }}
          />
        ) : (
          <h2 style={{ fontFamily: serif, fontSize: "28px", fontWeight: "400", color: t.ink, margin: 0, flex: 1 }}>{name}</h2>
        )}
        {!isEditingName && (
          <button onClick={() => setIsEditingName(true)} style={{ background: "none", border: `1px solid ${t.border}`, color: t.inkFaint, cursor: "pointer", padding: "4px 10px", borderRadius: "6px", fontFamily: sans, fontSize: "11px", letterSpacing: "0.08em", flexShrink: 0 }}>✎ Edit</button>
        )}
      </div>

      {sectionHdr("Week")}

      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", minWidth: "840px" }}>
          {DAYS.map(day => (
            <div key={day} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "10px 8px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 6px 0", paddingBottom: "6px", borderBottom: `1px solid ${t.surface2}`, textAlign: "center" }}>{day.slice(0, 3)}</p>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                {localDays[day].map((item, idx) => {
                  const noteKey = `${day}-${idx}`;
                  const noteOpen = expandedNotes[noteKey];

                  if (item.type === "ingredient") {
                    const ing = getIngredient(item.id);
                    if (!ing) return null;
                    return (
                      <div key={idx} style={{ background: t.greenFaint, borderRadius: "5px", border: `1px solid ${t.green}30`, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 5px" }}>
                          <span style={{ fontSize: "10px", color: t.green }}>🌿</span>
                          <span style={{ fontSize: "11px", fontFamily: serif, color: t.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ing.name}</span>
                          <button onClick={() => toggleNote(day, idx)} style={{ background: "none", border: "none", color: item.note ? t.green : t.inkFaint, cursor: "pointer", padding: "0 2px", fontSize: "10px", lineHeight: 1, flexShrink: 0 }} title="Note">✎</button>
                          <button onClick={() => removeItem(day, idx)} style={{ background: "none", border: "none", color: t.inkFaint, cursor: "pointer", padding: 0, fontSize: "14px", lineHeight: 1, flexShrink: 0 }}>×</button>
                        </div>
                        {noteOpen && (
                          <textarea value={item.note || ""} onChange={e => updateItemNote(day, idx, e.target.value)}
                            placeholder="Note…" rows={2} autoFocus
                            style={{ width: "100%", fontFamily: sans, fontSize: "10px", color: t.inkLight, background: "transparent", border: "none", borderTop: `1px solid ${t.border}`, padding: "4px 6px", outline: "none", resize: "none", boxSizing: "border-box" }} />
                        )}
                      </div>
                    );
                  }

                  // Recipe item
                  const r = getRecipe(item.id);
                  if (!r) return null;
                  return (
                    <div key={idx} style={{ background: t.surface2, borderRadius: "5px", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 5px" }}>
                        <span style={{ fontSize: "13px", fontFamily: EMOJI_FONT, flexShrink: 0, lineHeight: 1 }}>{r.emoji}</span>
                        <span style={{ fontSize: "11px", fontFamily: serif, color: t.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                        <button onClick={() => toggleNote(day, idx)} style={{ background: "none", border: "none", color: item.note ? t.green : t.inkFaint, cursor: "pointer", padding: "0 2px", fontSize: "10px", lineHeight: 1, flexShrink: 0 }} title="Note">✎</button>
                        <button onClick={() => removeItem(day, idx)} style={{ background: "none", border: "none", color: t.inkFaint, cursor: "pointer", padding: 0, fontSize: "14px", lineHeight: 1, flexShrink: 0 }}>×</button>
                      </div>
                      {noteOpen && (
                        <textarea value={item.note || ""} onChange={e => updateItemNote(day, idx, e.target.value)}
                          placeholder="Note for this item…" rows={2} autoFocus
                          style={{ width: "100%", fontFamily: sans, fontSize: "10px", color: t.inkLight, background: "transparent", border: "none", borderTop: `1px solid ${t.border}`, padding: "4px 6px", outline: "none", resize: "none", boxSizing: "border-box" }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setAddingToDay(day)} style={{ width: "100%", background: "none", border: `1px dashed ${t.border}`, color: t.inkFaint, fontFamily: sans, fontSize: "10px", letterSpacing: "0.06em", padding: "5px 4px", borderRadius: "5px", cursor: "pointer" }}>+ Add</button>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition */}
      {hasNutrition && (
        <>
          {sectionHdr("Nutrition — Daily Average (total ÷ 7)")}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {NUTRITION_FIELDS.filter(f => dailyAvg[f.key] != null).map(f => (
              <div key={f.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "12px 18px", minWidth: "90px" }}>
                <div style={{ fontSize: "18px", fontFamily: serif, color: t.ink }}>{dailyAvg[f.key]}<span style={{ fontSize: "11px", color: t.inkFaint, marginLeft: "3px", fontFamily: sans }}>{f.unit}</span></div>
                <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, marginTop: "3px" }}>{f.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Shopping list */}
      {shoppingList.length > 0 && (
        <>
          {sectionHdr(`Shopping List (${shoppingList.length} items)`,
            <button onClick={copyShoppingList} style={{ background: copied ? t.green : "transparent", border: `1px solid ${copied ? t.green : t.border}`, color: copied ? "#fff" : t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "20px", cursor: "pointer", transition: "all 0.2s" }}>
              {copied ? "Copied!" : "Copy list"}
            </button>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "6px" }}>
            {shoppingList.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "8px 12px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "7px" }}>
                <span style={{ fontSize: "16px", color: t.green, fontFamily: body, fontWeight: "500", flexShrink: 0, minWidth: "60px" }}>{item.amount}</span>
                <span style={{ fontSize: "16px", color: t.inkMid, fontFamily: body }}>{item.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
