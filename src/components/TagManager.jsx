import { useState } from "react";
import { t, serif, sans } from "../theme";

const inputStyle = {
  fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface,
  border: `1px solid ${t.border}`, borderRadius: "6px", padding: "7px 10px",
  outline: "none", boxSizing: "border-box", width: "100%",
};

export default function TagManager({ tags, onCreate, onUpdate, onDelete, onClose }) {
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,36,24,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: t.surface, borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "400px", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontFamily: serif, fontWeight: 400, fontSize: "20px", color: t.ink }}>Manage Tags</h3>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${t.border}`, color: t.inkLight, borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

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
            <div key={tag.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: sans, fontSize: "13px", color: t.inkMid }}>{tag.name}</span>
              <button onClick={() => { setEditId(tag.id); setEditName(tag.name); setEditColor(tag.color); }} style={{ background: "none", border: "none", color: t.inkFaint, cursor: "pointer", fontFamily: sans, fontSize: "12px", padding: "2px 6px" }}>Edit</button>
              <button onClick={() => handleDelete(tag.id)} style={{ background: "none", border: "none", color: "#C47A5A", cursor: "pointer", fontFamily: sans, fontSize: "12px", padding: "2px 6px" }}>Delete</button>
            </div>
          )
        )}

        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${t.border}` }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 10px 0" }}>New tag</p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: "36px", height: "34px", border: `1px solid ${t.border}`, borderRadius: "6px", cursor: "pointer", padding: "2px", flexShrink: 0 }} />
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder="Tag name" style={{ ...inputStyle }} />
            {pillBtn("Add", handleCreate, t.green, saving || !newName.trim())}
          </div>
        </div>
      </div>
    </div>
  );
}
