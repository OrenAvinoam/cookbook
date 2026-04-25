import { useState } from "react";
import { t, serif, sans } from "../theme";
import { useLanguage } from "../i18n";

const inputStyle = {
  fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface,
  border: `1px solid ${t.border}`, borderRadius: "6px", padding: "7px 10px",
  outline: "none", boxSizing: "border-box", width: "100%",
};

export default function TagManager({ tags, onCreate, onUpdate, onDelete }) {
  const { tr, lang } = useLanguage();
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
    if (!confirm(tr("tag_confirm_del"))) return;
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
        {tr("tag_count", tags.length)}
      </p>

      {tags.length === 0 && (
        <p style={{ fontFamily: sans, fontSize: "13px", color: t.inkFaint, margin: "0 0 16px 0" }}>{tr("tag_none")}</p>
      )}

      {tags.map((tag) =>
        editId === tag.id ? (
          <div key={tag.id} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
            <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} style={{ width: "36px", height: "34px", border: `1px solid ${t.border}`, borderRadius: "6px", cursor: "pointer", padding: "2px", flexShrink: 0 }} />
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...inputStyle }} />
            {pillBtn(tr("btn_save"), () => handleUpdate(tag.id), t.green, saving)}
            {pillBtn(tr("btn_cancel"), () => setEditId(null), null, false)}
          </div>
        ) : (
          <div key={tag.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0", borderBottom: `1px solid ${t.border}` }}>
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: sans, fontSize: "14px", color: t.inkMid }}>{lang === "he" ? (tag.name_he || tag.name) : tag.name}</span>
            <button onClick={() => { setEditId(tag.id); setEditName(lang === "he" ? (tag.name_he || tag.name) : tag.name); setEditColor(tag.color); }} style={{ background: "none", border: "none", color: t.inkFaint, cursor: "pointer", fontFamily: sans, fontSize: "12px", padding: "2px 8px" }}>{tr("btn_edit")}</button>
            <button onClick={() => handleDelete(tag.id)} style={{ background: "none", border: "none", color: t.terra, cursor: "pointer", fontFamily: sans, fontSize: "12px", padding: "2px 8px" }}>{tr("btn_delete")}</button>
          </div>
        )
      )}

      <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: `1px solid ${t.border}` }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 12px 0" }}>{tr("tag_new")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
          {["#6A9E82","#C47A5A","#8A7A68","#5C7A6A","#B8936A","#7A5A48","#9A8A70","#4A7A70","#C4A070","#6A5848","#8A9A7A","#A87060","#6A7A80","#9A7060","#5A6A58"].map(c => (
            <button key={c} onClick={() => setNewColor(c)} style={{
              width: "22px", height: "22px", borderRadius: "50%", background: c, border: `2px solid ${newColor === c ? t.ink : "transparent"}`,
              cursor: "pointer", padding: 0, flexShrink: 0, transition: "border-color 0.15s",
            }} title={c} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: "36px", height: "34px", border: `1px solid ${t.border}`, borderRadius: "6px", cursor: "pointer", padding: "2px", flexShrink: 0 }} />
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder={tr("tag_name_ph")} style={{ ...inputStyle }} />
          {pillBtn(tr("btn_add"), handleCreate, t.green, saving || !newName.trim())}
        </div>
      </div>
    </div>
  );
}
