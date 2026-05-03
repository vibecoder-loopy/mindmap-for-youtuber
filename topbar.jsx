// Refined topbar — minimal, monochrome
const Topbar = ({ view, setView, hasZone, zoneName, openAI, aiOpen }) => {
  const tabs = [
    { id: "canvas", label: "Map" },
    { id: "graph",  label: "Graph" },
  ];
  return (
    <div style={{
      height: 44, display: "flex", alignItems: "center",
      padding: "0 12px", gap: 12,
      background: "var(--bg)",
      borderBottom: "1px solid var(--line)",
      flexShrink: 0, position: "relative", zIndex: 50,
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 4,
          background: "var(--red)",
          display: "grid", placeItems: "center",
          fontSize: 10, fontWeight: 800, color: "white",
          letterSpacing: -0.5,
        }}>T</div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.2 }}>
          TubeMap
        </div>
      </div>

      <div style={{ width: 1, height: 16, background: "var(--line)" }}/>

      {/* Channel & breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-3)" }}>
        <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>테크 토크 KR</span>
        <span style={{ color: "var(--ink-4)" }}>/</span>
        <span>AI 코딩 도구</span>
        {hasZone && <>
          <span style={{ color: "var(--ink-4)" }}>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{zoneName}</span>
        </>}
      </div>

      <div style={{ flex: 1 }}/>

      {/* View toggle */}
      <div style={{ display: "flex", gap: 0 }}>
        {tabs.map((t, i) => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding: "5px 12px",
            background: "transparent",
            border: "1px solid var(--line)",
            borderRight: i === tabs.length-1 ? "1px solid var(--line)" : "none",
            borderRadius: i === 0 ? "5px 0 0 5px" : i === tabs.length-1 ? "0 5px 5px 0" : 0,
            color: view === t.id ? "var(--ink)" : "var(--ink-3)",
            cursor: "pointer", fontSize: 11.5, fontWeight: 500,
            background: view === t.id ? "var(--bg-3)" : "transparent",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "5px 10px", borderRadius: 5, width: 200,
        border: "1px solid var(--line)",
        color: "var(--ink-3)", fontSize: 11.5,
      }}>
        <span>검색</span>
        <div style={{ flex: 1 }}/>
        <kbd style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "JetBrains Mono, monospace" }}>⌘K</kbd>
      </div>

      <button onClick={openAI} style={{
        padding: "5px 11px", borderRadius: 5,
        background: aiOpen ? "var(--red)" : "transparent",
        border: `1px solid ${aiOpen ? "var(--red)" : "var(--line)"}`,
        color: aiOpen ? "white" : "var(--ink-2)",
        cursor: "pointer", fontSize: 11.5, fontWeight: 500,
      }}>AI</button>
    </div>
  );
};

window.Topbar = Topbar;
