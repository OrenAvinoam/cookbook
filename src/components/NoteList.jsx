import { t, serif, sans } from "../theme";

export default function NoteList({ notes, accentColor }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {notes.map((note, i) => (
        <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderLeft: `3px solid ${accentColor}`, borderRadius: "8px", padding: "14px 18px" }}>
          <p style={{ fontSize: "13px", color: accentColor, fontFamily: serif, fontStyle: "italic", margin: "0 0 6px 0" }}>{note.title}</p>
          <p style={{ fontSize: "13px", color: t.inkLight, fontFamily: serif, lineHeight: 1.7, margin: 0 }}>{note.body}</p>
        </div>
      ))}
    </div>
  );
}
