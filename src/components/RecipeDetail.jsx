import { useState } from "react";
import { t, serif, sans } from "../theme";
import Tag from "./Tag";
import IngredientList from "./IngredientList";
import StepList from "./StepList";
import NoteList from "./NoteList";
import RecipeForm from "./RecipeForm";

export default function RecipeDetail({ recipe, onBack, onSave, onDelete }) {
  const [tab, setTab] = useState("ingredients");
  const [editing, setEditing] = useState(false);
  const tabs = ["ingredients", "steps", "notes"];
  const tagBg = recipe.tag_color === "#6A9E82" ? "#E8F0EB" : "#F5EAE4";

  if (editing) {
    return (
      <RecipeForm
        initial={recipe}
        onCancel={() => setEditing(false)}
        onSave={async (data) => { await onSave(data); setEditing(false); }}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "8px" }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
          ← All recipes
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setEditing(true)} style={{ background: "transparent", border: `1px solid ${recipe.tag_color}`, color: recipe.tag_color, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
            Edit recipe
          </button>
          <button onClick={() => { if (confirm("Delete this recipe?")) onDelete(recipe.id); }} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: sans, padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>
            Delete
          </button>
        </div>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "32px", marginBottom: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "56px", lineHeight: 1 }}>{recipe.emoji}</span>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <Tag color={recipe.tag_color} bg={tagBg}>{recipe.tag}</Tag>
            <h1 style={{ fontSize: "clamp(22px, 5vw, 34px)", fontWeight: "400", color: t.ink, margin: "8px 0 4px 0", fontFamily: serif }}>{recipe.title}</h1>
            <p style={{ fontSize: "14px", color: recipe.tag_color, fontFamily: serif, fontStyle: "italic", margin: "0 0 12px 0", letterSpacing: "0.02em" }}>{recipe.subtitle}</p>
            <p style={{ fontSize: "13px", color: t.inkLight, fontFamily: sans, lineHeight: 1.7, margin: 0 }}>{recipe.description}</p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", borderTop: `1px solid ${t.border}`, paddingTop: "16px" }}>
          {[
            { l: "Prep", v: recipe.prep_time },
            { l: "Cook", v: recipe.cook_time },
            { l: "Total", v: recipe.total_time },
            { l: "Servings", v: recipe.servings },
            { l: "Daily dose", v: recipe.dose },
          ].map((s, i, arr) => (
            <div key={i} style={{ flex: "1 1 auto", padding: "10px 16px", borderRight: i < arr.length - 1 ? `1px solid ${t.border}` : "none", minWidth: "80px" }}>
              <div style={{ fontSize: "13px", color: t.ink, fontFamily: sans, fontWeight: "500" }}>{s.v}</div>
              <div style={{ fontSize: "9px", color: t.inkFaint, fontFamily: sans, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: "3px" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: `2px solid ${t.border}`, marginBottom: "20px" }}>
        {tabs.map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ padding: "10px 20px", background: "transparent", border: "none", borderBottom: tab === tb ? `2px solid ${recipe.tag_color}` : "2px solid transparent", marginBottom: "-2px", color: tab === tb ? recipe.tag_color : t.inkFaint, cursor: "pointer", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, transition: "color 0.2s" }}>
            {tb}
          </button>
        ))}
      </div>

      {tab === "ingredients" && <IngredientList ingredients={recipe.ingredients} accentColor={recipe.tag_color} />}
      {tab === "steps" && <StepList steps={recipe.steps} accentColor={recipe.tag_color} />}
      {tab === "notes" && <NoteList notes={recipe.notes} accentColor={recipe.tag_color} />}
    </div>
  );
}
