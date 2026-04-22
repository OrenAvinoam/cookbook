import { t, serif, sans } from "../theme";

export default function MealPlanList({ plans, onCreate, onOpen }) {
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
        return (
          <div
            key={plan.id}
            onClick={() => onOpen(plan.id)}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "18px 22px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.green + "60"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(106,158,130,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div>
              <p style={{ fontFamily: serif, fontSize: "18px", color: t.ink, margin: "0 0 4px 0" }}>{plan.name}</p>
              <p style={{ fontFamily: sans, fontSize: "11px", color: t.inkFaint, margin: 0, letterSpacing: "0.08em" }}>
                {uniqueCount} {uniqueCount === 1 ? "recipe" : "recipes"} · {totalSlots} {totalSlots === 1 ? "serving" : "servings"} planned
              </p>
            </div>
            <span style={{ color: t.green, fontFamily: sans, fontSize: "12px", flexShrink: 0 }}>Open →</span>
          </div>
        );
      })}
    </div>
  );
}
