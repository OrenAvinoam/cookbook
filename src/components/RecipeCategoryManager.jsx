import { useState } from "react";
import { t, sans } from "../theme";
import { useLanguage } from "../i18n";

const inputStyle = {
  fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface,
  border: `1px solid ${t.border}`, borderRadius: "6px", padding: "7px 10px",
  outline: "none", boxSizing: "border-box", width: "100%",
};

export default function RecipeCategoryManager({ categories, onCreate, onUpdate, onDelete }) {
  const { tr } = useLanguage();
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try { await onCreate(newName.trim()); setNewName(""); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return;
    setSaving(true);
    try { await onUpdate(id, editName.trim()); setEditId(null); }
    finally { setSaving(false); }
  }

  async function handleDelete(id, name) {
    if (!confirm(tr("rcat_confirm_del"))) return;
    await onDelete(id, name);
  }

  const pillBtn = (label, onClick, color, disabled) => (
    <button onClick={onClick} disabled={disabled} style={{
      background: color || t.surface2, border: `1px solid ${t.border}`,
      color: color ? "#fff" : t.inkLight,
      fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", padding: "5px 12px",
      borderRadius: "20px", cursor: disabled ? "wait" : "pointer", opacity: disabled ? 0.6 : 1,
    }}>{label}</button>
  );

  return (
    <div>
      <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 20px 0", paddingBottom: "10px", borderBottom: `1px solid ${t.border}` }}>
        {tr("rcat_count", categories.length)}
      </p>

      {categories.length === 0 && (
        <p style={{ fontFamily: sans, fontSize: "13px", color: t.inkFaint, margin: "0 0 16px 0" }}>{tr("rcat_none")}</p>
      )}

      {categories.map(cat =>
        editId === cat.id ? (
          <div key={cat.id} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleUpdate(cat.id)}
              autoFocus
              style={inputStyle}
            />
            {pillBtn(tr("btn_save"), () => handleUpdate(cat.id), t.green, saving)}
            {pillBtn(tr("btn_cancel"), () => setEditId(null), null, false)}
          </div>
        ) : (
          <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0", borderBottom: `1px solid ${t.border}` }}>
            <span style={{ flex: 1, fontFamily: sans, fontSize: "14px", color: t.inkMid, textTransform: "capitalize" }}>{cat.name}</span>
            <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} style={{ background: "none", border: "none", color: t.inkFaint, cursor: "pointer", fontFamily: sans, fontSize: "12px", padding: "2px 8px" }}>{tr("btn_edit")}</button>
            <button onClick={() => handleDelete(cat.id, cat.name)} style={{ background: "none", border: "none", color: t.terra, cursor: "pointer", fontFamily: sans, fontSize: "12px", padding: "2px 8px" }}>{tr("btn_delete")}</button>
          </div>
        )
      )}

      <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: `1px solid ${t.border}` }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: "0 0 12px 0" }}>{tr("rcat_new")}</p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            placeholder={tr("rcat_name_ph")}
            style={inputStyle}
          />
          {pillBtn(tr("btn_add"), handleCreate, t.green, saving || !newName.trim())}
        </div>
      </div>
    </div>
  );
}
