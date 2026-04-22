import { useState } from "react";
import { t, sans, serif } from "../theme";
import USDASearch from "./USDASearch";

const UNITS = ["g", "ml", "pcs", "tbsp", "tsp", "cup", "oz", "lb", "kg", "l"];
const MODES = [
  { value: "tracked", label: "Tracked (USDA)", desc: "Linked to USDA database for auto nutrition" },
  { value: "ignored", label: "Ignored", desc: "Skip nutrition tracking for this ingredient" },
  { value: "custom",  label: "Custom", desc: "Manually entered nutrition values" },
];

const inputStyle = (extraStyle = {}) => ({
  fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface,
  border: `1px solid ${t.border}`, borderRadius: "8px", padding: "8px 12px",
  outline: "none", boxSizing: "border-box", width: "100%", ...extraStyle,
});

const label = (text) => (
  <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, marginBottom: "5px" }}>{text}</div>
);

export default function IngredientForm({ initial, categories, existingMapping, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    aliases: (initial?.aliases || []).join(", "),
    category_id: initial?.category_id || "",
    default_unit: initial?.default_unit || "g",
    nutrition_mode: initial?.nutrition_mode || "tracked",
    notes: initial?.notes || "",
  });
  const [mapping, setMapping] = useState(existingMapping || null);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        aliases: form.aliases.split(",").map(s => s.trim()).filter(Boolean),
        category_id: form.category_id || null,
        default_unit: form.default_unit,
        nutrition_mode: form.nutrition_mode,
        notes: form.notes.trim() || null,
      };
      await onSave(payload, mapping);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "24px" }}>
      <h3 style={{ fontFamily: serif, fontSize: "20px", fontWeight: "400", color: t.ink, margin: "0 0 20px 0" }}>
        {initial ? "Edit Ingredient" : "New Ingredient"}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          {label("Name *")}
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Chicken breast" style={inputStyle()} />
        </div>
        <div>
          {label("Default unit")}
          <select value={form.default_unit} onChange={e => set("default_unit", e.target.value)} style={inputStyle({ cursor: "pointer" })}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        {label("Aliases (comma-separated)")}
        <input value={form.aliases} onChange={e => set("aliases", e.target.value)} placeholder="e.g. chicken, poultry breast" style={inputStyle()} />
      </div>

      <div style={{ marginBottom: "16px" }}>
        {label("Category")}
        <select value={form.category_id} onChange={e => set("category_id", e.target.value)} style={inputStyle({ cursor: "pointer" })}>
          <option value="">— No category —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: "20px" }}>
        {label("Nutrition mode")}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {MODES.map(mode => (
            <label key={mode.value} style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", padding: "10px 12px", background: form.nutrition_mode === mode.value ? t.greenFaint : t.surface2, border: `1px solid ${form.nutrition_mode === mode.value ? t.green : t.border}`, borderRadius: "8px", transition: "all 0.15s" }}>
              <input type="radio" name="nutrition_mode" value={mode.value} checked={form.nutrition_mode === mode.value} onChange={() => set("nutrition_mode", mode.value)} style={{ marginTop: "2px", accentColor: t.green }} />
              <div>
                <div style={{ fontSize: "13px", fontFamily: sans, color: t.ink, fontWeight: "500" }}>{mode.label}</div>
                <div style={{ fontSize: "11px", fontFamily: sans, color: t.inkLight, marginTop: "2px" }}>{mode.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {form.nutrition_mode === "tracked" && (
        <div style={{ marginBottom: "20px", padding: "14px", background: t.surface2, borderRadius: "8px", border: `1px solid ${t.border}` }}>
          {label("USDA Food link")}
          {mapping ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontFamily: sans, color: t.ink }}>{mapping.description}</div>
                <div style={{ fontSize: "11px", fontFamily: sans, color: t.inkFaint, marginTop: "2px" }}>
                  FDC #{mapping.fdc_id}
                  {mapping.nutrients?.calories != null && <span style={{ color: t.terra, marginLeft: "8px" }}>{mapping.nutrients.calories} kcal / 100g</span>}
                </div>
              </div>
              <button onClick={() => setMapping(null)} style={{ background: "none", border: "none", color: t.terra, cursor: "pointer", fontFamily: sans, fontSize: "11px" }}>Remove</button>
            </div>
          ) : (
            <USDASearch
              onSelect={result => setMapping({ fdc_id: result.fdcId, description: result.description, nutrients: result.nutrients })}
              placeholder={`Search USDA for "${form.name || "ingredient"}"…`}
            />
          )}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        {label("Notes")}
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional notes…" rows={2} style={{ ...inputStyle(), resize: "vertical", fontFamily: sans }} />
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 18px", borderRadius: "20px", cursor: "pointer" }}>Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ background: t.green, border: "none", color: "#fff", fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 20px", borderRadius: "20px", cursor: saving ? "wait" : "pointer", opacity: saving || !form.name.trim() ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
