import { t, sans, serif } from "../theme";

const DV = { fat: 78, satFat: 20, chol: 300, sodium: 2300, carb: 275, fiber: 28 };
const pct = (val, dv) => (val != null && dv ? Math.round((val / dv) * 100) : null);
const fmt = (v) => (v != null ? v : "—");

function Row({ label, sub, value, unit, bold, pctVal }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: sub ? "4px 0 4px 14px" : "5px 0",
      borderBottom: `1px solid ${t.border}`,
    }}>
      <span style={{ fontSize: "13px", fontFamily: sans, fontWeight: bold ? "600" : "normal", color: bold ? t.ink : t.inkMid }}>
        {label}{" "}
        {value != null && (
          <span style={{ fontWeight: "normal", color: t.inkLight }}>{fmt(value)}{unit}</span>
        )}
      </span>
      {pctVal != null && (
        <span style={{ fontSize: "13px", fontFamily: sans, fontWeight: "600", color: t.terra }}>{pctVal}%</span>
      )}
    </div>
  );
}

export default function NutritionLabel({ nutrition, servings }) {
  if (!nutrition) return null;
  const n = nutrition;

  return (
    <div style={{
      border: `1px solid ${t.border}`, borderRadius: "12px", overflow: "hidden",
      maxWidth: "300px", background: t.surface, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{
        background: t.green, padding: "14px 18px 12px",
        borderBottom: `3px solid ${t.terra}`,
      }}>
        <div style={{ fontSize: "22px", fontWeight: "400", fontFamily: serif, color: "#fff", letterSpacing: "0.01em", lineHeight: 1.1 }}>
          Nutrition Facts
        </div>
        <div style={{ fontSize: "11px", fontFamily: sans, color: "rgba(255,255,255,0.75)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "4px" }}>
          {servings} serving{Number(servings) !== 1 ? "s" : ""} per recipe
        </div>
      </div>

      {/* Calories spotlight */}
      <div style={{
        background: t.terraFaint, padding: "12px 18px",
        borderBottom: `2px solid ${t.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: "11px", fontFamily: sans, letterSpacing: "0.14em", textTransform: "uppercase", color: t.inkFaint }}>Per serving</div>
          <div style={{ fontSize: "13px", fontFamily: sans, color: t.inkLight, marginTop: "2px" }}>Calories</div>
        </div>
        <div style={{ fontSize: "42px", fontFamily: serif, fontWeight: "400", color: t.terra, lineHeight: 1 }}>{fmt(n.calories)}</div>
      </div>

      {/* Macros strip */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${t.border}` }}>
        {[
          { label: "Protein", value: n.protein, unit: "g" },
          { label: "Fat", value: n.totalFat, unit: "g" },
          { label: "Carbs", value: n.totalCarb, unit: "g" },
        ].map((m, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center", padding: "10px 4px",
            borderRight: i < 2 ? `1px solid ${t.border}` : "none",
            background: t.surface2,
          }}>
            <div style={{ fontSize: "16px", fontFamily: serif, color: t.green, fontWeight: "500" }}>{fmt(m.value)}<span style={{ fontSize: "11px", color: t.inkFaint }}>{m.unit}</span></div>
            <div style={{ fontSize: "10px", fontFamily: sans, letterSpacing: "0.12em", textTransform: "uppercase", color: t.inkFaint, marginTop: "2px" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Detailed rows */}
      <div style={{ padding: "0 18px 4px" }}>
        <div style={{ fontSize: "10px", fontFamily: sans, letterSpacing: "0.14em", textTransform: "uppercase", color: t.inkFaint, textAlign: "right", padding: "6px 0 2px", borderBottom: `1px solid ${t.border}` }}>
          % Daily Value*
        </div>
        <Row label="Total Fat" value={n.totalFat} unit="g" bold pctVal={pct(n.totalFat, DV.fat)} />
        <Row label="Saturated Fat" value={n.saturatedFat} unit="g" sub pctVal={pct(n.saturatedFat, DV.satFat)} />
        <Row label="Trans Fat" value={n.transFat} unit="g" sub />
        <Row label="Cholesterol" value={n.cholesterol} unit="mg" bold pctVal={pct(n.cholesterol, DV.chol)} />
        <Row label="Sodium" value={n.sodium} unit="mg" bold pctVal={pct(n.sodium, DV.sodium)} />
        <Row label="Total Carbohydrate" value={n.totalCarb} unit="g" bold pctVal={pct(n.totalCarb, DV.carb)} />
        <Row label="Dietary Fiber" value={n.fiber} unit="g" sub pctVal={pct(n.fiber, DV.fiber)} />
        <Row label="Total Sugars" value={n.sugars} unit="g" sub />
      </div>

      {/* Micronutrients */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 0, borderTop: `2px solid ${t.border}` }}>
        {[
          { label: "Vitamin D", value: n.vitaminD, unit: "mcg", dv: 20 },
          { label: "Calcium", value: n.calcium, unit: "mg", dv: 1300 },
          { label: "Iron", value: n.iron, unit: "mg", dv: 18 },
          { label: "Potassium", value: n.potassium, unit: "mg", dv: 4700 },
        ].filter(m => m.value != null).map((m, i, arr) => (
          <div key={i} style={{
            flex: "1 1 50%", padding: "8px 12px",
            borderRight: i % 2 === 0 ? `1px solid ${t.border}` : "none",
            borderBottom: i < arr.length - 2 ? `1px solid ${t.border}` : "none",
            background: t.surface,
          }}>
            <span style={{ fontSize: "12px", fontFamily: sans, color: t.inkMid }}>{m.label} </span>
            <span style={{ fontSize: "12px", fontFamily: sans, color: t.inkLight }}>{fmt(m.value)}{m.unit}</span>
            {m.dv && <span style={{ fontSize: "11px", fontFamily: sans, color: t.green, marginLeft: "4px" }}>{Math.round((m.value / m.dv) * 100)}%</span>}
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 18px", background: t.surface2, borderTop: `1px solid ${t.border}` }}>
        <p style={{ fontSize: "10px", fontFamily: sans, color: t.inkFaint, margin: 0, lineHeight: 1.5 }}>
          * % Daily Value based on a 2,000 calorie diet.
        </p>
      </div>
    </div>
  );
}
