import { useState } from "react";
import { t, serif, sans } from "../theme";
import { titleCase, sentenceCase } from "../lib/capitalize";

const CATEGORIES = ["breakfast", "lunch", "dinner", "snack", "dessert"];
const PRESET_UNITS = ["g", "kg", "ml", "L", "tbsp", "tsp", "cup", "oz", "lb", "pcs", "pinch", "sprig", "clove", "slice", "bunch"];
const UNIT_ALIASES = { litres: "L", litre: "L", liter: "L", liters: "L", grams: "g", gram: "g", sprigs: "sprig", cloves: "clove" };

function parseAmount(str) {
  if (!str) return { quantity: "", unit: "", customUnit: "" };
  str = str.trim();
  const allUnits = [...PRESET_UNITS, ...Object.keys(UNIT_ALIASES)];
  for (const u of allUnits) {
    const m = str.match(new RegExp(`^([\\d½¼¾⅓⅔.,/\\s]+)\\s*${u}s?\\b`, "i"));
    if (m) {
      const canonical = UNIT_ALIASES[u.toLowerCase()] || u;
      const isPreset = PRESET_UNITS.includes(canonical);
      return { quantity: m[1].trim(), unit: isPreset ? canonical : "", customUnit: isPreset ? "" : canonical };
    }
  }
  const numMatch = str.match(/^([\d½¼¾⅓⅔.,/\s]+)\s*(.*)$/);
  if (numMatch) return { quantity: numMatch[1].trim(), unit: "", customUnit: numMatch[2].trim() };
  return { quantity: str, unit: "", customUnit: "" };
}

function formatAmount(ing) {
  const unit = ing.unit || ing.customUnit || "";
  return `${ing.quantity}${unit ? " " + unit : ""}`.trim();
}

const emptyRecipe = {
  title: "", emoji: "🍽️", description: "", category: "breakfast",
  servings: "", prep_time: "", cook_time: "", total_time: "", dose: "",
  tag_ids: [],
  ingredients: [{ quantity: "", unit: "g", customUnit: "", name: "" }],
  steps: [{ title: "", time: "", body: "" }],
  notes: [{ title: "", body: "" }],
};

const inputStyle = {
  fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface,
  border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 12px",
  width: "100%", outline: "none", boxSizing: "border-box",
};
const labelStyle = { fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, display: "block", marginBottom: "4px" };

function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: "12px", ...style }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, onBlur, placeholder, multiline, style: extraStyle }) {
  const s = { ...inputStyle, ...extraStyle };
  if (multiline) return <textarea value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} rows={3} style={{ ...s, resize: "vertical" }} />;
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} style={s} />;
}

export default function RecipeForm({ initial, tags, onSave, onCancel }) {
  const initForm = initial
    ? {
        ...initial,
        tag_ids: initial.tag_ids || [],
        ingredients: (initial.ingredients || []).map((ing) => ({ ...parseAmount(ing.amount), name: ing.name })),
        steps: initial.steps || [],
        notes: initial.notes || [],
      }
    : emptyRecipe;

  const [form, setForm] = useState(initForm);
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setListItem = (key, i, field, val) =>
    setForm((f) => ({ ...f, [key]: f[key].map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const addListItem = (key, empty) => setForm((f) => ({ ...f, [key]: [...f[key], empty] }));
  const removeListItem = (key, i) => setForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));

  const toggleTag = (id) => {
    const ids = form.tag_ids || [];
    set("tag_ids", ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return alert("Title is required");
    setSaving(true);
    try {
      const payload = {
        ...form,
        ingredients: form.ingredients.map((ing) => ({ amount: formatAmount(ing), name: ing.name })),
        nutrition: initial?.nutrition || null,
      };
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  const sectionHeader = (label) => (
    <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "24px 0 12px 0", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>{label}</p>
  );

  const addBtn = (label, onClick) => (
    <button type="button" onClick={onClick} style={{ background: "none", border: `1px dashed ${t.border}`, color: t.inkLight, borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontFamily: sans, fontSize: "12px", marginTop: "4px" }}>{label}</button>
  );

  const removeBtn = (onClick) => (
    <button type="button" onClick={onClick} style={{ flexShrink: 0, background: "none", border: `1px solid ${t.border}`, color: t.inkFaint, borderRadius: "6px", padding: "7px 10px", cursor: "pointer", fontSize: "14px" }}>×</button>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "8px" }}>
        <button type="button" onClick={onCancel} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
          ← Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving} style={{ background: t.green, border: "none", color: "#fff", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "8px 20px", borderRadius: "20px", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Save recipe"}
        </button>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "32px" }}>
        {sectionHeader("Basic info")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "start" }}>
          <Field label="Title">
            <TextInput
              value={form.title}
              onChange={(v) => set("title", v)}
              onBlur={() => set("title", titleCase(form.title))}
              placeholder="Recipe title"
            />
          </Field>
          <Field label="Emoji">
            <TextInput value={form.emoji} onChange={(v) => set("emoji", v)} placeholder="🍽️" style={{ width: "64px" }} />
          </Field>
        </div>

        <Field label="Description">
          <TextInput
            value={form.description}
            onChange={(v) => set("description", v)}
            onBlur={() => set("description", sentenceCase(form.description))}
            placeholder="Short description of the recipe"
            multiline
          />
        </Field>

        {sectionHeader("Category")}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {CATEGORIES.map((cat) => (
            <button key={cat} type="button" onClick={() => set("category", cat)} style={{
              padding: "6px 16px", borderRadius: "20px", border: `1px solid ${form.category === cat ? t.ink : t.border}`,
              background: form.category === cat ? t.ink : "transparent",
              color: form.category === cat ? "#fff" : t.inkLight,
              fontFamily: sans, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
            }}>{cat}</button>
          ))}
        </div>

        {tags.length > 0 && (
          <>
            {sectionHeader("Tags")}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
              {tags.map((tag) => {
                const sel = (form.tag_ids || []).includes(tag.id);
                return (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} style={{
                    padding: "4px 12px", borderRadius: "20px", border: `1px solid ${tag.color}`,
                    background: sel ? tag.color : "transparent",
                    color: sel ? "#fff" : tag.color,
                    fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer",
                  }}>{tag.name}</button>
                );
              })}
            </div>
          </>
        )}

        {sectionHeader("Timing & servings")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
          <Field label="Servings"><TextInput value={form.servings} onChange={(v) => set("servings", v)} placeholder="8" /></Field>
          <Field label="Prep time"><TextInput value={form.prep_time} onChange={(v) => set("prep_time", v)} placeholder="45 min" /></Field>
          <Field label="Cook time"><TextInput value={form.cook_time} onChange={(v) => set("cook_time", v)} placeholder="2h 30min" /></Field>
          <Field label="Total time"><TextInput value={form.total_time} onChange={(v) => set("total_time", v)} placeholder="~4 hours" /></Field>
        </div>
        <Field label="Daily dose / serving suggestion">
          <TextInput value={form.dose} onChange={(v) => set("dose", v)} placeholder="e.g. 300ml daily, warm" />
        </Field>

        {sectionHeader("Ingredients")}
        {form.ingredients.map((ing, i) => (
          <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "8px", alignItems: "center" }}>
            <input
              type="text"
              value={ing.quantity}
              onChange={(e) => setListItem("ingredients", i, "quantity", e.target.value)}
              placeholder="qty"
              style={{ ...inputStyle, width: "56px", padding: "8px 8px" }}
            />
            <select
              value={ing.unit}
              onChange={(e) => setListItem("ingredients", i, "unit", e.target.value)}
              style={{ ...inputStyle, width: "80px", padding: "8px 4px", cursor: "pointer" }}
            >
              <option value="">custom</option>
              {PRESET_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            {!ing.unit && (
              <input
                type="text"
                value={ing.customUnit}
                onChange={(e) => setListItem("ingredients", i, "customUnit", e.target.value)}
                placeholder="unit"
                style={{ ...inputStyle, width: "70px", padding: "8px 8px" }}
              />
            )}
            <div style={{ flex: 1 }}>
              <TextInput
                value={ing.name}
                onChange={(v) => setListItem("ingredients", i, "name", v)}
                onBlur={() => setListItem("ingredients", i, "name", sentenceCase(ing.name))}
                placeholder="Ingredient name"
              />
            </div>
            {removeBtn(() => removeListItem("ingredients", i))}
          </div>
        ))}
        {addBtn("+ Add ingredient", () => addListItem("ingredients", { quantity: "", unit: "g", customUnit: "", name: "" }))}

        {sectionHeader("Steps")}
        {form.steps.map((step, i) => (
          <div key={i} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "14px", marginBottom: "8px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ flex: 1 }}>
                <TextInput
                  value={step.title}
                  onChange={(v) => setListItem("steps", i, "title", v)}
                  onBlur={() => setListItem("steps", i, "title", sentenceCase(step.title))}
                  placeholder={`Step ${i + 1} title`}
                />
              </div>
              <div style={{ width: "90px", flexShrink: 0 }}>
                <TextInput value={step.time} onChange={(v) => setListItem("steps", i, "time", v)} placeholder="10 min" />
              </div>
              {removeBtn(() => removeListItem("steps", i))}
            </div>
            <TextInput
              value={step.body}
              onChange={(v) => setListItem("steps", i, "body", v)}
              onBlur={() => setListItem("steps", i, "body", sentenceCase(step.body))}
              placeholder="Step instructions…"
              multiline
            />
          </div>
        ))}
        {addBtn("+ Add step", () => addListItem("steps", { title: "", time: "", body: "" }))}

        {sectionHeader("Notes")}
        {form.notes.map((note, i) => (
          <div key={i} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "14px", marginBottom: "8px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ flex: 1 }}>
                <TextInput
                  value={note.title}
                  onChange={(v) => setListItem("notes", i, "title", v)}
                  onBlur={() => setListItem("notes", i, "title", sentenceCase(note.title))}
                  placeholder="Note title"
                />
              </div>
              {removeBtn(() => removeListItem("notes", i))}
            </div>
            <TextInput
              value={note.body}
              onChange={(v) => setListItem("notes", i, "body", v)}
              onBlur={() => setListItem("notes", i, "body", sentenceCase(note.body))}
              placeholder="Note content…"
              multiline
            />
          </div>
        ))}
        {addBtn("+ Add note", () => addListItem("notes", { title: "", body: "" }))}
      </div>
    </div>
  );
}
