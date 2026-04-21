import { useState } from "react";
import { t, serif, sans } from "../theme";

export default function StepList({ steps, accentColor }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {steps.map((step, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            onClick={() => setOpen(isOpen ? null : i)}
            style={{
              background: isOpen ? t.surface : t.surface2,
              border: `1px solid ${isOpen ? accentColor + "50" : t.border}`,
              borderRadius: "8px", overflow: "hidden", cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px" }}>
              <span style={{
                width: "26px", height: "26px", borderRadius: "50%",
                background: isOpen ? accentColor : t.border,
                color: isOpen ? "#fff" : t.inkLight,
                fontSize: "12px", fontFamily: sans, fontWeight: "600",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.2s, color 0.2s",
              }}>{i + 1}</span>
              <span style={{ fontSize: "14px", color: isOpen ? t.ink : t.inkMid, fontFamily: serif, flex: 1, transition: "color 0.2s" }}>{step.title}</span>
              {step.time && step.time !== "—" && <span style={{ fontSize: "11px", color: t.inkFaint, fontFamily: sans, flexShrink: 0 }}>{step.time}</span>}
              <span style={{ fontSize: "11px", color: t.inkFaint }}>{isOpen ? "▲" : "▼"}</span>
            </div>
            {isOpen && (
              <div style={{ padding: "12px 16px 16px 56px", fontSize: "13px", color: t.inkLight, fontFamily: serif, lineHeight: 1.75, borderTop: `1px solid ${t.border}`, animation: "fadeSlideIn 0.18s ease" }}>
                {step.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
