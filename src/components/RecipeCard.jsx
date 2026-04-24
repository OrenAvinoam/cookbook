import { useState } from "react";
import { t, serif, sans, body } from "../theme";
import { useLanguage } from "../i18n";

const EMOJI_FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

export default function RecipeCard({ recipe, tags, onClick }) {
  const [hovered, setHovered] = useState(false);
  const { tr, tcat, isRTL } = useLanguage();

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
        [isRTL ? "borderRight" : "borderLeft"]: `3px solid ${hovered ? accentColor : accentColor + "70"}`,
        borderRadius: "12px", padding: "22px 26px", cursor: "pointer",
        transition: "all 0.25s",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 28px ${accentColor}18` : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {recipe.category && (
            <span style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color: t.inkFaint, background: t.surface2, border: `1px solid ${t.border}`, padding: "3px 8px", borderRadius: "20px" }}>
              {tcat(recipe.category)}
            </span>
          )}
          {recipeTags.map((tag) => (
            <span key={tag.id} style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color: tag.color, background: tag.color + "18", border: `1px solid ${tag.color}40`, padding: "3px 8px", borderRadius: "20px" }}>
              {tag.name}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "16px", flexShrink: 0, background: accentColor + "10", borderRadius: "8px", padding: "6px 12px" }}>
          {[{ l: tr("lbl_prep"), v: recipe.prep_time }, { l: tr("lbl_cook"), v: recipe.cook_time }, { l: tr("lbl_servings"), v: recipe.servings }]
            .filter(s => s.v)
            .map((s, i) => (
            <div key={i} style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", color: t.inkMid, fontFamily: body }}>{s.v}</div>
              <div style={{ fontSize: "10px", color: t.inkFaint, fontFamily: sans, letterSpacing: "0.12em", textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Avatar + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
        {recipe.image_url ? (
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0,
            overflow: "hidden", border: `2px solid ${accentColor}40`,
          }}>
            <img
              src={recipe.image_url}
              alt={recipe.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: recipe.image_position || "50% 50%" }}
            />
          </div>
        ) : (
          <span style={{ fontSize: "40px", lineHeight: 1, flexShrink: 0, display: "flex", alignItems: "center", fontFamily: EMOJI_FONT }}>{recipe.emoji}</span>
        )}
        <h2 style={{ fontSize: "22px", fontWeight: "400", color: t.ink, margin: 0, fontFamily: serif }}>{recipe.title}</h2>
      </div>

      {/* Description */}
      <p style={{ fontSize: "18px", color: t.inkLight, fontFamily: body, lineHeight: 1.65, margin: "0 0 12px 0" }}>{recipe.description}</p>

      {/* Footer */}
      <p style={{ fontSize: "12px", color: t.inkFaint, fontFamily: sans, margin: 0 }}>
        {tr("lbl_x_ingr_steps", recipe.ingredients?.length ?? 0, recipe.steps?.length ?? 0)}
        <span style={{ color: accentColor, marginLeft: "8px" }}>{tr("lbl_view_recipe")}</span>
      </p>
    </div>
  );
}
