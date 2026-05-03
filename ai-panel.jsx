// Refined AI panel — quiet, no rainbow gradients
const AIPanel = ({ open, onClose, node }) => {
  if (!open) return null;

  const suggestions = node ? [
    { title: "Hooks", subtitle: "더 강한 훅 3안", items: [
      "주말에 SaaS 만들었더니 첫날에 결제가 들어왔습니다",
      "AI한테 시키면 끝? 망하는 사람들의 공통점",
      "사이드프로젝트 80%가 실패하는 이유, 데이터로 봤어요",
    ]},
    { title: "Titles", subtitle: "CTR 기준 후보", items: [
      "AI로 주말에 SaaS 만들기 (실제 매출 공개)",
      "Cursor + Claude로 48시간 사이드프로젝트",
      "주말 동안 SaaS 만들었더니 생긴 일",
    ]},
    { title: "Nodes", subtitle: "연결할 새 노드", items: [
      "Research · AI 코딩 도구 가격 비교 2025",
      "Script · B-roll 촬영 리스트",
      "Thumbnail · 노트북 + 매출 알림",
    ]},
  ] : [];

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0,
      width: 340,
      background: "var(--panel)",
      borderLeft: "1px solid var(--line)",
      boxShadow: "-12px 0 32px -12px rgba(0,0,0,0.5)",
      display: "flex", flexDirection: "column",
      zIndex: 40,
      animation: "slideAI 220ms cubic-bezier(.2,.8,.2,1)",
    }}>
      <style>{`@keyframes slideAI { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; }}`}</style>

      {/* Header */}
      <div style={{
        height: 38, padding: "0 14px",
        display: "flex", alignItems: "center", gap: 9,
        borderBottom: "1px solid var(--line)",
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--red)" }}/>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)" }}>AI</div>
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "JetBrains Mono, monospace" }}>v2.4</span>
        <button onClick={onClose} style={{
          width: 22, height: 22, borderRadius: 4,
          background: "transparent", border: "none",
          color: "var(--ink-3)", cursor: "pointer", fontSize: 16, lineHeight: 1,
        }}>×</button>
      </div>

      {/* Context */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Context</div>
        <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>
          {node?.title || "AI 코딩 도구 시리즈"}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
          {node?.ep || "Series"} · 채널 톤 학습됨
        </div>
      </div>

      {/* Suggestions */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {suggestions.map((s, i) => (
          <div key={i} style={{ padding: "16px 14px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "baseline", marginBottom: 10, gap: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink)", letterSpacing: 0.5, textTransform: "uppercase" }}>{s.title}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-4)" }}>{s.subtitle}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {s.items.map((it, j) => (
                <div key={j} style={{
                  padding: "10px 0",
                  borderTop: j === 0 ? "1px solid var(--line)" : "none",
                  borderBottom: "1px solid var(--line)",
                  fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5,
                  cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10,
                  transition: "color 120ms",
                }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--ink)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--ink-2)"}
                >
                  <span style={{ fontSize: 10, color: "var(--ink-4)", fontFamily: "JetBrains Mono, monospace", marginTop: 2, width: 14 }}>{String(j+1).padStart(2, "0")}</span>
                  <span style={{ flex: 1 }}>{it}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-4)" }}>↗</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Auto chapters */}
        {node && (
          <div style={{ padding: "16px 14px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Auto Chapters</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.55, marginBottom: 12 }}>
              스크립트 v3에서 챕터 7개를 추출했어요.
            </div>
            <button style={{
              width: "100%", padding: "9px 10px", borderRadius: 4,
              background: "var(--ink)", border: "none",
              color: "var(--bg)", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            }}>챕터 7개 생성</button>
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{ padding: 12, borderTop: "1px solid var(--line)" }}>
        <div style={{
          padding: "9px 11px", borderRadius: 5,
          background: "var(--bg-3)", border: "1px solid var(--line-2)",
          fontSize: 12, color: "var(--ink-3)",
        }}>
          이 시리즈에 어울리는 EP07 아이디어 5개...
        </div>
      </div>
    </div>
  );
};

window.AIPanel = AIPanel;
