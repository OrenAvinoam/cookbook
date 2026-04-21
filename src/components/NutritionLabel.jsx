import { sans } from "../theme";

const DV = { fat: 78, satFat: 20, chol: 300, sodium: 2300, carb: 275, fiber: 28 };
const pct = (val, dv) => (val != null && dv ? Math.round((val / dv) * 100) : null);
const fmt = (v) => (v != null ? v : "—");

function Divider({ thick }) {
  return <div style={{ borderTop: thick ? "8px solid #222" : "1px solid #222", margin: 0 }} />;
}

function Row({ label, sub, value, unit, bold, pctVal, smallText }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: sub ? "1px 0 1px 16px" : "2px 0", borderBottom: "1px solid #ccc" }}>
      <span style={{ fontSize: smallText ? "11px" : "13px", fontFamily: sans, fontWeight: bold ? "bold" : "normal" }}>
        {label}{" "}
        {!bold && value != null && (
          <span style={{ fontWeight: "normal" }}>{fmt(value)}{unit}</span>
        )}
      </span>
      {pctVal != null && (
        <span style={{ fontSize: "13px", fontFamily: sans, fontWeight: "bold" }}>{pctVal}%</span>
      )}
    </div>
  );
}

export default function NutritionLabel({ nutrition, servings }) {
  if (!nutrition) return null;
  const n = nutrition;

  return (
    <div style={{ border: "2px solid #222", padding: "8px", maxWidth: "280px", background: "white", borderRadius: "4px" }}>
      <div style={{ fontSize: "28px", fontWeight: "900", fontFamily: sans, lineHeight: 1, letterSpacing: "-0.5px" }}>Nutrition Facts</div>
      <div style={{ fontSize: "12px", fontFamily: sans, borderBottom: "1px solid #222", paddingBottom: "4px", marginBottom: "4px" }}>
        {servings} serving{Number(servings) !== 1 ? "s" : ""} per recipe
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "8px solid #222", paddingBottom: "2px" }}>
        <span style={{ fontSize: "13px", fontFamily: sans, fontWeight: "bold" }}>Serving size</span>
        <span style={{ fontSize: "13px", fontFamily: sans, fontWeight: "bold" }}>1 serving</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "4px solid #222", padding: "2px 0" }}>
        <span style={{ fontSize: "13px", fontFamily: sans, fontWeight: "bold" }}>Calories</span>
        <span style={{ fontSize: "36px", fontFamily: sans, fontWeight: "900", lineHeight: 1 }}>{fmt(n.calories)}</span>
      </div>
      <div style={{ textAlign: "right", fontSize: "11px", fontFamily: sans, fontWeight: "bold", borderBottom: "1px solid #222", paddingBottom: "2px" }}>
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
      <Row label="Protein" value={n.protein} unit="g" bold />
      <Divider thick />
      <Row label="Vitamin D" value={n.vitaminD} unit="mcg" smallText pctVal={n.vitaminD != null ? Math.round((n.vitaminD / 20) * 100) : null} />
      <Row label="Calcium" value={n.calcium} unit="mg" smallText pctVal={n.calcium != null ? Math.round((n.calcium / 1300) * 100) : null} />
      <Row label="Iron" value={n.iron} unit="mg" smallText pctVal={n.iron != null ? Math.round((n.iron / 18) * 100) : null} />
      <Row label="Potassium" value={n.potassium} unit="mg" smallText pctVal={n.potassium != null ? Math.round((n.potassium / 4700) * 100) : null} />
      <div style={{ fontSize: "9px", fontFamily: sans, marginTop: "4px", lineHeight: 1.4, color: "#444" }}>
        * The % Daily Value tells you how much a nutrient in a serving contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
      </div>
    </div>
  );
}
