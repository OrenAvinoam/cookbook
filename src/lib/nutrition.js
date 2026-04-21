function round(v) {
  return v != null ? Math.round(v * 10) / 10 : null;
}

export async function analyzeNutrition(title, ingredients, servings) {
  const ingr = ingredients
    .map((ing) => `${ing.amount || ""} ${ing.name || ""}`.trim())
    .filter(Boolean);

  const res = await fetch("/api/nutrition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, ingr }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Nutrition analysis failed");
  }

  const srv = Math.max(1, Number(servings) || 1);
  const n = data.totalNutrients || {};

  return {
    calories: Math.round((data.calories || 0) / srv),
    totalFat: round((n.FAT?.quantity ?? null) === null ? null : n.FAT.quantity / srv),
    saturatedFat: round(n.FASAT ? n.FASAT.quantity / srv : null),
    transFat: round(n.FATRN ? n.FATRN.quantity / srv : null),
    cholesterol: round(n.CHOLE ? n.CHOLE.quantity / srv : null),
    sodium: round(n.NA ? n.NA.quantity / srv : null),
    totalCarb: round(n.CHOCDF ? n.CHOCDF.quantity / srv : null),
    fiber: round(n.FIBTG ? n.FIBTG.quantity / srv : null),
    sugars: round(n.SUGAR ? n.SUGAR.quantity / srv : null),
    protein: round(n.PROCNT ? n.PROCNT.quantity / srv : null),
    vitaminD: round(n.VITD ? n.VITD.quantity / srv : null),
    calcium: round(n.CA ? n.CA.quantity / srv : null),
    iron: round(n.FE ? n.FE.quantity / srv : null),
    potassium: round(n.K ? n.K.quantity / srv : null),
  };
}
