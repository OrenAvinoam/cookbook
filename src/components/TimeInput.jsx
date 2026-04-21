import { useState } from "react";
import { t, sans } from "../theme";

function parseTime(str) {
  if (!str) return { hours: "", minutes: "" };
  const h = str.match(/(\d+)\s*h/i);
  const m = str.match(/(\d+)\s*min/i);
  return { hours: h ? String(parseInt(h[1])) : "", minutes: m ? String(parseInt(m[1])) : "" };
}

function formatTime(hours, minutes) {
  const h = parseInt(hours) || 0;
  const m = parseInt(minutes) || 0;
  if (!h && !m) return "";
  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
}

const selectStyle = {
  fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface,
  border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 6px",
  outline: "none", cursor: "pointer", boxSizing: "border-box",
};

export default function TimeInput({ value, onChange }) {
  const parsed = parseTime(value);
  const [hours, setHours] = useState(parsed.hours);
  const [minutes, setMinutes] = useState(parsed.minutes);

  const handleH = (h) => { setHours(h); onChange(formatTime(h, minutes)); };
  const handleM = (m) => { setMinutes(m); onChange(formatTime(hours, m)); };

  return (
    <div style={{ display: "flex", gap: "6px" }}>
      <select value={hours} onChange={(e) => handleH(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
        <option value="">— h</option>
        {Array.from({ length: 25 }, (_, i) => i).map((h) => (
          <option key={h} value={String(h)}>{h}h</option>
        ))}
      </select>
      <select value={minutes} onChange={(e) => handleM(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
        <option value="">— min</option>
        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
          <option key={m} value={String(m)}>{m}min</option>
        ))}
      </select>
    </div>
  );
}
