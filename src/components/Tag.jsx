import { sans } from "../theme";

export default function Tag({ color, bg, children }) {
  return (
    <span style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: sans, color, background: bg, border: `1px solid ${color}30`, padding: "3px 10px", borderRadius: "20px" }}>
      {children}
    </span>
  );
}
