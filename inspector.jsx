// Refined inspector — quiet, single-color, type hierarchy carries the design
const Inspector = ({ node, edges, nodes, openZone, onClose }) => {
  if (!node) return (
    <div style={{
      width: 300, flexShrink: 0,
      background: "var(--panel)", borderLeft: "1px solid var(--line)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 6,
      color: "var(--ink-4)", textAlign: "center", padding: 24,
    }}>
      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>노드를 선택하세요</div>
    </div>
  );

  const t = NODE_TYPES[node.type];
  const s = STATUS[node.status];
  const backlinks = edges.filter(e => e.to === node.id).map(e => nodes.find(n => n.id === e.from)).filter(Boolean);
  const forwardLinks = edges.filter(e => e.from === node.id).map(e => nodes.find(n => n.id === e.to)).filter(Boolean);

  const seoScore = 60 + (node.id.charCodeAt(node.id.length-1) % 30);
  const isVideo = node.type === "idea";

  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: "var(--panel)", borderLeft: "1px solid var(--line)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        height: 38, padding: "0 14px",
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid var(--line)",
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.dot }}/>
        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-3)", letterSpacing: 0.5, textTransform: "uppercase" }}>
          {node.ep || t.label}
        </span>
        <div style={{ flex: 1 }}/>
        <button onClick={onClose} style={iconBtn}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Title */}
        <div style={{ padding: "16px 16px 14px" }}>
          <div style={{
            fontSize: 18, fontWeight: 700, color: "var(--ink)",
            lineHeight: 1.25, letterSpacing: -0.4, marginBottom: 6,
          }}>{node.title}</div>
          {node.subtitle && (
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{node.subtitle}</div>
          )}
          {s && (
            <div style={{ marginTop: 10, fontSize: 10.5, color: "var(--ink-3)", letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>
              <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: s.color, marginRight: 7, verticalAlign: "middle" }}/>
              {s.label}
            </div>
          )}
        </div>

        {/* Thumbnail preview */}
        {isVideo && node.thumb && (
          <div style={{ padding: "0 16px 16px" }}>
            <div style={{
              position: "relative", height: 130,
              background: "#1A1A1D", border: "1px solid var(--line)",
              borderRadius: 4, overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", padding: "0 18px",
                fontSize: 36, fontWeight: 800, color: "var(--ink)",
                letterSpacing: -1, lineHeight: 1,
              }}>{node.ep}</div>
              <div style={{
                position: "absolute", right: 10, bottom: 8,
                fontSize: 11, color: "var(--ink-3)",
                fontFamily: "JetBrains Mono, monospace",
              }}>11:24</div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, marginTop: 12, borderTop: "1px solid var(--line)" }}>
              {[
                { label: "Est. views", value: node.views || "12K" },
                { label: "CTR",        value: "8.4%" },
                { label: "Watch",      value: "62%" },
              ].map((m, i) => (
                <div key={m.label} style={{ padding: "10px 8px", borderRight: i < 2 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontSize: 9.5, color: "var(--ink-4)", letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", fontFeatureSettings: "'tnum'", letterSpacing: -0.3 }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEO */}
        {isVideo && (
          <div style={{ padding: "16px", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "baseline", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.5, textTransform: "uppercase" }}>SEO</div>
              <div style={{ flex: 1 }}/>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", letterSpacing: -0.5, fontFeatureSettings: "'tnum'" }}>{seoScore}</div>
              <div style={{ fontSize: 11, color: "var(--ink-4)", marginLeft: 2 }}>/100</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { ok: true,  label: "제목에 핵심 키워드 포함" },
                { ok: true,  label: "썸네일 텍스트 ≤ 4단어" },
                { ok: false, label: "설명 첫 줄 후킹 약함" },
                { ok: false, label: "태그 11/15 — 4개 더 가능" },
              ].map((it, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: 2, flexShrink: 0,
                    border: `1px solid ${it.ok ? "var(--ink-3)" : "var(--line-2)"}`,
                    background: it.ok ? "var(--ink-3)" : "transparent",
                    display: "grid", placeItems: "center",
                    color: "var(--bg)", fontSize: 9, fontWeight: 800,
                  }}>{it.ok ? "✓" : ""}</span>
                  <span style={{ color: it.ok ? "var(--ink-3)" : "var(--ink-2)", flex: 1 }}>{it.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backlinks */}
        {(backlinks.length > 0 || forwardLinks.length > 0) && (
          <div style={{ padding: "16px", borderTop: "1px solid var(--line)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
              Links · {backlinks.length + forwardLinks.length}
            </div>
            {[...backlinks.map(n => ({n, dir: "←"})), ...forwardLinks.map(n => ({n, dir: "→"}))].map(({n, dir}, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "5px 0", fontSize: 12, cursor: "pointer",
              }}>
                <span style={{ fontSize: 11, color: "var(--ink-4)", width: 10 }}>{dir}</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: NODE_TYPES[n.type]?.dot, flexShrink: 0 }}/>
                <span style={{ flex: 1, color: "var(--ink-2)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: 10, borderTop: "1px solid var(--line)",
        display: "flex", gap: 6,
      }}>
        <button onClick={() => openZone(node.id)} style={{
          flex: 1, padding: "8px 10px", borderRadius: 5,
          background: "transparent", border: "1px solid var(--line-2)",
          color: "var(--ink)", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
        }}>Open zone</button>
        <button style={{
          padding: "8px 12px", borderRadius: 5,
          background: "var(--red)", border: "none",
          color: "white", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
        }}>AI 확장</button>
      </div>
    </div>
  );
};

const iconBtn = {
  display: "grid", placeItems: "center",
  width: 22, height: 22, borderRadius: 4,
  background: "transparent", border: "none",
  color: "var(--ink-3)", cursor: "pointer", fontSize: 16,
  lineHeight: 1,
};

window.Inspector = Inspector;
