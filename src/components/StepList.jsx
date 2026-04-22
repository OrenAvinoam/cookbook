import { useState, useEffect, useRef } from "react";
import { t, serif, sans, body } from "../theme";

function parseTimeToSeconds(str) {
  if (!str || str === "—") return null;
  const h = str.match(/(\d+)\s*h/i);
  const m = str.match(/(\d+)\s*m/i);
  const s = str.match(/(\d+)\s*s(?!e)/i);
  const total = (h ? parseInt(h[1]) * 3600 : 0) + (m ? parseInt(m[1]) * 60 : 0) + (s ? parseInt(s[1]) : 0);
  return total > 0 ? total : null;
}

function formatCountdown(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StepList({ steps, accentColor, cookMode, checkedSteps, onToggleStep }) {
  const [open, setOpen] = useState(null);
  const [timers, setTimers] = useState({});
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev };
        let changed = false;
        for (const key of Object.keys(next)) {
          if (next[key].running && next[key].remaining > 0) {
            next[key] = { ...next[key], remaining: next[key].remaining - 1 };
            changed = true;
          } else if (next[key].running && next[key].remaining === 0) {
            next[key] = { ...next[key], running: false };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const startTimer = (i, total) => setTimers(p => ({ ...p, [i]: { total, remaining: p[i]?.remaining ?? total, running: true } }));
  const pauseTimer = (i) => setTimers(p => ({ ...p, [i]: { ...p[i], running: false } }));
  const resetTimer = (i, total) => setTimers(p => ({ ...p, [i]: { total, remaining: total, running: false } }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {steps.map((step, i) => {
        const isOpen = open === i;
        const totalSecs = parseTimeToSeconds(step.time);
        const timer = timers[i];
        const checked = cookMode && checkedSteps?.has(i);

        return (
          <div
            key={i}
            style={{
              background: isOpen ? t.surface : t.surface2,
              border: `1px solid ${isOpen ? accentColor + "50" : t.border}`,
              borderRadius: "8px", overflow: "hidden",
              transition: "border-color 0.2s, background 0.2s",
              opacity: checked ? 0.5 : 1,
            }}
          >
            <div
              onClick={() => setOpen(isOpen ? null : i)}
              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", cursor: "pointer" }}
            >
              {cookMode ? (
                <div
                  onClick={e => { e.stopPropagation(); onToggleStep?.(i); }}
                  style={{
                    width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${checked ? accentColor : t.border}`,
                    background: checked ? accentColor : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", cursor: "pointer",
                  }}
                >
                  {checked && <span style={{ color: "#fff", fontSize: "12px" }}>✓</span>}
                </div>
              ) : (
                <span style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: isOpen ? accentColor : t.border,
                  color: isOpen ? "#fff" : t.inkLight,
                  fontSize: "12px", fontFamily: sans, fontWeight: "600",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 0.2s, color 0.2s",
                }}>{i + 1}</span>
              )}
              <span style={{
                fontSize: "11px", color: isOpen ? t.ink : t.inkMid, fontFamily: sans,
                textTransform: "uppercase", letterSpacing: "0.14em", flex: 1,
                transition: "color 0.2s",
                textDecoration: checked ? "line-through" : "none",
              }}>{step.title}</span>
              {step.time && step.time !== "—" && (
                <span style={{ fontSize: "11px", color: t.inkFaint, fontFamily: sans, flexShrink: 0 }}>{step.time}</span>
              )}
              <span style={{ fontSize: "11px", color: t.inkFaint }}>{isOpen ? "▲" : "▼"}</span>
            </div>

            {isOpen && (
              <div style={{ padding: "12px 16px 16px 56px", borderTop: `1px solid ${t.border}`, animation: "fadeSlideIn 0.18s ease" }}>
                <p style={{ fontSize: "20px", color: t.inkLight, fontFamily: body, lineHeight: 1.75, margin: "0 0 12px 0" }}>
                  {step.body}
                </p>
                {totalSecs && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "22px", fontFamily: serif, color: timer?.running ? accentColor : t.ink,
                      fontVariantNumeric: "tabular-nums", minWidth: "64px",
                      transition: "color 0.3s",
                    }}>
                      {formatCountdown(timer?.remaining ?? totalSecs)}
                    </span>
                    {(!timer || !timer.running) && (
                      <button onClick={() => startTimer(i, totalSecs)} style={{ background: accentColor, border: "none", color: "#fff", fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", padding: "5px 14px", borderRadius: "20px", cursor: "pointer" }}>
                        {timer?.remaining != null && timer.remaining < totalSecs ? "Resume" : "Start"}
                      </button>
                    )}
                    {timer?.running && (
                      <button onClick={() => pauseTimer(i)} style={{ background: "none", border: `1px solid ${t.border}`, color: t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", padding: "5px 14px", borderRadius: "20px", cursor: "pointer" }}>
                        Pause
                      </button>
                    )}
                    {timer && (
                      <button onClick={() => resetTimer(i, totalSecs)} style={{ background: "none", border: "none", color: t.inkFaint, fontFamily: sans, fontSize: "11px", cursor: "pointer", padding: "5px 8px" }}>
                        Reset
                      </button>
                    )}
                    {timer?.remaining === 0 && (
                      <span style={{ fontFamily: sans, fontSize: "11px", color: accentColor, letterSpacing: "0.1em" }}>Done!</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
