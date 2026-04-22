import { t, serif, sans, body } from "../theme";

export default function NoteList({ notes, accentColor }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {notes.map((note, i) => (
        <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderLeft: `3px solid ${accentColor}`, borderRadius: "8px", padding: "16px 20px" }}>
          <p style={{ fontSize: "11px", color: accentColor, fontFamily: sans, textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px 0" }}>{note.title}</p>
          <p style={{ fontSize: "20px", color: t.inkLight, fontFamily: body, lineHeight: 1.75, margin: 0 }}>{note.body}</p>
        </div>
      ))}
    </div>
  );
}
