import { useState, useRef, useEffect } from "react";
import { t, sans } from "../theme";
import { supabase } from "../lib/supabase";

// Parse "X% Y% scale" or legacy "X% Y%" from stored image_position string
function parsePos(str) {
  const parts = (str || "50% 50%").trim().split(/\s+/);
  const posX = parseInt(parts[0]) || 50;
  const posY = parseInt(parts[1]) || 50;
  const scale = parts[2] ? parseFloat(parts[2]) : 1;
  return { posX, posY, scale: isNaN(scale) ? 1 : scale };
}

export default function ImagePicker({ imageUrl, imagePosition, onChange, accentColor }) {
  const init = parsePos(imagePosition);
  const [posX, setPosX] = useState(init.posX);
  const [posY, setPosY] = useState(init.posY);
  const [scale, setScale] = useState(init.scale);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const lastMouseRef = useRef(null);
  const fileRef = useRef();
  const accent = accentColor || t.green;

  const PREVIEW = 160;

  // Encode position + scale back to a string
  const encodePos = (x, y, s) => `${Math.round(x)}% ${Math.round(y)}% ${s.toFixed(2)}`;

  // Notify parent whenever position or scale changes
  useEffect(() => {
    if (imageUrl) onChange(imageUrl, encodePos(posX, posY, scale));
  }, [posX, posY, scale]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setPosX(50); setPosY(50); setScale(1);
      onChange(publicUrl, "50% 50% 1.00");
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  const startDrag = (clientX, clientY) => {
    if (!imageUrl) return;
    setDragging(true);
    lastMouseRef.current = { x: clientX, y: clientY };
  };

  useEffect(() => {
    if (!dragging) return;
    const sens = 100 / PREVIEW;

    const onMove = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      if (!lastMouseRef.current) { lastMouseRef.current = { x: cx, y: cy }; return; }
      const dx = cx - lastMouseRef.current.x;
      const dy = cy - lastMouseRef.current.y;
      lastMouseRef.current = { x: cx, y: cy };
      setPosX(p => Math.max(0, Math.min(100, p - dx * sens)));
      setPosY(p => Math.max(0, Math.min(100, p - dy * sens)));
    };
    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>

        {/* ── Circular drag preview ── */}
        <div
          onMouseDown={e => { startDrag(e.clientX, e.clientY); e.preventDefault(); }}
          onTouchStart={e => { startDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }}
          style={{
            width: `${PREVIEW}px`, height: `${PREVIEW}px`, borderRadius: "50%",
            overflow: "hidden", flexShrink: 0,
            border: `2px ${imageUrl ? "solid" : "dashed"} ${imageUrl ? accent : t.border}`,
            background: imageUrl ? "transparent" : t.surface2,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: imageUrl ? (dragging ? "grabbing" : "grab") : "default",
            userSelect: "none",
            boxShadow: imageUrl ? `0 4px 20px ${accent}30` : "none",
            transition: "box-shadow 0.2s",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                objectPosition: `${posX}% ${posY}%`,
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: "center",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          ) : (
            <span style={{ fontSize: "36px", opacity: 0.25 }}>📷</span>
          )}
        </div>

        {/* ── Controls ── */}
        <div style={{ flex: 1, minWidth: "160px", paddingTop: "4px" }}>
          {/* Upload / remove buttons */}
          <div style={{ display: "flex", gap: "8px", marginBottom: imageUrl ? "18px" : 0 }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                background: imageUrl ? t.surface2 : accent,
                border: `1px solid ${t.border}`,
                color: imageUrl ? t.inkLight : "#fff",
                fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em",
                padding: "6px 16px", borderRadius: "20px",
                cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading ? "Uploading…" : imageUrl ? "Change photo" : "Add photo"}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => { onChange(null, "50% 50% 1.00"); setPosX(50); setPosY(50); setScale(1); }}
                style={{
                  background: "none", border: `1px solid ${t.border}`, color: t.inkFaint,
                  fontFamily: sans, fontSize: "11px", padding: "6px 12px", borderRadius: "20px", cursor: "pointer",
                }}
              >
                Remove
              </button>
            )}
          </div>

          {imageUrl && (
            <div>
              <p style={{ fontSize: "11px", fontFamily: sans, color: t.inkFaint, margin: "0 0 12px 0", letterSpacing: "0.07em" }}>
                Drag the circle to reposition · scroll or slide to zoom
              </p>

              {/* Zoom slider */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: t.inkFaint, flexShrink: 0 }}>−</span>
                <input
                  type="range" min="0.8" max="3" step="0.05"
                  value={scale}
                  onChange={e => setScale(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: accent, cursor: "pointer" }}
                />
                <span style={{ fontSize: "13px", color: t.inkFaint, flexShrink: 0 }}>+</span>
                <span style={{ fontSize: "11px", fontFamily: sans, color: t.inkFaint, minWidth: "36px", textAlign: "right" }}>
                  {Math.round(scale * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}
