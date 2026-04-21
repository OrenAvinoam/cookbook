export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;

  if (!appId || !appKey) {
    return res.status(503).json({ error: "Nutrition API not configured. Add EDAMAM_APP_ID and EDAMAM_APP_KEY to your Vercel environment variables." });
  }

  try {
    const { title, ingr } = req.body;
    const response = await fetch(
      `https://api.edamam.com/api/nutrition-details?app_id=${appId}&app_key=${appKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, ingr }),
      }
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
