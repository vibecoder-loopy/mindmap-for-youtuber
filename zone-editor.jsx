// Refined zone editor — newspaper-quality typography, monochrome
const ZoneEditor = ({ zone, node, onClose, fullscreen, setFullscreen }) => {
  if (!zone) return null;
  const md = SAMPLE_MD;

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0,
      width: fullscreen ? "100%" : "60%",
      background: "var(--bg)",
      borderLeft: "1px solid var(--line)",
      boxShadow: "-12px 0 32px -12px rgba(0,0,0,0.5)",
      display: "flex", flexDirection: "column",
      zIndex: 30,
      animation: "slideIn 220ms cubic-bezier(.2,.8,.2,1)",
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* Tab bar */}
      <div style={{
        height: 36, display: "flex", alignItems: "center",
        background: "var(--panel)", borderBottom: "1px solid var(--line)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "0 16px", height: "100%",
          background: "var(--bg)", position: "relative",
          fontSize: 11.5, color: "var(--ink-2)",
          fontFamily: "JetBrains Mono, monospace",
        }}>
          <span style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1, background: "var(--red)" }}/>
          {zone.name}
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--ink-3)" }}/>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 0, paddingRight: 8 }}>
          <button style={iconBtnZ}>Edit</button>
          <button style={{ ...iconBtnZ, background: "var(--bg-3)", color: "var(--ink)" }}>Split</button>
          <button style={iconBtnZ} onClick={() => setFullscreen(f => !f)}>{fullscreen ? "Collapse" : "Expand"}</button>
          <button style={{ ...iconBtnZ, marginLeft: 4 }} onClick={onClose}>×</button>
        </div>
      </div>

      {/* Split */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
        {/* SOURCE */}
        <div style={{
          overflow: "auto", padding: "24px 28px",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 12.5, lineHeight: 1.75,
          color: "var(--ink-2)",
          borderRight: "1px solid var(--line)",
          background: "var(--bg)",
        }}>
          <MarkdownSource src={md}/>
        </div>

        {/* PREVIEW */}
        <div style={{ overflow: "auto", padding: "32px 44px", background: "var(--bg)" }}>
          <MarkdownPreview src={md} node={node}/>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        height: 22, padding: "0 14px",
        display: "flex", alignItems: "center", gap: 16,
        borderTop: "1px solid var(--line)",
        background: "var(--panel)",
        fontSize: 10.5, color: "var(--ink-4)",
        fontFamily: "JetBrains Mono, monospace",
      }}>
        <span>1,840 chars</span>
        <span>11:24 est.</span>
        <div style={{ flex: 1 }}/>
        <span>Saved</span>
      </div>
    </div>
  );
};

const MarkdownSource = ({ src }) => {
  const lines = src.split("\n");
  return (
    <div>
      {lines.map((ln, i) => {
        let color = "var(--ink-2)";
        let bold = false;
        if (/^---/.test(ln)) color = "var(--ink-4)";
        else if (/^#{1,6}\s/.test(ln)) { color = "var(--ink)"; bold = true; }
        else if (/^>/.test(ln)) color = "var(--ink-3)";
        else if (/^-\s\[[ x]\]/.test(ln)) color = "var(--ink-2)";
        else if (/^\d{2}:\d{2}/.test(ln)) color = "var(--ink-3)";
        else if (/^[a-z_]+:/.test(ln)) color = "var(--red-2)";
        return (
          <div key={i} style={{ display: "flex" }}>
            <span style={{ width: 24, color: "var(--ink-4)", textAlign: "right", marginRight: 16, userSelect: "none", fontSize: 11 }}>{i+1}</span>
            <span style={{ color, fontWeight: bold ? 600 : 400, whiteSpace: "pre-wrap", flex: 1 }}>{ln || " "}</span>
          </div>
        );
      })}
    </div>
  );
};

const MarkdownPreview = ({ src }) => {
  const fmMatch = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const fm = fmMatch ? fmMatch[1] : "";
  const body = fmMatch ? fmMatch[2] : src;
  const fmLines = fm.split("\n").filter(Boolean).map(l => {
    const [k, ...rest] = l.split(":"); return [k.trim(), rest.join(":").trim()];
  });

  const blocks = [];
  const ls = body.split("\n");
  let i = 0;
  while (i < ls.length) {
    const ln = ls[i];
    if (/^# /.test(ln)) blocks.push({ t: "h1", v: ln.slice(2) });
    else if (/^## /.test(ln)) blocks.push({ t: "h2", v: ln.slice(3) });
    else if (/^> /.test(ln)) blocks.push({ t: "quote", v: ln.slice(2) });
    else if (/^- \[[ x]\] /.test(ln)) {
      const items = [];
      while (i < ls.length && /^- \[[ x]\] /.test(ls[i])) {
        items.push({ done: ls[i][3] === "x", text: ls[i].slice(6) }); i++;
      } blocks.push({ t: "todo", items }); continue;
    }
    else if (/^- /.test(ln)) {
      const items = [];
      while (i < ls.length && /^- /.test(ls[i])) { items.push(ls[i].slice(2)); i++; }
      blocks.push({ t: "ul", items }); continue;
    }
    else if (ln.trim()) blocks.push({ t: "p", v: ln });
    i++;
  }

  const renderInline = (text) => {
    const parts = []; let last = 0;
    const re = /\[\[([^\]]+)\]\]/g; let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const [target, label] = m[1].split("|");
      parts.push(<a key={m.index} style={{
        color: "var(--ink)", textDecoration: "none",
        borderBottom: "1px solid var(--red)", paddingBottom: 1,
        cursor: "pointer", fontWeight: 500,
      }}>{label || target}</a>);
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  return (
    <div style={{ maxWidth: 640, color: "var(--ink-2)", fontSize: 14.5, lineHeight: 1.75, fontFamily: "Pretendard Variable" }}>
      {fmLines.length > 0 && (
        <div style={{
          padding: "12px 0", marginBottom: 32,
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          fontSize: 11.5, fontFamily: "JetBrains Mono, monospace",
        }}>
          {fmLines.map(([k, v]) => (
            <div key={k} style={{ display: "flex", padding: "2px 0" }}>
              <span style={{ width: 90, color: "var(--ink-4)" }}>{k}</span>
              <span style={{ color: "var(--ink-2)" }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {blocks.map((b, idx) => {
        if (b.t === "h1") return (
          <h1 key={idx} style={{
            fontSize: 32, fontWeight: 800, letterSpacing: -0.8,
            margin: "0 0 32px", lineHeight: 1.15, color: "var(--ink)",
          }}>{b.v}</h1>
        );
        if (b.t === "h2") return (
          <h2 key={idx} style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase",
            margin: "32px 0 12px", color: "var(--ink-3)",
          }}>{b.v}</h2>
        );
        if (b.t === "quote") return (
          <blockquote key={idx} style={{
            margin: "16px 0", paddingLeft: 18,
            borderLeft: "2px solid var(--red)",
            color: "var(--ink-2)", fontSize: 15.5, lineHeight: 1.7,
            fontWeight: 400, fontStyle: "normal",
          }}>{renderInline(b.v)}</blockquote>
        );
        if (b.t === "todo") return (
          <ul key={idx} style={{ listStyle: "none", padding: 0, margin: "8px 0 16px" }}>
            {b.items.map((it, j) => (
              <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "4px 0", fontSize: 14 }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 2, marginTop: 5, flexShrink: 0,
                  border: `1px solid ${it.done ? "var(--ink-3)" : "var(--line-2)"}`,
                  background: it.done ? "var(--ink-3)" : "transparent",
                  display: "grid", placeItems: "center",
                  color: "var(--bg)", fontSize: 9, fontWeight: 800,
                }}>{it.done && "✓"}</span>
                <span style={{ color: it.done ? "var(--ink-4)" : "var(--ink)", textDecoration: it.done ? "line-through" : "none" }}>{renderInline(it.text)}</span>
              </li>
            ))}
          </ul>
        );
        if (b.t === "ul") return (
          <ul key={idx} style={{ paddingLeft: 0, margin: "8px 0 16px", listStyle: "none" }}>
            {b.items.map((it, j) => (
              <li key={j} style={{ padding: "3px 0", paddingLeft: 14, position: "relative", color: "var(--ink-2)" }}>
                <span style={{ position: "absolute", left: 0, top: "0.6em", width: 4, height: 1, background: "var(--ink-4)" }}/>
                {renderInline(it)}
              </li>
            ))}
          </ul>
        );
        if (b.t === "p") return <p key={idx} style={{ margin: "12px 0", color: "var(--ink-2)" }}>{renderInline(b.v)}</p>;
        return null;
      })}
    </div>
  );
};

const iconBtnZ = {
  height: 26, padding: "0 10px", borderRadius: 4,
  background: "transparent", border: "none",
  color: "var(--ink-3)", cursor: "pointer",
  fontSize: 11, fontWeight: 500,
  fontFamily: "Pretendard Variable",
};

window.ZoneEditor = ZoneEditor;
