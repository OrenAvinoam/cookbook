import { useState } from "react";
import { t, serif, sans } from "../theme";

export default function MealPlanList({ plans, onCreate, onOpen, onDelete, onRename }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const startRename = (e, plan) => {
    e.stopPropagation();
    setEditingId(plan.id);
    setEditName(plan.name);
  };

  const saveRename = (id) => {
    if (editName.trim() && onRename) onRename(id, editName.trim());
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm("Delete this meal plan?")) onDelete(id);
  };

  if (plans.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p style={{ fontFamily: serif, fontSize: "18px", color: t.inkLight, margin: "0 0 8px 0" }}>No meal plans yet</p>
        <p style={{ fontFamily: sans, fontSize: "12px", color: t.inkFaint, margin: "0 0 24px 0" }}>Plan your week and generate a shopping list</p>
        <button onClick={onCreate} style={{ background: t.green, border: "none", color: "#fff", fontFamily: sans, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "10px 24px", borderRadius: "20px", cursor: "pointer" }}>
          Create your first plan
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {plans.map(plan => {
        const totalSlots = Object.values(plan.days || {}).flat().length;
        const uniqueCount = new Set(Object.values(plan.days || {}).flat()).size;
        const isEditing = editingId === plan.id;

        return (
          <div
            key={plan.id}
            onClick={() => !isEditing && onOpen(plan.id)}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "16px 20px", cursor: isEditing ? "default" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", transition: "border-color 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { if (!isEditing) { e.currentTarget.style.borderColor = t.green + "60"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(106,158,130,0.1)"; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => saveRename(plan.id)}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") saveRename(plan.id); if (e.key === "Escape") setEditingId(null); }}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                  style={{ fontFamily: serif, fontSize: "18px", color: t.ink, background: "transparent", border: "none", borderBottom: `1px solid ${t.border}`, outline: "none", width: "100%", padding: "2px 0" }}
                />
              ) : (
                <p style={{ fontFamily: serif, fontSize: "18px", color: t.ink, margin: "0 0 4px 0" }}>{plan.name}</p>
              )}
              <p style={{ fontFamily: sans, fontSize: "11px", color: t.inkFaint, margin: 0, letterSpacing: "0.08em" }}>
                {uniqueCount} {uniqueCount === 1 ? "recipe" : "recipes"} · {totalSlots} {totalSlots === 1 ? "serving" : "servings"} planned
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {!isEditing && <span style={{ color: t.green, fontFamily: sans, fontSize: "12px" }}>Open →</span>}
              {!isEditing && (
                <button
                  onClick={e => startRename(e, plan)}
                  style={{ background: "none", border: `1px solid ${t.border}`, color: t.inkFaint, fontFamily: sans, fontSize: "11px", letterSpacing: "0.08em", padding: "5px 11px", borderRadius: "20px", cursor: "pointer" }}
                  title="Rename plan"
                >✎ Edit</button>
              )}
              <button
                onClick={e => handleDelete(e, plan.id)}
                style={{ background: "none", border: `1px solid ${t.border}`, color: t.inkFaint, borderRadius: "6px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", flexShrink: 0 }}
                title="Delete plan"
              >×</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
