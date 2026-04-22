import { useState, useRef, useEffect } from "react";
import { t } from "../theme";

const EMOJIS = [
  "🍽️","🥩","🍖","🍗","🥚","🥓","🦴","🐄","🐟","🦐","🦞","🦀",
  "🍲","🥘","🫕","🍜","🍝","🥗","🍳","🧆","🫙","🏺","🍱","🥣",
  "🥕","🥦","🧅","🧄","🫑","🍅","🌽","🥬","🌿","🫚","🥒","🍄",
  "🍋","🍊","🥑","🥝","🫐","🍓","🍒","🍎","🍌","🍇","🍑","🍐",
  "🍬","🍭","🧁","🍰","🍮","🍯","🍫","🍡","🍩","🍪","🎂","🍨",
  "☕","🍵","🫖","🥛","🥤","🧋","🍷","🫗","🧃","🧊","🍺","🥂",
  "🔪","🍴","🥄","🧂","⚗️","🫙","💊","🌡️","🏋️","💪","🧬","🌱",
];

export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Choose emoji"
        style={{
          fontSize: "26px", lineHeight: 1, width: "54px", height: "44px",
          border: `1px solid ${t.border}`, borderRadius: "6px",
          background: t.surface, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "border-color 0.15s",
          fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif",
        }}
      >
        {value || "🍽️"}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px",
          padding: "10px", boxShadow: "0 8px 32px rgba(44,36,24,0.14)",
          display: "grid", gridTemplateColumns: "repeat(8, 34px)", gap: "2px",
          width: "auto",
        }}>
          {EMOJIS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(emoji); setOpen(false); }}
              style={{
                fontSize: "20px", width: "34px", height: "34px", border: "none",
                background: value === emoji ? t.surface2 : "transparent",
                borderRadius: "4px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.surface2; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = value === emoji ? t.surface2 : "transparent"; }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
