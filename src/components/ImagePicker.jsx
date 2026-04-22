import { useState, useRef } from "react";
import { t, sans, serif } from "../theme";
import { supabase } from "../lib/supabase";

export default function ImagePicker({ imageUrl, imagePosition, onChange, accentColor }) {
  const [uploading, setUploading] = useState(false);
  const [posX, setPosX] = useState(() => {
    const m = (imagePosition || "50% 50%").match(/(\d+)%\s+(\d+)%/);
    return m ? parseInt(m[1]) : 50;
  });
  const [posY, setPosY] = useState(() => {
    const m = (imagePosition || "50% 50%").match(/(\d+)%\s+(\d+)%/);
    return m ? parseInt(m[2]) : 50;
  });
  const fileRef = useRef();

  const accent = accentColor || t.green;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from("recipe-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("recipe-images").getPublicUrl(data.path);
      onChange(publicUrl, `${posX}% ${posY}%`);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  function updatePosition(x, y) {
    const nx = x ?? posX;
    const ny = y ?? posY;
    setPosX(nx); setPosY(ny);
    if (imageUrl) onChange(imageUrl, `${nx}% ${ny}%`);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        {/* Circle preview */}
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          overflow: "hidden", flexShrink: 0,
          border: `2px dashed ${imageUrl ? accent : t.border}`,
          background: imageUrl ? "transparent" : t.surface2,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {imageUrl ? (
            <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${posX}% ${posY}%` }} />
          ) : (
            <span style={{ fontSize: "24px", opacity: 0.3 }}>📷</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: "160px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: imageUrl ? "10px" : 0 }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ background: imageUrl ? t.surface2 : accent, border: `1px solid ${t.border}`, color: imageUrl ? t.inkLight : "#fff", fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", padding: "6px 14px", borderRadius: "20px", cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? "Uploading…" : imageUrl ? "Change photo" : "Add photo"}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => onChange(null, "50% 50%")}
                style={{ background: "none", border: `1px solid ${t.border}`, color: t.inkFaint, fontFamily: sans, fontSize: "11px", padding: "6px 12px", borderRadius: "20px", cursor: "pointer" }}
              >
                Remove
              </button>
            )}
          </div>

          {imageUrl && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: t.inkFaint, fontFamily: sans, width: "16px" }}>↔</span>
                <input type="range" min="0" max="100" value={posX} onChange={e => updatePosition(parseInt(e.target.value), null)} style={{ flex: 1, accentColor: accent }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: t.inkFaint, fontFamily: sans, width: "16px" }}>↕</span>
                <input type="range" min="0" max="100" value={posY} onChange={e => updatePosition(null, parseInt(e.target.value))} style={{ flex: 1, accentColor: accent }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}
