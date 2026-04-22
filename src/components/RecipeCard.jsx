import { useState } from "react";
import { t, serif, sans } from "../theme";

export default function RecipeCard({ recipe, tags, onClick }) {
  const [hovered, setHovered] = useState(false);

  const recipeTags = (recipe.tag_ids || [])
    .map((id) => tags.find((tg) => tg.id === id))
    .filter(Boolean);

  const accentColor = recipeTags[0]?.color || t.green;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.surface,
        border: `1px solid ${hovered ? accentColor + "60" : t.border}`,
        borderRadius: "12px", padding: "24px 28px", cursor: "pointer",
        transition: "all 0.25s",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 32px ${accentColor}18` : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top row: tags left, stats right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {recipe.category && (
            <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color: t.inkFaint, background: t.surface2, border: `1px solid ${t.border}`, padding: "3px 8px", borderRadius: "20px" }}>
              {recipe.category}
            </span>
          )}
          {recipeTags.map((tag) => (
            <span key={tag.id} style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color: tag.color, background: tag.color + "18", border: `1px solid ${tag.color}40`, padding: "3px 8px", borderRadius: "20px" }}>
              {tag.name}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
          {[{ l: "Prep", v: recipe.prep_time }, { l: "Cook", v: recipe.cook_time }, { l: "Serves", v: recipe.servings }].map((s, i) => (
            <div key={i} style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", color: t.inkMid, fontFamily: serif }}>{s.v}</div>
              <div style={{ fontSize: "9px", color: t.inkFaint, fontFamily: sans, letterSpacing: "0.12em", textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Emoji + title row, vertically centered */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
        <span style={{ fontSize: "40px", lineHeight: 1, flexShrink: 0, display: "flex", alignItems: "center", fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif" }}>{recipe.emoji}</span>
        <h2 style={{ fontSize: "22px", fontWeight: "400", color: t.ink, margin: 0, fontFamily: serif }}>{recipe.title}</h2>
      </div>

      {/* Description */}
      <p style={{ fontSize: "13px", color: t.inkLight, fontFamily: serif, lineHeight: 1.7, margin: "0 0 12px 0" }}>{recipe.description}</p>

      {/* Footer */}
      <p style={{ fontSize: "11px", color: t.inkFaint, fontFamily: sans, margin: 0 }}>
        {recipe.ingredients?.length ?? 0} ingredients · {recipe.steps?.length ?? 0} steps
        <span style={{ color: accentColor, marginLeft: "8px" }}>View recipe →</span>
      </p>
    </div>
  );
}
