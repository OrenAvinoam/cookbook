import { t, serif, sans } from "../theme";
import { useLanguage } from "../i18n";
import { localizeTime, localizeAmount } from "../lib/translate";

function parseImagePos(str) {
  const p = (str || "50% 50%").trim().split(/\s+/);
  return { pos: `${p[0] || "50%"} ${p[1] || "50%"}`, scale: p[2] ? parseFloat(p[2]) : 1 };
}

const EMOJI_FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

function scaleAmount(str, factor) {
  if (!str || factor === 1) return str;
  const FRAC = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };
  let s = str.trim();
  for (const [sym, val] of Object.entries(FRAC))
    s = s.replace(sym, (Math.round(val * 1000) / 1000).toString());
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)(.*)/);
  if (mixed) return fmtN((+mixed[1] + +mixed[2] / +mixed[3]) * factor) + mixed[4];
  const frac = s.match(/^(\d+)\/(\d+)(.*)/);
  if (frac) return fmtN((+frac[1] / +frac[2]) * factor) + frac[3];
  const num = s.match(/^(\d*\.?\d+)(.*)/);
  if (num) return fmtN(parseFloat(num[1]) * factor) + num[2];
  return str;
}
function fmtN(n) { const r = Math.round(n * 100) / 100; return r % 1 === 0 ? String(r) : String(r); }

export default function PrintView({ recipe, tags, scaleFactor, onClose }) {
  const { tr, lang, isRTL } = useLanguage();
  const recipeTags = (recipe.tag_ids || []).map(id => tags.find(t => t.id === id)).filter(Boolean);
  const accentColor = recipeTags[0]?.color || "#6A9E82";
  const factor = scaleFactor || 1;
  const imgPos = parseImagePos(recipe.image_position);

  const stats = [
    { l: tr("lbl_prep"), v: localizeTime(recipe.prep_time, lang) },
    { l: tr("lbl_cook"), v: localizeTime(recipe.cook_time, lang) },
    { l: tr("lbl_total"), v: localizeTime(recipe.total_time, lang) },
    { l: tr("lbl_servings"), v: factor !== 1 ? `${Math.round((parseFloat(recipe.servings) || 1) * factor)}` : recipe.servings },
    { l: tr("lbl_dose"), v: recipe.dose },
  ].filter(s => s.v);

  return (
    <div className="print-view" style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "#fff", overflowY: "auto",
      fontFamily: serif,
      direction: isRTL ? "rtl" : "ltr",
    }}>
      {/* Screen-only close button */}
      <button
        onClick={onClose}
        className="no-print"
        style={{
          position: "fixed", top: "20px", [isRTL ? "left" : "right"]: "20px", zIndex: 1001,
          background: t.ink, border: "none", color: "#fff",
          fontFamily: sans, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
          padding: "8px 16px", borderRadius: "20px", cursor: "pointer",
        }}
      >
        {tr("print_close")}
      </button>
      <button
        onClick={() => window.print()}
        className="no-print"
        style={{
          position: "fixed", top: "20px", [isRTL ? "left" : "right"]: "110px", zIndex: 1001,
          background: "#6A9E82", border: "none", color: "#fff",
          fontFamily: sans, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
          padding: "8px 16px", borderRadius: "20px", cursor: "pointer",
        }}
      >
        {tr("print_export")}
      </button>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 0 60px 0" }}>

        {/* Header */}
        <div style={{ background: t.ink, padding: "36px 40px 28px", marginBottom: "0", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
          <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "16px" }}>
            {recipe.image_url ? (
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid rgba(255,255,255,0.15)" }}>
                <img src={recipe.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: imgPos.pos, transform: imgPos.scale !== 1 ? `scale(${imgPos.scale})` : undefined, transformOrigin: "center" }} />
              </div>
            ) : (
              <span style={{ fontSize: "64px", lineHeight: 1, fontFamily: EMOJI_FONT, flexShrink: 0 }}>{recipe.emoji}</span>
            )}
            <div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                {recipe.category && (
                  <span style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.08)", padding: "3px 8px", borderRadius: "20px" }}>
                    {recipe.category_display || recipe.category}
                  </span>
                )}
                {recipeTags.map(tag => (
                  <span key={tag.id} style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color: tag.color, background: tag.color + "28", padding: "3px 8px", borderRadius: "20px" }}>{tag.name}</span>
                ))}
              </div>
              <h1 style={{ fontFamily: serif, fontSize: "32px", fontWeight: "400", color: "#F7F3EE", margin: "0 0 6px 0" }}>{recipe.title}</h1>
              <p style={{ fontFamily: serif, fontSize: "14px", color: "rgba(247,243,238,0.65)", margin: 0, lineHeight: 1.6 }}>{recipe.description}</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {stats.length > 0 && (
          <div style={{ background: accentColor, display: "flex", flexWrap: "wrap", gap: "0", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
            {stats.map((s, i) => (
              <div key={i} style={{ padding: "12px 20px", borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
                <div style={{ fontSize: "16px", fontFamily: serif, color: "#fff" }}>{s.v}</div>
                <div style={{ fontSize: "10px", fontFamily: sans, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "32px 40px" }}>
          {/* Ingredients */}
          {recipe.ingredients?.length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C47A5A", fontFamily: sans, margin: "0 0 16px 0", paddingBottom: "8px", borderBottom: "2px solid #C47A5A40" }}>
                {tr("section_ingredients")} {factor !== 1 && <span style={{ opacity: 0.6 }}>· {tr("print_scaled")} ×{factor}</span>}
              </p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} style={{ display: "flex", gap: "20px", alignItems: "baseline", padding: "7px 0", borderBottom: i < recipe.ingredients.length - 1 ? "1px solid #EEE9E2" : "none" }}>
                    <span style={{ fontSize: "14px", color: accentColor, fontFamily: serif, fontWeight: "500", flexShrink: 0, minWidth: "90px" }}>
                      {localizeAmount(scaleAmount(ing.amount, factor), lang)}
                    </span>
                    <span style={{ fontSize: "14px", color: "#5C4E3C", fontFamily: serif }}>{ing.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Steps */}
          {recipe.steps?.length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C47A5A", fontFamily: sans, margin: "0 0 16px 0", paddingBottom: "8px", borderBottom: "2px solid #C47A5A40" }}>{tr("print_method")}</p>
              {recipe.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: accentColor, color: "#fff", fontSize: "13px", fontFamily: sans, fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "baseline", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", fontFamily: sans, textTransform: "uppercase", letterSpacing: "0.14em", color: t.inkMid }}>{step.title}</span>
                      {step.time && step.time !== "—" && <span style={{ fontSize: "12px", color: t.inkFaint, fontFamily: sans }}>{step.time}</span>}
                    </div>
                    <p style={{ fontSize: "14px", color: "#5C4E3C", fontFamily: serif, lineHeight: 1.75, margin: 0 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Notes */}
          {recipe.notes?.filter(n => n.body).length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C47A5A", fontFamily: sans, margin: "0 0 16px 0", paddingBottom: "8px", borderBottom: "2px solid #C47A5A40" }}>{tr("section_notes")}</p>
              {recipe.notes.filter(n => n.body).map((note, i) => (
                <div key={i} style={{ background: "#F7F3EE", borderLeft: `3px solid ${accentColor}`, borderRadius: "6px", padding: "12px 16px", marginBottom: "10px" }}>
                  {note.title && <p style={{ fontSize: "10px", color: accentColor, fontFamily: sans, textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 4px 0" }}>{note.title}</p>}
                  <p style={{ fontSize: "14px", color: "#5C4E3C", fontFamily: serif, lineHeight: 1.7, margin: 0 }}>{note.body}</p>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #DDD5C8", margin: "0 40px", padding: "16px 0" }}>
          <p style={{ fontSize: "11px", color: "#B5A898", fontFamily: sans, margin: 0, letterSpacing: "0.1em" }}>
            {tr("print_footer", new Date().toLocaleDateString())}
          </p>
        </div>
      </div>
    </div>
  );
}
