import { useState } from "react";
import { supabase } from "../lib/supabase";
import { t, serif, sans } from "../theme";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", fontFamily: sans, fontSize: "13px", color: t.ink,
    background: t.bg, border: `1px solid ${t.border}`, borderRadius: "6px",
    padding: "9px 12px", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "360px", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", color: t.green, fontFamily: sans, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 8px 0" }}>a personal collection</p>
          <h1 style={{ fontSize: "36px", fontWeight: "400", color: t.ink, margin: "0 0 6px 0", fontFamily: serif }}>Oren's Cookbook</h1>
          <p style={{ fontSize: "11px", color: t.terra, fontFamily: sans, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
            Collagen · Skin Health · Carnivore Protocol
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "28px" }}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, display: "block", marginBottom: "4px" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, display: "block", marginBottom: "4px" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" style={inputStyle} />
          </div>
          {error && <p style={{ fontFamily: sans, fontSize: "12px", color: "#8B3A3A", margin: "0 0 14px 0" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", background: t.ink, border: "none", color: "#fff", fontFamily: sans, fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "10px", borderRadius: "20px", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
