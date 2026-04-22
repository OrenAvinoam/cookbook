import { useState, useRef } from "react";
import { t, sans } from "../theme";

const KEY_NUTRIENT_IDS = {
  1008: "calories", 1003: "protein", 1004: "totalFat",
  1005: "totalCarb", 1079: "fiber", 1093: "sodium",
  1063: "sugars", 1253: "cholesterol", 1258: "saturatedFat",
};

function extractNutrients(foodNutrients) {
  const result = {};
  for (const fn of (foodNutrients || [])) {
    const key = KEY_NUTRIENT_IDS[fn.nutrientId || fn.nutrient?.id];
    if (key) result[key] = Math.round((fn.value ?? fn.amount ?? 0) * 10) / 10;
  }
  return result;
}

export default function USDASearch({ onSelect, placeholder }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  const apiKey = import.meta.env.VITE_USDA_API_KEY;

  const search = (q) => {
    if (!q.trim() || !apiKey) { setResults([]); setOpen(false); return; }
    setLoading(true);
    fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&api_key=${apiKey}&pageSize=10&dataType=Foundation,SR+Legacy`)
      .then(r => r.json())
      .then(data => {
        setResults(data.foods || []);
        setOpen(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 420);
  };

  const handleSelect = (food) => {
    const nutrients = extractNutrients(food.foodNutrients);
    onSelect({ fdcId: String(food.fdcId), description: food.description, nutrients });
    setQuery(food.description);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder || "Search USDA database…"}
        style={{
          width: "100%", fontFamily: sans, fontSize: "13px", color: t.ink,
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px",
          padding: "8px 12px", outline: "none", boxSizing: "border-box",
        }}
        onFocus={e => e.target.style.borderColor = t.green}
      />
      {loading && (
        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: t.inkFaint, fontFamily: sans }}>Searching…</span>
      )}
      {!apiKey && query && (
        <div style={{ marginTop: "4px", fontSize: "11px", color: t.terra, fontFamily: sans }}>
          Set VITE_USDA_API_KEY in .env.local to enable USDA search
        </div>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)", maxHeight: "280px", overflowY: "auto",
        }}>
          {results.map(food => (
            <div
              key={food.fdcId}
              onMouseDown={() => handleSelect(food)}
              style={{
                padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${t.border}`,
                transition: "background 0.12s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = t.greenFaint}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontSize: "13px", fontFamily: sans, color: t.ink }}>{food.description}</div>
              <div style={{ fontSize: "11px", fontFamily: sans, color: t.inkFaint, marginTop: "2px" }}>
                FDC #{food.fdcId} · {food.dataType}
                {food.foodNutrients?.find(n => n.nutrientId === 1008) && (
                  <span style={{ color: t.terra, marginLeft: "8px" }}>
                    {Math.round(food.foodNutrients.find(n => n.nutrientId === 1008).value || 0)} kcal/100g
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
