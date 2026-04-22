import { t, serif, sans, body } from "../theme";

export default function IngredientList({ ingredients, accentColor, cookMode, checkedItems, onToggle }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {ingredients.map((ing, i) => {
        const checked = cookMode && checkedItems?.has(i);
        return (
          <div
            key={i}
            onClick={() => cookMode && onToggle(i)}
            style={{
              display: "flex", gap: "12px", alignItems: "center",
              padding: "10px 14px", background: checked ? t.surface2 : t.surface2,
              borderRadius: "8px", border: `1px solid ${checked ? t.border : t.border}`,
              cursor: cookMode ? "pointer" : "default",
              opacity: checked ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {cookMode && (
              <div style={{
                width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${checked ? accentColor : t.border}`,
                background: checked ? accentColor : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                {checked && <span style={{ color: "#fff", fontSize: "11px", lineHeight: 1 }}>✓</span>}
              </div>
            )}
            <span style={{
              fontSize: "20px", color: accentColor, fontFamily: body, fontWeight: "500",
              flexShrink: 0, minWidth: "80px",
              textDecoration: checked ? "line-through" : "none",
            }}>
              {ing.amount}
            </span>
            <span style={{
              fontSize: "20px", color: t.inkMid, fontFamily: body,
              textDecoration: checked ? "line-through" : "none",
            }}>{ing.name}</span>
          </div>
        );
      })}
    </div>
  );
}
