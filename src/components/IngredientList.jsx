import { t, sans } from "../theme";

export default function IngredientList({ ingredients, accentColor }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "6px" }}>
      {ingredients.map((ing, i) => (
        <div key={i} style={{ display: "flex", gap: "12px", alignItems: "baseline", padding: "10px 14px", background: t.surface2, borderRadius: "8px", border: `1px solid ${t.border}` }}>
          <span style={{ fontSize: "13px", color: accentColor, fontFamily: sans, fontWeight: "600", flexShrink: 0, minWidth: "70px" }}>
            {ing.amount}
          </span>
          <span style={{ fontSize: "13px", color: t.inkMid, fontFamily: sans }}>{ing.name}</span>
        </div>
      ))}
    </div>
  );
}
