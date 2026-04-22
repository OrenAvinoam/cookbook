import { useState } from "react";
import { t, serif, sans } from "../theme";

const inputStyle = {
  fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface,
  border: `1px solid ${t.border}`, borderRadius: "6px", padding: "7px 10px",
  outline: "none", boxSizing: "border-box", width: "100%",
};

export default function TagManager({ tags, onCreate, onUpdate, onDelete }) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6A9E82");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try { await onCreate(newName.trim(), newColor); setNewName(""); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id) {
    setSaving(true);
    try { await onUpdate(id, { name: editName.trim(), color: editColor }); setEditId(null); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this tag? It will be removed from all recipes.")) return;
    await onDelete(id);
  }

  const pillBtn = (label, onClick, color, disabled) => (
    <button onClick={onClick} disabled={disabled} style={{
      background: color || t.surface2, border: `1px solid ${t.border}`, color: color ? "#fff" : t.inkLight,
      fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", padding: "5px 12px",
      borderRadius: "20px", cursor: disabled ? "wait" : "pointer", opacity: disabled ? 0.6 : 1,
    }}>{label}</button>
  );

  return (
    <div>
      <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 20px 0", paddingBottom: "10px", borderBottom: `1px solid ${t.border}` }}>
        {tags.length} {tags.length === 1 ? "tag" : "tags"}
      </p>

      {tags.length === 0 && (
        <p style={{ fontFamily: sans, fontSize: "13px", color: t.inkFaint, margin: "0 0 16px 0" }}>No tags yet. Create one below.</p>
      )}

      {tags.map((tag) =>
        editId === tag.id ? (
          <div key={tag.id} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
            <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} style={{ width: "36px", height: "34px", border: `1px solid ${t.border}`, borderRadius: "6px", cursor: "pointer", padding: "2px", flexShrink: 0 }} />
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...inputStyle }} />
            {pillBtn("Save", () => handleUpdate(tag.id), t.green, saving)}
            {pillBtn("Cancel", () => setEditId(null), null, false)}
          </div>
        ) : (
          <div key={tag.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0", borderBottom: `1px solid ${t.border}` }}>
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: sans, fontSize: "14px", color: t.inkMid }}>{tag.name}</span>
            <button onClick={() => { setEditId(tag.id); setEditName(tag.name); setEditColor(tag.color); }} style={{ background: "none", border: "none", color: t.inkFaint, cursor: "pointer", fontFamily: sans, fontSize: "12px", padding: "2px 8px" }}>Edit</button>
            <button onClick={() => handleDelete(tag.id)} style={{ background: "none", border: "none", color: t.terra, cursor: "pointer", fontFamily: sans, fontSize: "12px", padding: "2px 8px" }}>Delete</button>
          </div>
        )
      )}

      <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: `1px solid ${t.border}` }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 12px 0" }}>New tag</p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: "36px", height: "34px", border: `1px solid ${t.border}`, borderRadius: "6px", cursor: "pointer", padding: "2px", flexShrink: 0 }} />
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder="Tag name" style={{ ...inputStyle }} />
          {pillBtn("Add", handleCreate, t.green, saving || !newName.trim())}
        </div>
      </div>
    </div>
  );
}
