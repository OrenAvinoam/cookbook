import { useState } from "react";
import { t, serif, sans } from "../theme";
import Tag from "./Tag";

export default function RecipeCard({ recipe, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.surface,
        border: `1px solid ${hovered ? recipe.tag_color + "60" : t.border}`,
        borderRadius: "12px",
        padding: "28px",
        cursor: "pointer",
        transition: "all 0.25s",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 32px ${recipe.tag_color}18` : "0 2px 8px rgba(0,0,0,0.04)",
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
      }}
    >
      <div style={{ fontSize: "48px", lineHeight: 1, flexShrink: 0 }}>{recipe.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <Tag color={recipe.tag_color} bg={recipe.tag_color === "#6A9E82" ? "#E8F0EB" : "#F5EAE4"}>{recipe.tag}</Tag>
          <div style={{ display: "flex", gap: "16px" }}>
            {[{ l: "Prep", v: recipe.prep_time }, { l: "Cook", v: recipe.cook_time }, { l: "Serves", v: recipe.servings }].map((s, i) => (
              <div key={i} style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: t.inkMid, fontFamily: sans, fontWeight: "500" }}>{s.v}</div>
                <div style={{ fontSize: "9px", color: t.inkFaint, fontFamily: sans, letterSpacing: "0.12em", textTransform: "uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: "400", color: t.ink, margin: "0 0 4px 0", fontFamily: serif }}>{recipe.title}</h2>
        <p style={{ fontSize: "13px", color: recipe.tag_color, fontFamily: serif, fontStyle: "italic", margin: "0 0 12px 0", letterSpacing: "0.02em" }}>{recipe.subtitle}</p>
        <p style={{ fontSize: "13px", color: t.inkLight, fontFamily: sans, lineHeight: 1.7, margin: "0 0 14px 0" }}>{recipe.description}</p>
        <p style={{ fontSize: "11px", color: t.inkFaint, fontFamily: sans, margin: 0 }}>
          {recipe.ingredients?.length ?? 0} ingredients · {recipe.steps?.length ?? 0} steps
          <span style={{ color: recipe.tag_color, marginLeft: "8px" }}>View recipe →</span>
        </p>
      </div>
    </div>
  );
}
