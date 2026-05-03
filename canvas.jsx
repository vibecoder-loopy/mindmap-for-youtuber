// Refined canvas — quiet nodes, sharp typography, monochrome
const sizeOf = (n) => {
  if (n.type === "series") return { w: 240, h: 80 };
  if (n.type === "idea")   return { w: 240, h: 152 };
  if (n.type === "thumb")  return { w: 200, h: 84 };
  return { w: 220, h: 76 };
};

const edgePath = (a, b) => {
  const dx = Math.abs(b.x - a.x);
  const c1x = a.x + Math.max(60, dx * 0.5);
  const c2x = b.x - Math.max(60, dx * 0.5);
  return `M ${a.x},${a.y} C ${c1x},${a.y} ${c2x},${b.y} ${b.x},${b.y}`;
};

// Minimal thumbnail — single tone, big number, no decoration
const ThumbBox = ({ id, ep, status, height = 88 }) => {
  // Map ep id to single subtle gradient — no rainbow
  const tones = {
    ep1: "#1A1A1D", ep2: "#1A1A1D", ep3: "#1A1A1D",
    ep4: "#1A1A1D", ep5: "#1A1A1D", ep6: "#1A1A1D",
  };
  return (
    <div style={{
      position: "relative", width: "100%", height,
      borderRadius: 4, overflow: "hidden", flexShrink: 0,
      background: tones[id] || "#1A1A1D",
      border: "1px solid var(--line)",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", padding: "0 14px",
        fontSize: 26, fontWeight: 800, color: "var(--ink)",
        letterSpacing: -0.8, lineHeight: 1,
        fontFamily: "Pretendard Variable",
      }}>
        {ep}
      </div>
      <div style={{
        position: "absolute", right: 8, bottom: 6,
        fontSize: 10, fontWeight: 500, color: "var(--ink-3)",
        fontFamily: "JetBrains Mono, monospace",
      }}>
        {id === "ep1" ? "11:24" : id === "ep2" ? "10:58" : id === "ep3" ? "14:02" : "—:—"}
      </div>
      {status === "publish" && (
        <div style={{
          position: "absolute", left: 8, top: 8,
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 9, fontWeight: 600, color: "var(--red-2)",
          letterSpacing: 0.5, textTransform: "uppercase",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--red)" }}/>
          Live
        </div>
      )}
    </div>
  );
};

const NodeCard = ({ node, selected, hovered, onMouseDown, onClick, onDoubleClick, onMouseEnter, onMouseLeave }) => {
  const t = NODE_TYPES[node.type];
  const { w, h } = sizeOf(node);
  const isHub = node.type === "series";
  const isIdea = node.type === "idea";
  const s = STATUS[node.status];

  return (
    <div
      data-node-id={node.id}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "absolute",
        left: node.x - w/2, top: node.y - h/2,
        width: w, minHeight: h,
        background: isHub ? "#0F0A0B" : "var(--panel)",
        border: `1px solid ${selected ? "var(--red)" : (isHub ? "rgba(255,45,45,0.4)" : "var(--line)")}`,
        borderRadius: 6,
        boxShadow: selected
          ? "0 0 0 3px rgba(255,45,45,0.15), var(--shadow-pop)"
          : (hovered ? "var(--shadow-pop)" : "var(--shadow-card)"),
        cursor: "grab",
        userSelect: "none",
        overflow: "hidden",
        transition: "border-color 120ms, box-shadow 120ms",
      }}
    >
      <div style={{ padding: isIdea ? "10px 12px 12px" : "11px 13px" }}>
        {/* Header — type label + status (no emoji) */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.dot, flexShrink: 0 }}/>
          <span style={{
            fontSize: 9.5, fontWeight: 600, color: "var(--ink-3)",
            letterSpacing: 0.5, textTransform: "uppercase",
          }}>
            {node.ep ? node.ep : t.label}
          </span>
          <div style={{ flex: 1 }}/>
          {s && (
            <span style={{
              fontSize: 9.5, fontWeight: 500, color: "var(--ink-3)",
              letterSpacing: 0.3, textTransform: "uppercase",
            }}>
              {s.label}
            </span>
          )}
        </div>

        {/* Thumbnail */}
        {isIdea && node.thumb && (
          <div style={{ marginBottom: 10 }}>
            <ThumbBox id={node.thumb} ep={node.ep} status={node.status} height={72}/>
          </div>
        )}

        {/* Title */}
        <div style={{
          fontSize: isHub ? 15 : 13,
          fontWeight: isHub ? 700 : 600,
          color: "var(--ink)",
          letterSpacing: -0.3, lineHeight: 1.3,
          textWrap: "pretty",
        }}>
          {node.title}
        </div>

        {/* Subtitle / single meta line */}
        {(node.subtitle || node.views || node.publishedAt || node.channel) && (
          <div style={{
            fontSize: 11, color: "var(--ink-3)",
            marginTop: 4, fontFamily: node.views || node.refViews ? "JetBrains Mono, monospace" : "inherit",
          }}>
            {node.subtitle && <span>{node.subtitle}</span>}
            {node.views && <span>{node.views} views · {node.publishedAt}</span>}
            {!node.views && node.publishedAt && <span>Upload {node.publishedAt}</span>}
            {node.channel && <span>{node.channel} · {node.refViews}</span>}
          </div>
        )}

        {/* Progress */}
        {typeof node.progress === "number" && (
          <div style={{ marginTop: 9 }}>
            <div style={{ height: 2, background: "var(--bg-3)", overflow: "hidden", borderRadius: 1 }}>
              <div style={{ width: `${node.progress*100}%`, height: "100%", background: "var(--ink-2)" }}/>
            </div>
          </div>
        )}

        {/* A/B */}
        {node.abCount && (
          <div style={{ display: "flex", gap: 3, marginTop: 9 }}>
            {Array.from({ length: node.abCount }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 14,
                background: i === 0 ? "var(--ink)" : "var(--bg-3)",
                border: i === 0 ? "none" : "1px solid var(--line)",
                display: "grid", placeItems: "center",
                fontSize: 9, fontWeight: 700,
                color: i === 0 ? "var(--bg)" : "var(--ink-3)",
                fontFamily: "JetBrains Mono, monospace",
              }}>{["A","B","C"][i]}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Canvas = ({ nodes, edges, setNodes, selectedId, setSelectedId, hoveredId, setHoveredId, openZone, view }) => {
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(0.85);
  const [drag, setDrag] = React.useState(null);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    if (!wrapRef.current) return;
    const W = wrapRef.current.clientWidth, H = wrapRef.current.clientHeight;
    setPan({ x: W/2 - 700 * 0.85, y: H/2 - 380 * 0.85 });
  }, []);

  const onWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      setZoom(z => Math.max(0.3, Math.min(2.0, z * factor)));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const onMouseDownBg = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    setSelectedId(null);
    setDrag({ pan: true, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y });
  };

  const onMouseDownNode = (e, node) => {
    e.stopPropagation();
    setSelectedId(node.id);
    setDrag({ nodeId: node.id, sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y });
  };

  React.useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      if (drag.pan) {
        setPan({ x: drag.px + (e.clientX - drag.sx), y: drag.py + (e.clientY - drag.sy) });
      } else if (drag.nodeId) {
        const dx = (e.clientX - drag.sx) / zoom;
        const dy = (e.clientY - drag.sy) / zoom;
        setNodes(ns => ns.map(n => n.id === drag.nodeId ? { ...n, x: drag.ox + dx, y: drag.oy + dy } : n));
      }
    };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, zoom, setNodes]);

  const nodeMap = React.useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);

  const edgeData = edges.map((e, i) => {
    const a = nodeMap[e.from], b = nodeMap[e.to];
    if (!a || !b) return null;
    const aSize = sizeOf(a), bSize = sizeOf(b);
    const right = b.x > a.x;
    const A = { x: a.x + (right ? aSize.w/2 : -aSize.w/2), y: a.y };
    const B = { x: b.x + (right ? -bSize.w/2 : bSize.w/2), y: b.y };
    const active = selectedId && (e.from === selectedId || e.to === selectedId);
    const dim = selectedId && !active;
    return { ...e, key: i, d: edgePath(A, B), active, dim };
  }).filter(Boolean);

  if (view === "graph") {
    return <GraphView nodes={nodes} edges={edges} selectedId={selectedId} setSelectedId={setSelectedId} openZone={openZone}/>;
  }

  return (
    <div ref={wrapRef}
      onWheel={onWheel}
      onMouseDown={onMouseDownBg}
      style={{
        position: "relative", flex: 1,
        overflow: "hidden",
        background: "var(--bg)",
        cursor: drag?.pan ? "grabbing" : "default",
      }}>
      {/* Subtle dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle, #1F1F23 0.8px, transparent 1px)",
        backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
        backgroundPosition: `${pan.x % (28*zoom)}px ${pan.y % (28*zoom)}px`,
        opacity: 0.6,
        pointerEvents: "none",
      }}/>

      {/* Transform layer */}
      <div style={{
        position: "absolute", left: 0, top: 0,
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: "0 0",
      }}>
        <svg style={{
          position: "absolute", left: -2000, top: -2000,
          width: 6000, height: 6000, pointerEvents: "none", overflow: "visible",
        }}>
          <g transform="translate(2000, 2000)">
            {edgeData.map(e => (
              <path key={e.key}
                d={e.d}
                fill="none"
                stroke={e.active ? "var(--red)" : "#26262B"}
                strokeWidth={e.active ? 1.5 : 1}
                strokeDasharray={e.soft ? "3 3" : "0"}
                opacity={e.dim ? 0.35 : 1}
              />
            ))}
          </g>
        </svg>

        {nodes.map(n => (
          <NodeCard key={n.id} node={n}
            selected={selectedId === n.id}
            hovered={hoveredId === n.id}
            onMouseDown={(e) => onMouseDownNode(e, n)}
            onClick={(e) => { e.stopPropagation(); setSelectedId(n.id); }}
            onDoubleClick={(e) => { e.stopPropagation(); openZone(n.id); }}
            onMouseEnter={() => setHoveredId(n.id)}
            onMouseLeave={() => setHoveredId(null)}
          />
        ))}
      </div>

      {/* Bottom toolbar — minimal */}
      <div style={{
        position: "absolute", left: "50%", bottom: 16,
        transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 0,
        background: "var(--panel-2)",
        border: "1px solid var(--line-2)", borderRadius: 6,
        boxShadow: "var(--shadow-pop)",
        zIndex: 10,
        overflow: "hidden",
        fontFamily: "Pretendard Variable",
      }}>
        {[
          { label: "Idea" },
          { label: "Script" },
          { label: "Research" },
          { label: "Reference" },
          { label: "Thumb" },
        ].map((b, i) => (
          <button key={b.label} style={{
            padding: "7px 13px", borderRadius: 0,
            background: "transparent", border: "none",
            borderRight: "1px solid var(--line)",
            color: "var(--ink-2)", cursor: "pointer", fontSize: 11.5, fontWeight: 500,
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-3)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >+ {b.label}</button>
        ))}
        <button style={{
          padding: "7px 14px",
          background: "var(--red)", border: "none",
          color: "white", cursor: "pointer", fontSize: 11.5, fontWeight: 600,
        }}>AI ↗</button>
      </div>

      {/* Zoom indicator — bottom right, very subtle */}
      <div style={{
        position: "absolute", right: 14, bottom: 16,
        fontSize: 10.5, color: "var(--ink-4)",
        fontFamily: "JetBrains Mono, monospace",
        letterSpacing: 0.5,
      }}>
        {Math.round(zoom*100)}%
      </div>
    </div>
  );
};

const GraphView = ({ nodes, edges, selectedId, setSelectedId, openZone }) => {
  const W = 1100, H = 700;
  const minX = Math.min(...nodes.map(n => n.x)), maxX = Math.max(...nodes.map(n => n.x));
  const minY = Math.min(...nodes.map(n => n.y)), maxY = Math.max(...nodes.map(n => n.y));
  const sx = (x) => 80 + ((x - minX) / (maxX - minX || 1)) * (W - 160);
  const sy = (y) => 60 + ((y - minY) / (maxY - minY || 1)) * (H - 120);

  const sizeFor = (n) => n.type === "series" ? 14 : (n.type === "idea" ? 9 : 5);
  const colorFor = (n) => n.type === "series" ? "#FF2D2D" : (n.type === "idea" ? "#F4F4F5" : "#6E6E74");

  return (
    <div style={{ position: "relative", flex: 1, overflow: "hidden", background: "var(--bg)", display: "grid", placeItems: "center" }}>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        {edges.map((e, i) => {
          const a = nodes.find(n => n.id === e.from), b = nodes.find(n => n.id === e.to);
          if (!a || !b) return null;
          const active = selectedId && (selectedId === e.from || selectedId === e.to);
          return (
            <line key={i}
              x1={sx(a.x)} y1={sy(a.y)} x2={sx(b.x)} y2={sy(b.y)}
              stroke={active ? "#FF2D2D" : "#26262B"}
              strokeWidth={active ? 1.4 : 0.7}
              strokeDasharray={e.soft ? "2 3" : "0"}
              opacity={selectedId && !active ? 0.25 : 0.85}
            />
          );
        })}
        {nodes.map(n => {
          const r = sizeFor(n);
          const sel = selectedId === n.id;
          const dim = selectedId && !sel && !edges.some(e => (e.from === selectedId && e.to === n.id) || (e.to === selectedId && e.from === n.id));
          return (
            <g key={n.id} style={{ cursor: "pointer" }}
              onClick={() => setSelectedId(n.id)}
              onDoubleClick={() => openZone(n.id)}>
              {sel && <circle cx={sx(n.x)} cy={sy(n.y)} r={r + 6} fill="rgba(255,45,45,0.18)"/>}
              <circle cx={sx(n.x)} cy={sy(n.y)} r={r}
                fill={colorFor(n)}
                stroke="var(--bg)"
                strokeWidth={2}
                opacity={dim ? 0.2 : 1}
              />
              {(n.type === "series" || n.type === "idea") && (
                <text x={sx(n.x)} y={sy(n.y) + r + 14}
                  textAnchor="middle"
                  fill={sel ? "#FF4D4D" : (dim ? "#3A3A40" : "#9A9AA0")}
                  fontSize={n.type === "series" ? 11 : 10}
                  fontWeight={n.type === "series" ? 600 : 400}
                  fontFamily="Pretendard Variable"
                >{n.ep ? n.ep + " " + n.title : n.title}</text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{
        position: "absolute", left: 18, top: 18,
        fontSize: 10, color: "var(--ink-4)", letterSpacing: 0.5,
        textTransform: "uppercase", fontWeight: 600,
      }}>Graph · {nodes.length} nodes · {edges.length} links</div>
    </div>
  );
};

window.Canvas = Canvas;
