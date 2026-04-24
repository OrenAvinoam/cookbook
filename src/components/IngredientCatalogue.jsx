import { useState } from "react";
import { t, serif, sans, body } from "../theme";
import IngredientForm from "./IngredientForm";
import { useLanguage } from "../i18n";

export default function IngredientCatalogue({
  ingredients, categories, mappings, isEditor,
  onCreate, onUpdate, onDelete, onCreateCategory, onSaveMapping,
}) {
  const { tr } = useLanguage();
  const MODE_LABEL = { tracked: tr("ingr_mode_tracked"), ignored: tr("ingr_mode_ignored"), custom: tr("ingr_mode_custom") };
  const MODE_COLOR = { tracked: t.green, ignored: t.inkFaint, custom: t.terra };
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [expanded, setExpandedState] = useState(() => {
    try { return sessionStorage.getItem("ingr_expanded") || null; } catch { return null; }
  });
  const setExpanded = (id) => {
    setExpandedState(id);
    try { id ? sessionStorage.setItem("ingr_expanded", id) : sessionStorage.removeItem("ingr_expanded"); } catch {}
  };

  const getMapping = (id) => mappings.find(m => m.ingredient_id === id);
  const getCategory = (id) => categories.find(c => c.id === id);

  const filtered = ingredients.filter(ing => {
    const catOk = selectedCat === "all" || ing.category_id === selectedCat;
    const q = search.trim().toLowerCase();
    const searchOk = !q || ing.name.toLowerCase().includes(q) || (ing.aliases || []).some(a => a.toLowerCase().includes(q));
    return catOk && searchOk;
  });

  const grouped = categories.reduce((acc, cat) => {
    acc[cat.id] = filtered.filter(i => i.category_id === cat.id);
    return acc;
  }, {});
  const uncategorized = filtered.filter(i => !i.category_id);

  const handleSave = async (payload, mapping) => {
    let savedIngredient;
    if (editTarget) {
      await onUpdate(editTarget.id, payload);
      savedIngredient = { ...editTarget, ...payload };
    } else {
      savedIngredient = await onCreate(payload);
    }
    if (mapping && savedIngredient?.id && onSaveMapping) {
      await onSaveMapping(savedIngredient.id, mapping);
    }
    setShowForm(false);
    setEditTarget(null);
  };

  const handleDelete = async (id) => {
    if (!confirm(tr("ingr_confirm_delete"))) return;
    await onDelete(id);
    if (expanded === id) setExpanded(null);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    await onCreateCategory({ name: newCatName.trim(), icon: newCatIcon.trim() || null, sort_order: categories.length });
    setNewCatName(""); setNewCatIcon(""); setShowCatForm(false);
  };

  const sectionHdr = (label, extra) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "24px 0 10px 0", paddingBottom: "6px", borderBottom: `1px solid ${t.border}` }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: 0 }}>{label}</p>
      {extra}
    </div>
  );

  const IngredientCard = ({ ing }) => {
    const mapping = getMapping(ing.id);
    const cat = getCategory(ing.category_id);
    const isOpen = expanded === ing.id;

    return (
      <div style={{
        background: t.surface, border: `1px solid ${isOpen ? t.green + "50" : t.border}`,
        borderRadius: "10px", overflow: "hidden", transition: "border-color 0.2s",
      }}>
        <div
          onClick={() => setExpanded(isOpen ? null : ing.id)}
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", cursor: "pointer" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "16px", fontFamily: serif, color: t.ink }}>{ing.name}</span>
              {cat && (
                <span style={{ fontSize: "10px", fontFamily: sans, letterSpacing: "0.1em", textTransform: "uppercase", color: t.inkFaint, background: t.surface2, border: `1px solid ${t.border}`, padding: "2px 7px", borderRadius: "20px" }}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </span>
              )}
              <span style={{ fontSize: "10px", fontFamily: sans, letterSpacing: "0.1em", textTransform: "uppercase", color: MODE_COLOR[ing.nutrition_mode] || t.inkFaint, background: (MODE_COLOR[ing.nutrition_mode] || t.inkFaint) + "18", padding: "2px 7px", borderRadius: "20px", border: `1px solid ${(MODE_COLOR[ing.nutrition_mode] || t.inkFaint)}30` }}>
                {MODE_LABEL[ing.nutrition_mode] || ing.nutrition_mode}
              </span>
            </div>
            {ing.aliases?.length > 0 && (
              <div style={{ fontSize: "12px", fontFamily: sans, color: t.inkFaint, marginTop: "2px" }}>
                {tr("ingr_also")} {ing.aliases.join(", ")}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {mapping?.nutrients?.calories != null && (
              <span style={{ fontSize: "12px", fontFamily: sans, color: t.terra }}>{mapping.nutrients.calories} kcal/100g</span>
            )}
            <span style={{ fontSize: "12px", color: t.inkFaint }}>{isOpen ? "▲" : "▼"}</span>
          </div>
        </div>

        {isOpen && (
          <div style={{ padding: "12px 14px 14px", borderTop: `1px solid ${t.border}`, background: t.surface2, animation: "fadeSlideIn 0.15s ease" }}>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
              {ing.nutrition_mode === "tracked" && mapping && (
                <>
                  {mapping.description && (
                    <div>
                      <span style={{ fontSize: "11px", fontFamily: sans, color: t.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>{tr("ingr_usda_source")}</span>
                      <div style={{ fontSize: "13px", fontFamily: sans, color: t.inkMid, marginTop: "2px" }}>{mapping.description}</div>
                    </div>
                  )}
                  {Object.keys(mapping.nutrients || {}).length > 0 && (
                    <div>
                      <span style={{ fontSize: "11px", fontFamily: sans, color: t.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>{tr("ingr_per100g")}</span>
                      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "6px" }}>
                        {[[tr("ingr_calories"), "calories", "kcal"], [tr("ingr_protein"), "protein", "g"], [tr("ingr_fat"), "totalFat", "g"], [tr("ingr_carbs"), "totalCarb", "g"]].map(([lbl, key, unit]) =>
                          mapping.nutrients[key] != null && (
                            <div key={key} style={{ textAlign: "center" }}>
                              <div style={{ fontSize: "16px", fontFamily: serif, color: t.green }}>{mapping.nutrients[key]}<span style={{ fontSize: "10px", color: t.inkFaint, marginLeft: "2px" }}>{unit}</span></div>
                              <div style={{ fontSize: "10px", fontFamily: sans, color: t.inkFaint, letterSpacing: "0.1em" }}>{lbl}</div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              {ing.nutrition_mode === "tracked" && !mapping && (
                <div style={{ fontSize: "13px", fontFamily: sans, color: t.inkFaint, fontStyle: "italic" }}>{tr("ingr_no_usda")}</div>
              )}
            </div>
            {ing.notes && (
              <p style={{ fontSize: "14px", fontFamily: body, color: t.inkLight, margin: "0 0 12px 0", lineHeight: 1.6 }}>{ing.notes}</p>
            )}
            {isEditor && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setEditTarget(ing); setShowForm(true); }} style={{ background: "none", border: `1px solid ${t.border}`, color: t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", padding: "5px 14px", borderRadius: "20px", cursor: "pointer" }}>{tr("btn_edit")}</button>
                <button onClick={() => handleDelete(ing.id)} style={{ background: "none", border: "none", color: t.terra, fontFamily: sans, fontSize: "11px", cursor: "pointer", padding: "5px 8px" }}>{tr("btn_delete")}</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderList = (list) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {list.map(ing => <IngredientCard key={ing.id} ing={ing} />)}
    </div>
  );

  if (showForm) {
    const existingMapping = editTarget ? getMapping(editTarget.id) : null;
    const mappingForForm = existingMapping ? {
      fdc_id: existingMapping.fdc_id,
      description: existingMapping.description,
      nutrients: existingMapping.nutrients,
    } : null;
    return (
      <IngredientForm
        initial={editTarget}
        categories={categories}
        existingMapping={mappingForForm}
        onSave={handleSave}
        onCancel={() => { setShowForm(false); setEditTarget(null); }}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: t.inkFaint, fontFamily: sans, margin: 0 }}>
          {tr("ingr_count", ingredients.length)}
        </p>
        {isEditor && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowCatForm(f => !f)} style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.inkLight, fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "7px 14px", borderRadius: "20px", cursor: "pointer" }}>{tr("btn_add_category")}</button>
            <button onClick={() => { setEditTarget(null); setShowForm(true); }} style={{ background: t.green, border: "none", color: "#fff", fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "7px 16px", borderRadius: "20px", cursor: "pointer" }}>{tr("btn_add_ingredient")}</button>
          </div>
        )}
      </div>

      {showCatForm && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", padding: "12px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px" }}>
          <input value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} placeholder={tr("ingr_cat_icon_ph")} style={{ width: "60px", fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "7px 8px", outline: "none", textAlign: "center" }} />
          <input value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreateCategory()} placeholder={tr("ingr_cat_name_ph")} style={{ flex: 1, fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "7px 10px", outline: "none" }} />
          <button onClick={handleCreateCategory} disabled={!newCatName.trim()} style={{ background: t.green, border: "none", color: "#fff", fontFamily: sans, fontSize: "11px", letterSpacing: "0.1em", padding: "7px 14px", borderRadius: "20px", cursor: "pointer", opacity: !newCatName.trim() ? 0.5 : 1 }}>{tr("btn_create")}</button>
          <button onClick={() => setShowCatForm(false)} style={{ background: "none", border: "none", color: t.inkFaint, cursor: "pointer", fontFamily: sans, fontSize: "12px" }}>{tr("btn_cancel")}</button>
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: t.inkFaint, pointerEvents: "none" }}>🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={tr("ingr_search_ph")} style={{ width: "100%", fontFamily: sans, fontSize: "13px", color: t.ink, background: t.surface, border: `1px solid ${t.border}`, borderRadius: "24px", padding: "8px 14px 8px 32px", outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={{ fontFamily: sans, fontSize: "12px", color: t.ink, background: t.surface, border: `1px solid ${t.border}`, borderRadius: "24px", padding: "8px 14px", outline: "none", cursor: "pointer" }}>
          <option value="all">{tr("ingr_all_cats")}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>)}
          <option value="none">{tr("ingr_uncategorized")}</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: t.inkFaint, fontFamily: sans, fontSize: "13px" }}>
          {ingredients.length === 0 ? tr("ingr_none_yet") : tr("ingr_no_match", search)}
        </div>
      )}

      {/* Grouped by category */}
      {selectedCat === "all" ? (
        <>
          {categories.filter(c => (grouped[c.id] || []).length > 0).map(cat => (
            <div key={cat.id}>
              {sectionHdr(`${cat.icon ? cat.icon + " " : ""}${cat.name} (${grouped[cat.id].length})`)}
              {renderList(grouped[cat.id])}
            </div>
          ))}
          {uncategorized.length > 0 && (
            <>
              {sectionHdr(`${tr("ingr_uncategorized")} (${uncategorized.length})`)}
              {renderList(uncategorized)}
            </>
          )}
        </>
      ) : selectedCat === "none" ? (
        renderList(uncategorized)
      ) : (
        renderList(filtered)
      )}
    </div>
  );
}
