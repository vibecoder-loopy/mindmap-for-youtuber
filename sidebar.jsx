// Refined sidebar — minimal, no chevrons everywhere, tight type
const Sidebar = ({ activeZone, openZone, focusNode, nodes, selectedId }) => {
  const groups = ZONES.reduce((acc, z) => {
    (acc[z.group] = acc[z.group] || []).push(z); return acc;
  }, {});

  const pipelineCounts = Object.keys(STATUS).reduce((a, k) => {
    a[k] = nodes.filter(n => n.status === k).length; return a;
  }, {});

  return (
    <div style={{
      width: 224, flexShrink: 0,
      display: "flex", flexDirection: "column",
      background: "var(--panel)", borderRight: "1px solid var(--line)",
      overflow: "hidden",
    }}>
      {/* Workspace section */}
      <div style={{ padding: "14px 14px 4px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.6, textTransform: "uppercase" }}>Workspace</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} style={{ marginTop: 10 }}>
            <div style={{
              padding: "4px 6px",
              fontSize: 10.5, fontWeight: 600, color: "var(--ink-3)",
              letterSpacing: 0.3,
            }}>{group}</div>
            <div>
              {items.map(z => {
                const node = nodes.find(n => n.id === z.nodeId);
                const isSelected = selectedId === z.nodeId;
                const isOpen = activeZone === z.id;
                return (
                  <button key={z.id}
                    onClick={() => { openZone(z.id); focusNode(z.nodeId); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "5px 6px",
                      border: "none",
                      background: isOpen ? "var(--red-soft)" : (isSelected ? "var(--bg-3)" : "transparent"),
                      color: isOpen ? "var(--red-2)" : "var(--ink-2)",
                      cursor: "pointer", fontSize: 12, fontWeight: 400,
                      textAlign: "left", borderRadius: 4,
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                    onMouseEnter={e => { if (!isOpen && !isSelected) e.currentTarget.style.background = "var(--bg-2)"; }}
                    onMouseLeave={e => { if (!isOpen && !isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 11, color: "var(--ink-4)" }}>·</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{z.name}</span>
                    {node?.status === "publish" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--red)" }}/>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div style={{ padding: "14px 14px 12px", borderTop: "1px solid var(--line)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>Pipeline</div>
        {Object.entries(STATUS).map(([k, s]) => {
          const count = pipelineCounts[k] || 0;
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 9, padding: "3px 0", fontSize: 11.5 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: s.color, flexShrink: 0 }}/>
              <span style={{ flex: 1, color: "var(--ink-2)" }}>{s.label}</span>
              <span style={{ color: count ? "var(--ink-2)" : "var(--ink-4)", fontFeatureSettings: "'tnum'", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* User */}
      <div style={{
        padding: "10px 14px", borderTop: "1px solid var(--line)",
        display: "flex", alignItems: "center", gap: 9,
      }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-3)", border: "1px solid var(--line-2)", fontSize: 10, fontWeight: 600, display: "grid", placeItems: "center", color: "var(--ink-2)" }}>J</div>
        <div style={{ flex: 1, fontSize: 11.5, color: "var(--ink-2)" }}>Jun</div>
        <span style={{ fontSize: 10, color: "var(--ink-4)" }}>Pro</span>
      </div>
    </div>
  );
};

window.Sidebar = Sidebar;
