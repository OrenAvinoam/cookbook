import { useState } from "react";
import { t, serif, sans } from "../theme";

const emptyRecipe = {
  title: "", subtitle: "", tag: "", tag_color: "#6A9E82", emoji: "🍽️",
  description: "", servings: "", prep_time: "", cook_time: "", total_time: "", dose: "",
  ingredients: [{ amount: "", name: "" }],
  steps: [{ title: "", time: "", body: "" }],
  notes: [{ title: "", body: "" }],
};

const inputStyle = {
  fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface,
  border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 12px",
  width: "100%", outline: "none", boxSizing: "border-box",
};

const labelStyle = { fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, display: "block", marginBottom: "4px" };

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline }) {
  const style = { ...inputStyle };
  if (multiline) {
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...style, resize: "vertical" }} />;
  }
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />;
}

export default function RecipeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? emptyRecipe);
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const setListItem = (key, i, field, val) =>
    setForm(f => ({ ...f, [key]: f[key].map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const addListItem = (key, empty) =>
    setForm(f => ({ ...f, [key]: [...f[key], empty] }));

  const removeListItem = (key, i) =>
    setForm(f => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.title.trim()) return alert("Title is required");
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const sectionHeader = (label) => (
    <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "24px 0 12px 0", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>{label}</p>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
          ← Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{ background: t.green, border: "none", color: "#fff", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "8px 20px", borderRadius: "20px", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Save recipe"}
        </button>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "32px" }}>
        {sectionHeader("Basic info")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Title"><TextInput value={form.title} onChange={v => set("title", v)} placeholder="Recipe title" /></Field>
          <Field label="Emoji"><TextInput value={form.emoji} onChange={v => set("emoji", v)} placeholder="🍽️" /></Field>
        </div>
        <Field label="Subtitle"><TextInput value={form.subtitle} onChange={v => set("subtitle", v)} placeholder="e.g. Oxtail & Chicken Wings · Ninja Foodi" /></Field>
        <Field label="Description"><TextInput value={form.description} onChange={v => set("description", v)} placeholder="Short description" multiline /></Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="Tag label"><TextInput value={form.tag} onChange={v => set("tag", v)} placeholder="e.g. Daily Morning" /></Field>
          <Field label="Tag color">
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="color" value={form.tag_color} onChange={e => set("tag_color", e.target.value)} style={{ width: "40px", height: "36px", border: `1px solid ${t.border}`, borderRadius: "6px", cursor: "pointer", padding: "2px" }} />
              <TextInput value={form.tag_color} onChange={v => set("tag_color", v)} placeholder="#6A9E82" />
            </div>
          </Field>
        </div>

        {sectionHeader("Timing & servings")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          <Field label="Servings"><TextInput value={form.servings} onChange={v => set("servings", v)} placeholder="8" /></Field>
          <Field label="Prep time"><TextInput value={form.prep_time} onChange={v => set("prep_time", v)} placeholder="45 min" /></Field>
          <Field label="Cook time"><TextInput value={form.cook_time} onChange={v => set("cook_time", v)} placeholder="2h 30min" /></Field>
          <Field label="Total time"><TextInput value={form.total_time} onChange={v => set("total_time", v)} placeholder="~4 hours" /></Field>
        </div>
        <Field label="Daily dose"><TextInput value={form.dose} onChange={v => set("dose", v)} placeholder="300ml daily, warm" /></Field>

        {sectionHeader("Ingredients")}
        {form.ingredients.map((ing, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
            <div style={{ width: "100px", flexShrink: 0 }}>
              <TextInput value={ing.amount} onChange={v => setListItem("ingredients", i, "amount", v)} placeholder="800g" />
            </div>
            <div style={{ flex: 1 }}>
              <TextInput value={ing.name} onChange={v => setListItem("ingredients", i, "name", v)} placeholder="Ingredient name" />
            </div>
            <button onClick={() => removeListItem("ingredients", i)} style={{ flexShrink: 0, background: "none", border: `1px solid ${t.border}`, color: t.inkFaint, borderRadius: "6px", padding: "8px 10px", cursor: "pointer", fontSize: "14px" }}>×</button>
          </div>
        ))}
        <button onClick={() => addListItem("ingredients", { amount: "", name: "" })} style={{ background: "none", border: `1px dashed ${t.border}`, color: t.inkLight, borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontFamily: sans, fontSize: "12px", marginTop: "4px" }}>+ Add ingredient</button>

        {sectionHeader("Steps")}
        {form.steps.map((step, i) => (
          <div key={i} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "14px", marginBottom: "8px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ flex: 1 }}><TextInput value={step.title} onChange={v => setListItem("steps", i, "title", v)} placeholder={`Step ${i + 1} title`} /></div>
              <div style={{ width: "100px", flexShrink: 0 }}><TextInput value={step.time} onChange={v => setListItem("steps", i, "time", v)} placeholder="10 min" /></div>
              <button onClick={() => removeListItem("steps", i)} style={{ flexShrink: 0, background: "none", border: `1px solid ${t.border}`, color: t.inkFaint, borderRadius: "6px", padding: "8px 10px", cursor: "pointer", fontSize: "14px" }}>×</button>
            </div>
            <TextInput value={step.body} onChange={v => setListItem("steps", i, "body", v)} placeholder="Step instructions…" multiline />
          </div>
        ))}
        <button onClick={() => addListItem("steps", { title: "", time: "", body: "" })} style={{ background: "none", border: `1px dashed ${t.border}`, color: t.inkLight, borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontFamily: sans, fontSize: "12px", marginTop: "4px" }}>+ Add step</button>

        {sectionHeader("Notes")}
        {form.notes.map((note, i) => (
          <div key={i} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "14px", marginBottom: "8px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ flex: 1 }}><TextInput value={note.title} onChange={v => setListItem("notes", i, "title", v)} placeholder="Note title" /></div>
              <button onClick={() => removeListItem("notes", i)} style={{ flexShrink: 0, background: "none", border: `1px solid ${t.border}`, color: t.inkFaint, borderRadius: "6px", padding: "8px 10px", cursor: "pointer", fontSize: "14px" }}>×</button>
            </div>
            <TextInput value={note.body} onChange={v => setListItem("notes", i, "body", v)} placeholder="Note content…" multiline />
          </div>
        ))}
        <button onClick={() => addListItem("notes", { title: "", body: "" })} style={{ background: "none", border: `1px dashed ${t.border}`, color: t.inkLight, borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontFamily: sans, fontSize: "12px", marginTop: "4px" }}>+ Add note</button>
      </div>
    </div>
  );
}
