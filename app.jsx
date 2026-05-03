// Main app — wires together topbar, sidebar, canvas, inspector, zone editor, AI panel
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF0033",
  "showTrendCard": true,
  "edgeStyle": "curved",
  "density": "comfortable"
}/*EDITMODE-END*/;

const App = () => {
  const [view, setView] = useState("canvas"); // canvas | graph
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges] = useState(INITIAL_EDGES);
  const [selectedId, setSelectedId] = useState("n-ep2");
  const [hoveredId, setHoveredId] = useState(null);
  const [zoneId, setZoneId] = useState(null);
  const [zoneFullscreen, setZoneFullscreen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const [tweaks, setTweak] = (window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}]);

  // Apply accent var
  useEffect(() => {
    document.documentElement.style.setProperty("--red", tweaks.accent);
  }, [tweaks.accent]);

  const selectedNode = nodes.find(n => n.id === selectedId);
  const activeZone = ZONES.find(z => z.id === zoneId);
  const zoneNode = activeZone ? nodes.find(n => n.id === activeZone.nodeId) : null;

  const openZoneByNode = (nodeId) => {
    const z = ZONES.find(zz => zz.nodeId === nodeId);
    if (z) setZoneId(z.id);
  };
  const openZoneById = (zid) => setZoneId(zid);

  const focusNode = (nodeId) => setSelectedId(nodeId);

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <Topbar
        view={view} setView={setView}
        hasZone={!!activeZone} zoneName={activeZone?.name}
        openAI={() => setAiOpen(o => !o)} aiOpen={aiOpen}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <Sidebar
          activeZone={zoneId}
          openZone={openZoneById}
          focusNode={focusNode}
          nodes={nodes}
          selectedId={selectedId}
        />

        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
          <Canvas
            nodes={nodes} edges={edges} setNodes={setNodes}
            selectedId={selectedId} setSelectedId={setSelectedId}
            hoveredId={hoveredId} setHoveredId={setHoveredId}
            openZone={openZoneByNode}
            view={view}
          />

          {!activeZone && (
            <Inspector
              node={selectedNode} edges={edges} nodes={nodes}
              openZone={openZoneByNode}
              onClose={() => setSelectedId(null)}
            />
          )}

          {activeZone && (
            <ZoneEditor
              zone={activeZone} node={zoneNode}
              fullscreen={zoneFullscreen} setFullscreen={setZoneFullscreen}
              onClose={() => { setZoneId(null); setZoneFullscreen(false); }}
            />
          )}

          <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} node={selectedNode}/>
        </div>
      </div>

      {/* Tweaks Panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="외관">
            <window.TweakColor label="액센트 컬러" value={tweaks.accent} onChange={v => setTweak("accent", v)}/>
            <window.TweakRadio label="밀도" value={tweaks.density} onChange={v => setTweak("density", v)}
              options={[{ value: "compact", label: "컴팩트" }, { value: "comfortable", label: "기본" }]}/>
          </window.TweakSection>
          <window.TweakSection title="캔버스">
            <window.TweakRadio label="엣지 스타일" value={tweaks.edgeStyle} onChange={v => setTweak("edgeStyle", v)}
              options={[{ value: "curved", label: "곡선" }, { value: "straight", label: "직선" }]}/>
            <window.TweakToggle label="트렌드 인사이트 카드" value={tweaks.showTrendCard} onChange={v => setTweak("showTrendCard", v)}/>
          </window.TweakSection>
          <window.TweakSection title="빠른 액션">
            <window.TweakButton label="EP02 zone 열기" onClick={() => setZoneId("z-ep2")}/>
            <window.TweakButton label="그래프 뷰로 전환" onClick={() => setView(view === "graph" ? "canvas" : "graph")}/>
            <window.TweakButton label="AI 패널 토글" onClick={() => setAiOpen(o => !o)}/>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
