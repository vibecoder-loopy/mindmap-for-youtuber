import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  Bot,
  Brain,
  ChevronRight,
  CircleDot,
  FileAudio,
  FileText,
  GitBranch,
  Link,
  Mic,
  Play,
  Plus,
  Radar,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Youtube,
} from "lucide-react";
import "./styles.css";

const statusMeta = {
  Draft: { label: "초안", color: "#8ea0b7" },
  Research: { label: "리서치", color: "#72b6a1" },
  Script: { label: "대본", color: "#e7c267" },
  Shoot: { label: "촬영", color: "#c78ce5" },
  Live: { label: "공개", color: "#ff4d4d" },
};

const baseNodes = [
  { id: "hub", type: "Series", title: "AI 코딩 도구", x: 560, y: 320, score: 91, status: "Shoot" },
  { id: "ep1", type: "Video", title: "Cursor vs Copilot", x: 230, y: 150, score: 82, status: "Live", views: "82.4K" },
  { id: "ep2", type: "Video", title: "주말에 SaaS 만들기", x: 240, y: 370, score: 88, status: "Script", views: "예상 41K" },
  { id: "ep3", type: "Video", title: "Claude Code 가이드", x: 250, y: 585, score: 77, status: "Shoot", views: "예상 28K" },
  { id: "ep4", type: "Research", title: "AI 도구 가격 비교", x: 890, y: 145, score: 74, status: "Research" },
  { id: "ep5", type: "Gap", title: "AI 디버깅 클래스", x: 910, y: 370, score: 93, status: "Draft" },
  { id: "ep6", type: "Angle", title: "바이브 코딩의 한계", x: 895, y: 590, score: 86, status: "Draft" },
  { id: "ref1", type: "Reference", title: "Fireship / Primeagen 분석", x: 1160, y: 270, score: 69, status: "Research" },
];

const baseEdges = [
  ["hub", "ep1"],
  ["hub", "ep2"],
  ["hub", "ep3"],
  ["hub", "ep4"],
  ["hub", "ep5"],
  ["hub", "ep6"],
  ["ep4", "ref1"],
  ["ep2", "ep5"],
  ["ep3", "ep6"],
];

const featurePipelines = [
  {
    icon: FileText,
    title: "글 입력 → 자동 마인드맵",
    detail: "대본, 회의록, 아이디어를 주제/훅/근거/액션 노드로 자동 분해",
    signal: "구조화 정확도 92%",
  },
  {
    icon: FileAudio,
    title: "음성녹음 → 콘텐츠 구조화",
    detail: "녹음 내용을 챕터, 쇼츠 컷, 장면 리스트, TODO로 변환",
    signal: "11분 녹음 처리",
  },
  {
    icon: Youtube,
    title: "유튜브 링크 요약",
    detail: "레퍼런스 영상을 요약하고 내 채널 톤에 맞는 파생 주제 추천",
    signal: "레퍼런스 12개",
  },
  {
    icon: GitBranch,
    title: "영상 간 연관성 분석",
    detail: "기존 영상의 백링크, 시청자 관심사, 후속 에피소드 가능성 계산",
    signal: "연결 후보 18개",
  },
  {
    icon: Search,
    title: "유사 키워드 영상 분석",
    detail: "키워드별 경쟁 강도, 썸네일 패턴, 제목 포맷, 조회수 분포 비교",
    signal: "경쟁도 보통",
  },
  {
    icon: Users,
    title: "경쟁 채널 차이점",
    detail: "다른 유튜버 대비 포지셔닝, 빠진 키워드, 개선 방향 도출",
    signal: "차별점 5개",
  },
  {
    icon: BarChart3,
    title: "영상 성과 분석",
    detail: "CTR, 유지율, 댓글 반응을 다음 콘텐츠 의사결정으로 연결",
    signal: "성장 기회 +24%",
  },
];

const competitorVideos = [
  { channel: "Fireship", title: "AI coding stack in 2026", views: "1.4M", ctr: "9.8%", gap: "속도감은 강함, 깊이는 낮음" },
  { channel: "ThePrimeagen", title: "Debugging with AI agents", views: "482K", ctr: "7.1%", gap: "전문성 높음, 입문자 장벽 높음" },
  { channel: "국내 개발 채널 A", title: "Cursor로 앱 만들기", views: "126K", ctr: "6.6%", gap: "실험 과정 공개 부족" },
  { channel: "생산성 채널 B", title: "AI 툴 10개 비교", views: "94K", ctr: "5.9%", gap: "개발자 관점 약함" },
];

const recommendations = [
  { title: "Cursor + Claude Code로 48시간 MVP", reason: "기존 EP01과 EP02 사이 연결성이 높고 후속 클릭 동기가 강함", fit: 96 },
  { title: "AI 코딩 실패 사례 7가지", reason: "경쟁 채널 대비 경험 기반 반례 콘텐츠가 부족한 영역", fit: 91 },
  { title: "초보자가 AI에게 일을 맡기는 프롬프트 구조", reason: "회의록/스크립트 재가공으로 쇼츠 6개 분기 가능", fit: 88 },
];

const performance = [
  { label: "평균 CTR", value: "7.8%", delta: "+1.2%" },
  { label: "평균 유지율", value: "61%", delta: "+8%" },
  { label: "시리즈 전환", value: "34%", delta: "+11%" },
  { label: "다음 영상 후보", value: "18", delta: "+6" },
];

function App() {
  const [active, setActive] = useState("strategy");
  const [selectedNode, setSelectedNode] = useState("ep2");
  const [brief, setBrief] = useState("주말 동안 AI 코딩 도구로 실제 SaaS를 만들고, 실패 지점과 프롬프트 구조를 공개하는 영상");
  const [youtubeUrl, setYoutubeUrl] = useState("https://youtube.com/watch?v=reference");
  const selected = baseNodes.find((node) => node.id === selectedNode) ?? baseNodes[0];
  const generatedNodes = useMemo(() => buildGeneratedMap(brief), [brief]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Youtube size={16} /></div>
          <div>
            <strong>TubeMap Studio</strong>
            <span>Creator intelligence</span>
          </div>
        </div>

        <nav className="nav-list">
          {[
            ["strategy", Target, "전략 허브"],
            ["capture", Mic, "입력/녹음"],
            ["map", GitBranch, "마인드맵"],
            ["market", Radar, "키워드 분석"],
            ["performance", BarChart3, "성과 분석"],
          ].map(([id, Icon, label]) => (
            <button key={id} className={active === id ? "active" : ""} onClick={() => setActive(id)}>
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="channel-card">
          <span className="eyebrow">채널 방향</span>
          <strong>AI 코딩 실전형</strong>
          <p>빠른 데모보다 실제 완성 과정, 실패 복기, 수익화 검증에 강점이 있습니다.</p>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">테크 토크 KR</span>
            <h1>{active === "strategy" ? "콘텐츠 전략 허브" : sectionTitle(active)}</h1>
          </div>
          <div className="top-actions">
            <button className="ghost"><Search size={16} />검색</button>
            <button><Sparkles size={16} />AI 분석 실행</button>
          </div>
        </header>

        {active === "strategy" && (
          <StrategyView selected={selected} setActive={setActive} />
        )}

        {active === "capture" && (
          <CaptureView
            brief={brief}
            setBrief={setBrief}
            youtubeUrl={youtubeUrl}
            setYoutubeUrl={setYoutubeUrl}
            generatedNodes={generatedNodes}
          />
        )}

        {active === "map" && (
          <MapView selectedNode={selectedNode} setSelectedNode={setSelectedNode} selected={selected} />
        )}

        {active === "market" && (
          <MarketView youtubeUrl={youtubeUrl} setYoutubeUrl={setYoutubeUrl} />
        )}

        {active === "performance" && (
          <PerformanceView />
        )}
      </main>
    </div>
  );
}

function StrategyView({ selected, setActive }) {
  return (
    <div className="content-grid strategy-grid">
      <section className="panel hero-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Next best content</span>
            <h2>{recommendations[0].title}</h2>
          </div>
          <strong className="score">{recommendations[0].fit}</strong>
        </div>
        <p>{recommendations[0].reason}</p>
        <div className="hero-strip">
          <Thumbnail label="EP07" tone="red" />
          <div className="script-preview">
            <span>추천 구조</span>
            <strong>Hook → 48시간 제약 → 실패 로그 → 결제 붙이기 → 배운 점</strong>
            <p>기존 영상과 경쟁 영상의 빈 영역을 연결해 시리즈 다음 편으로 설계했습니다.</p>
          </div>
        </div>
        <div className="button-row">
          <button onClick={() => setActive("capture")}><FileText size={16} />브리프 만들기</button>
          <button className="ghost" onClick={() => setActive("map")}><GitBranch size={16} />맵에서 보기</button>
        </div>
      </section>

      <section className="panel">
        <PanelTitle icon={Brain} label="채널 맞춤 추천" />
        <div className="recommendation-list">
          {recommendations.map((item) => (
            <div className="recommendation" key={item.title}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.reason}</p>
              </div>
              <span>{item.fit}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <PanelTitle icon={Bot} label="상용 기능 파이프라인" />
        <div className="feature-grid">
          {featurePipelines.map(({ icon: Icon, title, detail, signal }) => (
            <article className="feature-item" key={title}>
              <Icon size={18} />
              <strong>{title}</strong>
              <p>{detail}</p>
              <span>{signal}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <PanelTitle icon={CircleDot} label="선택 노드" />
        <div className="node-summary">
          <strong>{selected.title}</strong>
          <p>{selected.type} · {statusMeta[selected.status].label}</p>
          <div className="meter"><i style={{ width: `${selected.score}%` }} /></div>
          <span>콘텐츠 적합도 {selected.score}/100</span>
        </div>
      </section>
    </div>
  );
}

function CaptureView({ brief, setBrief, youtubeUrl, setYoutubeUrl, generatedNodes }) {
  return (
    <div className="content-grid capture-grid">
      <section className="panel input-panel">
        <PanelTitle icon={FileText} label="글 입력 → 자동 마인드맵" />
        <textarea value={brief} onChange={(event) => setBrief(event.target.value)} />
        <div className="button-row">
          <button><Sparkles size={16} />마인드맵 생성</button>
          <button className="ghost"><Mic size={16} />녹음 시작</button>
        </div>
      </section>

      <section className="panel">
        <PanelTitle icon={Link} label="유튜브 링크 분석" />
        <input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} />
        <div className="analysis-result">
          <strong>요약 결과</strong>
          <p>레퍼런스 영상은 “AI 도구의 속도”를 강조합니다. 현재 채널에는 “실제 완성률과 실패 복기” 각도로 변환하는 것이 적합합니다.</p>
        </div>
      </section>

      <section className="panel wide">
        <PanelTitle icon={GitBranch} label="생성된 구조" />
        <div className="generated-map">
          {generatedNodes.map((node, index) => (
            <div className="generated-node" key={node.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{node.title}</strong>
              <p>{node.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MapView({ selectedNode, setSelectedNode, selected }) {
  const nodeMap = Object.fromEntries(baseNodes.map((node) => [node.id, node]));
  return (
    <div className="map-layout">
      <section className="map-canvas">
        <svg className="edges" viewBox="0 0 1280 720">
          {baseEdges.map(([from, to]) => {
            const a = nodeMap[from];
            const b = nodeMap[to];
            const active = selectedNode === from || selectedNode === to;
            return (
              <path
                key={`${from}-${to}`}
                d={`M ${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`}
                className={active ? "active" : ""}
              />
            );
          })}
        </svg>
        {baseNodes.map((node) => (
          <button
            key={node.id}
            className={`map-node ${selectedNode === node.id ? "selected" : ""}`}
            style={{ left: node.x, top: node.y }}
            onClick={() => setSelectedNode(node.id)}
          >
            <span>{node.type}</span>
            <strong>{node.title}</strong>
            <em>{node.score}/100</em>
          </button>
        ))}
      </section>

      <aside className="inspector panel">
        <PanelTitle icon={Target} label="노드 분석" />
        <Thumbnail label={selected.type === "Video" ? "EP" : "MAP"} tone={selected.status === "Live" ? "red" : "teal"} />
        <h2>{selected.title}</h2>
        <p>{selected.type} · {statusMeta[selected.status].label} · {selected.views ?? "기획 중"}</p>
        <div className="insight-list">
          <span>후속 콘텐츠 연결성 높음</span>
          <span>경쟁 영상 대비 실험 로그 차별화 가능</span>
          <span>쇼츠 3개, 롱폼 1개로 분기 추천</span>
        </div>
      </aside>
    </div>
  );
}

function MarketView({ youtubeUrl, setYoutubeUrl }) {
  return (
    <div className="content-grid market-grid">
      <section className="panel wide">
        <PanelTitle icon={Search} label="유사 키워드 영상 분석" />
        <div className="search-row">
          <input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} />
          <button><Youtube size={16} />분석</button>
        </div>
        <div className="competitor-table">
          {competitorVideos.map((video) => (
            <div className="competitor-row" key={video.title}>
              <Thumbnail label={video.channel.slice(0, 2).toUpperCase()} tone="neutral" />
              <div>
                <strong>{video.title}</strong>
                <p>{video.channel} · {video.gap}</p>
              </div>
              <span>{video.views}</span>
              <span>{video.ctr}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <PanelTitle icon={Users} label="차이점 및 개선 방향" />
        <div className="gap-list">
          <strong>내 채널이 가져갈 포지션</strong>
          <p>툴 소개보다 실제 프로젝트 완성률, 비용, 실패 로그, 수익화까지 이어지는 “현장형 AI 코딩”으로 차별화합니다.</p>
          <span>개선 1: 제목에 결과 지표 추가</span>
          <span>개선 2: 썸네일은 도구명보다 산출물 강조</span>
          <span>개선 3: 후속편을 영상 말미에 고정</span>
        </div>
      </section>
    </div>
  );
}

function PerformanceView() {
  return (
    <div className="content-grid performance-grid">
      <section className="panel wide">
        <PanelTitle icon={TrendingUp} label="영상 성과도 분석" />
        <div className="metric-grid">
          {performance.map((item) => (
            <div className="metric" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <em>{item.delta}</em>
            </div>
          ))}
        </div>
        <div className="chart">
          {[52, 68, 61, 79, 74, 88, 82, 91].map((height, index) => (
            <i key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
      </section>

      <section className="panel">
        <PanelTitle icon={Sparkles} label="다음 액션" />
        <div className="action-list">
          <button>유지율 하락 구간을 챕터로 분리 <ChevronRight size={15} /></button>
          <button>댓글 질문을 EP07 후보로 변환 <ChevronRight size={15} /></button>
          <button>CTR 낮은 썸네일 A/B 재생성 <ChevronRight size={15} /></button>
        </div>
      </section>
    </div>
  );
}

function PanelTitle({ icon: Icon, label }) {
  return (
    <div className="section-title">
      <Icon size={17} />
      <span>{label}</span>
    </div>
  );
}

function Thumbnail({ label, tone }) {
  return (
    <div className={`thumbnail ${tone}`}>
      <Play size={20} />
      <strong>{label}</strong>
    </div>
  );
}

function buildGeneratedMap(text) {
  const seed = text.length;
  return [
    { title: "핵심 주장", detail: seed > 30 ? "AI 도구는 결과보다 작업 지시 구조가 중요합니다." : "입력 글에서 핵심 메시지를 추출합니다." },
    { title: "시청자 문제", detail: "사이드프로젝트를 시작하지만 끝내지 못하는 병목을 정의합니다." },
    { title: "증거/레퍼런스", detail: "유튜브 링크와 기존 영상 성과를 근거 노드로 연결합니다." },
    { title: "영상 구성", detail: "훅, 전개, 데모, 실패 복기, CTA로 대본 초안을 만듭니다." },
    { title: "재활용 컷", detail: "쇼츠, 커뮤니티 글, 후속 에피소드 후보로 분기합니다." },
  ];
}

function sectionTitle(id) {
  return {
    capture: "입력과 녹음",
    map: "콘텐츠 마인드맵",
    market: "시장/경쟁 분석",
    performance: "성과 분석",
  }[id] ?? "콘텐츠 전략 허브";
}

createRoot(document.getElementById("root")).render(<App />);
