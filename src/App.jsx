import {
  BaseEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  getStraightPath,
  useInternalNode,
  useReactFlow,
} from "@xyflow/react";
import {
  Bot,
  Braces,
  FileText,
  GitBranch,
  Maximize2,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Save,
  Send,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { layoutWithDagre, layoutWithForce } from "./layouts.js";

const STORAGE_KEY = "tubemap-state-v2";
const PROVIDER_PRESETS = {
  codex: { label: "Codex CLI", command: "codex", args: "exec --json -m gpt-5.2" },
  claude: { label: "Claude CLI", command: "claude", args: "-p --output-format json" },
  custom: { label: "커스텀", command: "", args: "" },
};
const DEFAULT_AI_SETTINGS = {
  provider: "codex",
  command: "codex",
  args: "exec --json -m gpt-5.2",
  cwd: "",
  timeoutMs: 60000,
  jsonMode: true,
};

const KNOWN_ACTION_TYPES = new Set([
  "create_node",
  "update_node",
  "delete_node",
  "create_edge",
  "delete_edge",
  "open_markdown",
  "update_markdown",
  "delete_markdown",
]);

const NODE_KINDS = [
  "Channel",
  "Series",
  "Video",
  "Idea",
  "Script",
  "Research",
  "Reference",
  "Competitor",
  "Keyword",
  "Performance",
  "Todo",
];

const KIND_COLORS = {
  Channel: "#ff2d2d",
  Series: "#f4f4f5",
  Video: "#b8b8bc",
  Idea: "#f4f4f5",
  Script: "#8f8f96",
  Research: "#7a7a82",
  Reference: "#6e6e74",
  Competitor: "#ff4d4d",
  Keyword: "#b8b8bc",
  Performance: "#8f8f96",
  Todo: "#6e6e74",
};

const KIND_LABELS = {
  Channel: "채널",
  Series: "시리즈",
  Video: "영상",
  Idea: "아이디어",
  Script: "대본",
  Research: "리서치",
  Reference: "레퍼런스",
  Competitor: "경쟁",
  Keyword: "키워드",
  Performance: "성과",
  Todo: "할 일",
};

const INITIAL_NODES = [
  {
    id: "channel",
    title: "테크 토크 KR",
    kind: "Channel",
    summary: "AI 코딩 도구 시리즈의 채널 허브",
    position: { x: 80, y: 120 },
  },
  {
    id: "ideas",
    title: "다음 영상 아이디어",
    kind: "Idea",
    summary: "훅, 제목, 썸네일 후보 정리",
    position: { x: 430, y: 60 },
  },
  {
    id: "competitors",
    title: "경쟁 채널 리서치",
    kind: "Competitor",
    summary: "비슷한 채널과 차별점을 추적",
    position: { x: 440, y: 230 },
  },
  {
    id: "script",
    title: "EP02 대본 초안",
    kind: "Script",
    summary: "대본과 챕터 구조를 정리",
    position: { x: 780, y: 140 },
  },
];

const INITIAL_EDGES = [
  { id: "channel-ideas", source: "channel", target: "ideas", label: "inspires" },
  { id: "channel-competitors", source: "channel", target: "competitors", label: "compares" },
  { id: "ideas-script", source: "ideas", target: "script", label: "becomes" },
];

const INITIAL_MARKDOWNS = {
  channel:
    "---\ntype: channel\nstatus: active\n---\n# 테크 토크 KR\n\n- 핵심 주제: AI 코딩 도구, 사이드프로젝트, 개발 생산성\n- 반복 포맷: 실제 제작 과정 공개, 실패/개선 포인트 분석\n- 강한 영상: 실험 결과와 숫자가 명확한 콘텐츠\n\n[[다음 영상 아이디어]]와 [[경쟁 채널 리서치]]를 연결해서 다음 기획을 정리한다.\n",
  ideas:
    "---\ntype: idea\nstatus: draft\n---\n# 다음 영상 아이디어\n\n## 후보\n\n- 시청자가 바로 클릭할 수 있는 문제 중심 제목\n- 경쟁 채널과 다른 관점\n- 썸네일 문구는 네 단어 이하\n\n[[EP02 대본 초안]]으로 발전시킬 아이디어를 고른다.\n",
  competitors:
    "# 경쟁 채널 리서치\n\n- 경쟁 채널:\n- 잘 된 영상:\n- 내가 가져갈 차별점:\n\n[[테크 토크 KR]]과 비교한다.\n",
  script:
    "# EP02 대본 초안\n\n## Hook\n\n> 주말에 AI로 SaaS를 만들면 정말 출시까지 갈 수 있을까?\n\n## Chapters\n\n- [ ] 문제 제기\n- [ ] 도구 선택\n- [ ] 실제 제작 과정\n- [ ] 실패한 프롬프트\n- [ ] 결과 공개\n\n## CTA\n",
};

function createInitialState() {
  return {
    nodes: INITIAL_NODES,
    edges: INITIAL_EDGES,
    markdowns: INITIAL_MARKDOWNS,
    selectedNodeId: "channel",
    view: "map",
    panelOpen: true,
    panelMaximized: false,
    composerLog: [],
    hasOnboarded: false,
    settings: DEFAULT_AI_SETTINGS,
  };
}

function normalizeAiSettings(settings = {}) {
  const provider = settings.provider || (settings.command?.startsWith("claude") ? "claude" : "codex");
  const command = settings.command?.trim() || PROVIDER_PRESETS[provider]?.command || DEFAULT_AI_SETTINGS.command;
  let args = settings.args?.trim() || PROVIDER_PRESETS[provider]?.args || DEFAULT_AI_SETTINGS.args;
  if (command === "codex" && !/(^|\s)-m(\s|=)|(^|\s)--model(\s|=)/.test(args)) {
    args = `${args} -m gpt-5.2`;
  }
  return {
    ...DEFAULT_AI_SETTINGS,
    ...settings,
    provider,
    command,
    args,
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = createInitialState();
    if (!saved) return initial;
    const parsed = JSON.parse(saved);
    return {
      ...initial,
      ...parsed,
      settings: normalizeAiSettings(parsed.settings),
    };
  } catch {
    return createInitialState();
  }
}

function TubeNode({ data, selected }) {
  return (
    <div className={`tube-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-topline">
        <span className="node-kind-dot" style={{ background: data.color }} />
        <span className="node-kind">{data.label}</span>
        <span className="node-status">{data.status}</span>
      </div>
      <div className="node-title">{data.title}</div>
      <div className="node-summary">{data.summary}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function FloatingEdge({ id, source, target, style, data }) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;
  const sx = (sourceNode.internals.positionAbsolute?.x ?? sourceNode.position?.x ?? 0) + (sourceNode.measured?.width ?? 0) / 2;
  const sy = (sourceNode.internals.positionAbsolute?.y ?? sourceNode.position?.y ?? 0) + (sourceNode.measured?.height ?? 0) / 2;
  const tx = (targetNode.internals.positionAbsolute?.x ?? targetNode.position?.x ?? 0) + (targetNode.measured?.width ?? 0) / 2;
  const ty = (targetNode.internals.positionAbsolute?.y ?? targetNode.position?.y ?? 0) + (targetNode.measured?.height ?? 0) / 2;
  const [edgePath] = getStraightPath({ sourceX: sx, sourceY: sy, targetX: tx, targetY: ty });
  return <BaseEdge id={id} path={edgePath} style={style} interactionWidth={data?.interactionWidth ?? 14} />;
}

const EDGE_TYPES = { floating: FloatingEdge };

function GraphDot({ data, selected }) {
  const size = data.size ?? 11;
  const stateClass = selected
    ? "is-selected"
    : data.connected
      ? "is-connected"
      : data.hasSelection
        ? "is-dim"
        : "";
  return (
    <div className={`graph-dot ${stateClass}`} style={{ width: size, height: size }}>
      <span className="graph-dot-circle" style={{ background: data.color }} />
      <span className="graph-dot-label">{data.title}</span>
      <Handle type="target" position={Position.Top} className="graph-dot-handle" />
      <Handle type="source" position={Position.Top} className="graph-dot-handle" />
    </div>
  );
}

const NODE_TYPES = { tube: TubeNode, dot: GraphDot };

function CanvasArea({
  sourceNodes,
  edges,
  view,
  onConnect,
  onSelectNode,
  onNodePositionsCommit,
  onEdgesChange,
  instanceRef,
}) {
  const reactFlow = useReactFlow();
  const [flowNodes, setFlowNodes] = useState(sourceNodes);

  useEffect(() => {
    instanceRef.current = reactFlow;
  }, [reactFlow, instanceRef]);

  useEffect(() => {
    setFlowNodes((current) => {
      const byId = new Map(current.map((node) => [node.id, node]));
      return sourceNodes.map((incoming) => {
        const existing = byId.get(incoming.id);
        if (!existing) return incoming;
        return {
          ...incoming,
          measured: existing.measured ?? incoming.measured,
          width: existing.width ?? incoming.width,
          height: existing.height ?? incoming.height,
        };
      });
    });
  }, [sourceNodes]);

  const handleNodesChange = useCallback(
    (changes) => {
      setFlowNodes((current) => applyNodeChanges(changes, current));
      const positionCommits = changes
        .filter((change) => change.type === "position" && change.position && change.dragging === false)
        .map((change) => ({ id: change.id, position: change.position }));
      if (positionCommits.length) onNodePositionsCommit(positionCommits);
    },
    [onNodePositionsCommit],
  );

  const isGraph = view === "graph";

  return (
    <div className={`flow-stage ${isGraph ? "is-graph" : "is-map"}`}>
      <ReactFlow
        nodes={flowNodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onNodeDoubleClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={isGraph ? () => onSelectNode(null) : undefined}
        nodesConnectable={!isGraph}
        edgesFocusable={!isGraph}
        elementsSelectable
        minZoom={isGraph ? 0.4 : 0.2}
        maxZoom={isGraph ? 2.5 : 4}
        proOptions={{ hideAttribution: true }}
        fitView
      >
        {!isGraph && <Background color="#1f1f23" gap={28} />}
        <Controls showInteractive={false} />
        {!isGraph && (
          <MiniMap nodeColor={(node) => node.data?.color || "#94a3b8"} maskColor="rgba(10, 10, 11, 0.72)" />
        )}
      </ReactFlow>
      {isGraph && <div className="graph-vignette" aria-hidden />}
    </div>
  );
}

function nodeToFlowNode(node, selectedNodeId, view, graphMeta) {
  const isGraph = view === "graph";
  const position = isGraph ? graphMeta?.positions?.get(node.id) || node.position : node.position;
  const degree = graphMeta?.degree?.get(node.id) || 0;
  const size = isGraph ? clamp(8 + degree * 2.2, 8, 22) : undefined;
  const connected = isGraph && graphMeta?.connectedToSelected?.has(node.id);
  const hasSelection = isGraph && Boolean(selectedNodeId);
  return {
    id: node.id,
    type: isGraph ? "dot" : "tube",
    position,
    data: {
      title: node.title,
      kind: node.kind,
      label: KIND_LABELS[node.kind] || node.kind,
      summary: node.summary || "",
      color: KIND_COLORS[node.kind] || "#94a3b8",
      status: statusForNode(node),
      size,
      connected,
      hasSelection,
      degree,
    },
    selected: node.id === selectedNodeId,
    draggable: !isGraph,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function statusForNode(node) {
  if (node.kind === "Channel") return "active";
  if (node.kind === "Script") return "draft";
  if (node.kind === "Todo") return "todo";
  if (node.kind === "Performance") return "review";
  return "idea";
}

function parseWikiLinks(markdown) {
  const matches = markdown.matchAll(/\[\[([^\]]+)\]\]/g);
  return [...matches].map((match) => match[1].trim()).filter(Boolean);
}

function getRelations(nodes, edges, markdowns, selectedNodeId) {
  const selected = nodes.find((node) => node.id === selectedNodeId);
  if (!selected) {
    return { incoming: [], outgoing: [], linked: [], backlinks: [], wikiLinks: [] };
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const byTitle = new Map(nodes.map((node) => [node.title.toLowerCase(), node]));
  const incoming = edges.filter((edge) => edge.target === selected.id).map((edge) => ({ edge, node: byId.get(edge.source) })).filter((item) => item.node);
  const outgoing = edges.filter((edge) => edge.source === selected.id).map((edge) => ({ edge, node: byId.get(edge.target) })).filter((item) => item.node);
  const directIds = new Set([...incoming, ...outgoing].map((item) => item.node.id));
  const wikiLinks = parseWikiLinks(markdowns[selected.id] || "")
    .map((title) => byTitle.get(title.toLowerCase()))
    .filter(Boolean);
  const backlinks = nodes
    .filter((node) => node.id !== selected.id)
    .filter((node) => parseWikiLinks(markdowns[node.id] || "").some((title) => title.toLowerCase() === selected.title.toLowerCase()));

  return {
    incoming,
    outgoing,
    linked: nodes.filter((node) => directIds.has(node.id)),
    backlinks,
    wikiLinks,
  };
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-mark">T</div>
      <div className="loading-copy">
        <span>TubeMap</span>
        <strong>마인드맵 워크스페이스를 여는 중</strong>
      </div>
      <div className="loading-bar">
        <span />
      </div>
    </div>
  );
}

function WorkspaceSidebar({ nodes, edges, markdowns, selectedNodeId, onSelectNode }) {
  const groups = [
    { title: "채널", kinds: ["Channel", "Series"] },
    { title: "제작", kinds: ["Idea", "Script", "Todo"] },
    { title: "리서치", kinds: ["Research", "Reference", "Competitor", "Keyword", "Performance", "Video"] },
  ];

  const counts = {
    idea: nodes.filter((node) => node.kind === "Idea").length,
    draft: nodes.filter((node) => node.kind === "Script").length,
    review: nodes.filter((node) => node.kind === "Performance" || node.kind === "Competitor").length,
    todo: nodes.filter((node) => node.kind === "Todo").length,
  };

  return (
    <aside className="workspace-sidebar">
      <div className="sidebar-section-title">Workspace</div>
      <div className="zone-list">
        {groups.map((group) => {
          const items = nodes.filter((node) => group.kinds.includes(node.kind));
          if (!items.length) return null;
          return (
            <section key={group.title}>
              <h3>{group.title}</h3>
              {items.map((node) => (
                <button
                  key={node.id}
                  className={selectedNodeId === node.id ? "active" : ""}
                  onClick={() => onSelectNode(node.id)}
                >
                  <span className="zone-dot">·</span>
                  <span>{node.title}</span>
                  {markdowns[node.id] && <small>md</small>}
                </button>
              ))}
            </section>
          );
        })}
      </div>

      <div className="pipeline-panel">
        <div className="sidebar-section-title">Pipeline</div>
        {[
          ["idea", "아이디어"],
          ["draft", "대본"],
          ["review", "검토"],
          ["todo", "할 일"],
        ].map(([key, label]) => (
          <div key={key} className="pipeline-row">
            <span />
            <em>{label}</em>
            <strong>{counts[key]}</strong>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="avatar">J</div>
        <span>로컬 워크스페이스</span>
        <small>{nodes.length}/{edges.length}</small>
      </div>
    </aside>
  );
}

function MarkdownPreview({ markdown }) {
  const lines = markdown.split("\n");
  return (
    <div className="markdown-preview">
      {lines.map((line, index) => {
        if (/^---/.test(line)) return <div key={index} className="md-rule" />;
        if (/^# /.test(line)) return <h1 key={index}>{renderInline(line.slice(2))}</h1>;
        if (/^## /.test(line)) return <h2 key={index}>{renderInline(line.slice(3))}</h2>;
        if (/^> /.test(line)) return <blockquote key={index}>{renderInline(line.slice(2))}</blockquote>;
        if (/^- \[[ x]\] /.test(line)) {
          const done = line[3] === "x";
          return (
            <div key={index} className={`md-task ${done ? "done" : ""}`}>
              <span>{done ? "✓" : ""}</span>
              <p>{renderInline(line.slice(6))}</p>
            </div>
          );
        }
        if (/^- /.test(line)) return <p key={index} className="md-list">{renderInline(line.slice(2))}</p>;
        if (/^[a-z_]+:/.test(line)) return <p key={index} className="md-meta">{line}</p>;
        if (!line.trim()) return <div key={index} className="md-space" />;
        return <p key={index}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = [];
  let last = 0;
  const re = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<span key={match.index} className="wikilink">{match[1]}</span>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownPanel({
  node,
  markdown,
  relations,
  onChange,
  onClose,
  onToggleMax,
  maximized,
  onSelectNode,
  onDeleteMarkdown,
}) {
  if (!node) {
    return (
      <aside className="markdown-panel empty">
        <button className="icon-button panel-close" onClick={onClose} title="Close panel">
          <PanelRightClose size={18} />
        </button>
        <FileText size={28} />
        <p>노드를 선택하면 Markdown zone이 열립니다.</p>
      </aside>
    );
  }

  const relationItems = [
    ...relations.outgoing.map((item) => ({ label: "out", node: item.node, edge: item.edge })),
    ...relations.incoming.map((item) => ({ label: "in", node: item.node, edge: item.edge })),
  ];
  const markdownRelationItems = [
    ...relations.wikiLinks.map((linkedNode) => ({ key: `wikilink-${linkedNode.id}`, label: "[[ ]]", node: linkedNode })),
    ...relations.backlinks.map((linkedNode) => ({ key: `backlink-${linkedNode.id}`, label: "back", node: linkedNode })),
  ];

  return (
    <aside className={`markdown-panel ${maximized ? "maximized" : ""}`}>
      <header className="panel-header">
        <div>
          <span className="eyebrow">{KIND_LABELS[node.kind] || node.kind}</span>
          <h2>{node.title}</h2>
        </div>
        <div className="panel-actions">
          <button className="icon-button" onClick={onToggleMax} title="Toggle panel size">
            <Maximize2 size={17} />
          </button>
          <button className="icon-button" onClick={onClose} title="Close panel">
            <PanelRightClose size={18} />
          </button>
        </div>
      </header>

      <section className="relationship-strip">
        <div>
          <span>{relations.incoming.length}</span>
          <small>들어오는 링크</small>
        </div>
        <div>
          <span>{relations.outgoing.length}</span>
          <small>나가는 링크</small>
        </div>
        <div>
          <span>{relations.backlinks.length}</span>
          <small>백링크</small>
        </div>
      </section>

      <div className="relation-list">
        <div className="section-label">
          <GitBranch size={14} />
          노드 관계
        </div>
        {relationItems.length ? (
          relationItems.map((item) => (
            <button key={`${item.label}-${item.node.id}`} onClick={() => onSelectNode(item.node.id)}>
              <span>{item.label}</span>
              {item.node.title}
            </button>
          ))
        ) : (
          <p>아직 직접 연결된 노드가 없습니다.</p>
        )}
      </div>

      <div className="relation-list compact">
        <div className="section-label">
          <Network size={14} />
          위키링크와 백링크
        </div>
        {markdownRelationItems.length ? (
          markdownRelationItems.map((item) => (
            <button key={item.key} onClick={() => onSelectNode(item.node.id)}>
              <span>{item.label}</span>
              {item.node.title}
            </button>
          ))
        ) : (
          <p>아직 Markdown 링크가 없습니다.</p>
        )}
      </div>

      <div className="markdown-split">
        <textarea
          className="markdown-editor"
          value={markdown}
          onChange={(event) => onChange(event.target.value)}
          spellCheck="false"
        />
        <MarkdownPreview markdown={markdown} />
      </div>

      <footer className="panel-footer">
        <button className="text-button" onClick={() => onChange(markdown)}>
          <Save size={16} />
          로컬 저장됨
        </button>
        <button className="text-button danger" onClick={onDeleteMarkdown}>
          <Trash2 size={16} />
          MD 삭제
        </button>
      </footer>
    </aside>
  );
}

function AiComposer({ settings, setSettings, onSubmit, log, pending }) {
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const submit = () => {
    if (pending) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setMessage("");
  };

  const providerLabel = PROVIDER_PRESETS[settings.provider]?.label || settings.command || "AI";

  return (
    <div className="composer-shell">
      {showSettings && (
        <div className="settings-popover">
          <label>
            AI 프로바이더
            <select
              value={settings.provider || "codex"}
              onChange={(event) => {
                const provider = event.target.value;
                const preset = PROVIDER_PRESETS[provider];
                setSettings({
                  ...settings,
                  provider,
                  ...(provider !== "custom" && preset ? { command: preset.command, args: preset.args } : {}),
                });
              }}
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.label}</option>
              ))}
            </select>
          </label>
          <label>
            AI 커맨드
            <input value={settings.command} onChange={(event) => setSettings({ ...settings, command: event.target.value, provider: "custom" })} placeholder="codex" />
          </label>
          <label>
            AI 인자
            <input value={settings.args} onChange={(event) => setSettings({ ...settings, args: event.target.value, provider: "custom" })} placeholder="exec --json" />
          </label>
          <label>
            작업 폴더
            <input value={settings.cwd} onChange={(event) => setSettings({ ...settings, cwd: event.target.value })} placeholder="프로젝트 폴더" />
          </label>
          <label>
            타임아웃 ms
            <input
              type="number"
              value={settings.timeoutMs}
              onChange={(event) => setSettings({ ...settings, timeoutMs: Number(event.target.value) })}
            />
          </label>
        </div>
      )}
      <div className="composer-log">
        {log.slice(-2).map((item) => (
          <div key={item.id} className={item.type}>
            {item.message}
          </div>
        ))}
        {pending && (
          <div className="pending" role="status" aria-live="polite">
            <span className="pending-dots"><span /><span /><span /></span>
            {providerLabel} 응답 생성 중...
          </div>
        )}
      </div>
      <div className={`composer ${pending ? "pending" : ""}`}>
        <Bot size={19} />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={pending ? `${providerLabel} 응답 대기 중...` : "AI에게 마인드맵 수정 요청..."}
          disabled={pending}
        />
        <button className="icon-button" onClick={() => setShowSettings(!showSettings)} title="AI CLI settings" disabled={pending}>
          <Settings size={18} />
        </button>
        <button className="send-button" onClick={submit} title="Send" disabled={pending}>
          {pending ? <span className="send-spinner" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}

function Onboarding({ onCreate }) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="brand-mark">
          <Sparkles size={19} />
          TubeMap
        </div>
        <h1>첫 콘텐츠 맵 만들기</h1>
        <div className="onboarding-grid">
          <label>
            YouTube URL
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtube.com/..." />
          </label>
          <label>
            채널/영상 메모
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="채널 설명, 영상 설명, transcript 일부, 목표를 붙여넣으세요."
            />
          </label>
        </div>
        <button className="primary-button" onClick={() => onCreate(url, notes)}>
          Starter Map 생성
        </button>
      </div>
    </div>
  );
}

function createStarterMap(url, notes) {
  const hasContext = notes.trim().length > 0;
  const channelTitle = url.trim() ? "가져온 채널" : "내 YouTube 채널";
  const nodes = [
    { id: "channel", title: channelTitle, kind: "Channel", summary: url || "채널 허브", position: { x: 70, y: 145 } },
    { id: "top-videos", title: "고성과 영상", kind: "Performance", summary: "성과가 좋았던 영상 패턴", position: { x: 380, y: 45 } },
    { id: "keywords", title: "반복 키워드", kind: "Keyword", summary: "반복되는 주제와 표현", position: { x: 395, y: 205 } },
    { id: "competitors", title: "경쟁 채널", kind: "Competitor", summary: "비교할 채널과 포맷", position: { x: 720, y: 80 } },
    { id: "ideas", title: "추천 아이디어", kind: "Idea", summary: "다음 제작 후보", position: { x: 725, y: 250 } },
    { id: "todo", title: "다음 제작 TODO", kind: "Todo", summary: "바로 실행할 작업", position: { x: 1040, y: 165 } },
  ];
  const edges = [
    { id: "channel-top-videos", source: "channel", target: "top-videos", label: "review" },
    { id: "channel-keywords", source: "channel", target: "keywords", label: "extract" },
    { id: "keywords-ideas", source: "keywords", target: "ideas", label: "expand" },
    { id: "competitors-ideas", source: "competitors", target: "ideas", label: "differentiate" },
    { id: "ideas-todo", source: "ideas", target: "todo", label: "ship" },
  ];
  const markdowns = {
    channel: `# ${channelTitle}\n\nURL: ${url || "없음"}\n\n## 제공된 맥락\n\n${hasContext ? notes : "- 채널 설명, 영상 메모, transcript 일부를 여기에 추가하세요."}\n\n[[고성과 영상]]\n[[반복 키워드]]\n`,
    "top-videos": "# 고성과 영상\n\n- 제목:\n- 훅:\n- 포맷:\n- 잘 된 이유:\n",
    keywords: "# 반복 키워드\n\n- 키워드:\n- 시청자 문제:\n- 관련 포맷:\n\n[[추천 아이디어]]\n",
    competitors: "# 경쟁 채널\n\n- 채널:\n- 강한 영상:\n- 우리가 가져갈 차별점:\n\n[[추천 아이디어]]\n",
    ideas: "# 추천 아이디어\n\n- 아이디어:\n- 썸네일 약속:\n- 오프닝 훅:\n\n[[다음 제작 TODO]]\n",
    todo: "# 다음 제작 TODO\n\n- [ ] 아이디어 하나 선택\n- [ ] 7개 챕터 초안\n- [ ] 레퍼런스 수집\n",
  };

  return { nodes, edges, markdowns, selectedNodeId: "channel", panelOpen: true };
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiPending, setAiPending] = useState(false);
  const reactFlowInstance = useRef(null);

  useEffect(() => {
    if (!state.hasOnboarded) setShowOnboarding(true);
    const timer = window.setTimeout(() => setLoading(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const normalized = normalizeAiSettings(state.settings);
    if (normalized.command !== state.settings.command || normalized.args !== state.settings.args) {
      setState((current) => ({
        ...current,
        settings: normalizeAiSettings(current.settings),
      }));
    }
  }, [state.settings.command, state.settings.args]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const selectedNode = state.nodes.find((node) => node.id === state.selectedNodeId);
  const relations = useMemo(
    () => getRelations(state.nodes, state.edges, state.markdowns, state.selectedNodeId),
    [state.nodes, state.edges, state.markdowns, state.selectedNodeId],
  );
  const graphLayout = useMemo(() => {
    if (state.view !== "graph") return null;
    const degree = new Map();
    for (const edge of state.edges) {
      degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
    }
    const positions = layoutWithForce(state.nodes, state.edges);
    return { degree, positions };
  }, [state.view, state.nodes, state.edges]);

  const connectedToSelected = useMemo(() => {
    if (state.view !== "graph" || !state.selectedNodeId) return null;
    const set = new Set();
    for (const edge of state.edges) {
      if (edge.source === state.selectedNodeId) set.add(edge.target);
      if (edge.target === state.selectedNodeId) set.add(edge.source);
    }
    return set;
  }, [state.view, state.edges, state.selectedNodeId]);

  const graphMeta = useMemo(() => {
    if (!graphLayout) return null;
    return { ...graphLayout, connectedToSelected };
  }, [graphLayout, connectedToSelected]);
  const flowNodes = useMemo(
    () => state.nodes.map((node) => nodeToFlowNode(node, state.selectedNodeId, state.view, graphMeta)),
    [state.nodes, state.selectedNodeId, state.view, graphMeta],
  );
  const flowEdges = useMemo(() => {
    if (state.view !== "graph") return state.edges;
    const selectedId = state.selectedNodeId;
    return state.edges.map((edge) => {
      const touchesSelected = selectedId && (edge.source === selectedId || edge.target === selectedId);
      const dimmed = selectedId && !touchesSelected;
      return {
        ...edge,
        label: undefined,
        type: "floating",
        animated: false,
        style: {
          stroke: touchesSelected
            ? "oklch(0.66 0.21 25 / 0.78)"
            : dimmed
              ? "oklch(0.85 0.01 60 / 0.04)"
              : "oklch(0.85 0.01 60 / 0.11)",
          strokeWidth: touchesSelected ? 1.5 : 0.9,
          transition: "stroke 320ms cubic-bezier(0.22, 1, 0.36, 1), stroke-width 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        },
      };
    });
  }, [state.edges, state.view, state.selectedNodeId]);

  const setSettings = (settings) => setState((current) => ({ ...current, settings }));

  const commitNodePositions = useCallback((commits) => {
    setState((current) => {
      if (current.view !== "map") return current;
      const positionMap = new Map(commits.map((commit) => [commit.id, commit.position]));
      return {
        ...current,
        nodes: current.nodes.map((node) => (positionMap.has(node.id) ? { ...node, position: positionMap.get(node.id) } : node)),
      };
    });
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setState((current) => ({ ...current, edges: applyEdgeChanges(changes, current.edges) }));
  }, []);

  const onConnect = useCallback((connection) => {
    setState((current) => ({
      ...current,
      edges: addEdge({ ...connection, id: `${connection.source}-${connection.target}-${Date.now()}` }, current.edges),
    }));
  }, []);

  const selectNode = (nodeId) => {
    setState((current) => ({ ...current, selectedNodeId: nodeId, panelOpen: nodeId ? true : current.panelOpen }));
  };

  const addNode = () => {
    setState((current) => {
      const id = `node-${Date.now()}`;
      const node = {
        id,
        title: "New Idea",
        kind: "Idea",
        summary: "새 콘텐츠 아이디어",
        position: { x: 260 + current.nodes.length * 32, y: 120 + current.nodes.length * 22 },
      };
      return {
        ...current,
        nodes: [...current.nodes, node],
        markdowns: { ...current.markdowns, [id]: "# New Idea\n\n" },
        selectedNodeId: id,
        panelOpen: true,
      };
    });
  };

  const updateMarkdown = (nodeId, value) => {
    setState((current) => ({ ...current, markdowns: { ...current.markdowns, [nodeId]: value } }));
  };

  const deleteMarkdown = (nodeId) => {
    setState((current) => {
      const markdowns = { ...current.markdowns };
      delete markdowns[nodeId];
      return { ...current, markdowns };
    });
  };

  const appendLog = (type, message) => {
    setState((current) => ({
      ...current,
      composerLog: [...current.composerLog, { id: `${Date.now()}-${Math.random()}`, type, message }].slice(-12),
    }));
  };

  const applyActions = (result) => {
    const actions = result.actions || [];
    if (!actions.length) {
      appendLog("error", `AI가 액션을 반환하지 않았습니다. ${result.message ? "메시지: " + result.message : ""}`);
      return;
    }
    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    let unknownCount = 0;
    setState((current) => {
      const created = new Map();
      const anchor = current.nodes.find((node) => node.id === current.selectedNodeId) || current.nodes[0];
      const baseX = anchor?.position?.x ?? 260;
      const baseY = anchor?.position?.y ?? 240;
      let next = { ...current, nodes: [...current.nodes], edges: [...current.edges], markdowns: { ...current.markdowns } };
      for (const [index, action] of actions.entries()) {
        const nodeData = action.node || action;
        if (action.type === "create_node") {
          const id = nodeData.id || `ai-${Date.now()}-${index}`;
          created.set(`new:${index}`, id);
          next.nodes.push({
            id,
            title: nodeData.title || "AI Node",
            kind: NODE_KINDS.includes(nodeData.kind) ? nodeData.kind : "Idea",
            summary: nodeData.summary || "",
            position: validPosition(nodeData.position) || { x: baseX + 240 + index * 40, y: baseY + index * 90 },
          });
          next.markdowns[id] = nodeData.markdown || `# ${nodeData.title || "AI 노드"}\n\n`;
          createdCount += 1;
          continue;
        }
        if (action.type === "update_node") {
          const patch = action.patch || nodePatchFromAction(action);
          if (patch.position) {
            const safe = validPosition(patch.position);
            if (safe) patch.position = safe;
            else delete patch.position;
          }
          next.nodes = next.nodes.map((node) => (node.id === resolveRef(actionNodeId(action), current.selectedNodeId, created) ? { ...node, ...patch } : node));
          updatedCount += 1;
        }
        if (action.type === "delete_node") {
          const id = resolveRef(actionNodeId(action), current.selectedNodeId, created);
          next.nodes = next.nodes.filter((node) => node.id !== id);
          next.edges = next.edges.filter((edge) => edge.source !== id && edge.target !== id);
          delete next.markdowns[id];
          deletedCount += 1;
        }
        if (action.type === "create_edge") {
          const source = resolveRef(action.from, current.selectedNodeId, created);
          const target = resolveRef(action.to, current.selectedNodeId, created);
          if (source && target) {
            next.edges.push({ id: `${source}-${target}-${Date.now()}-${index}`, source, target, label: action.label || "" });
          }
        }
        if (action.type === "delete_edge") {
          next.edges = next.edges.filter((edge) => edge.id !== action.edgeId);
        }
        if (action.type === "open_markdown") {
          next.selectedNodeId = resolveRef(actionNodeId(action), current.selectedNodeId, created);
          next.panelOpen = true;
        }
        if (action.type === "update_markdown") {
          const id = resolveRef(actionNodeId(action), current.selectedNodeId, created);
          const previous = next.markdowns[id] || "";
          next.markdowns[id] = action.content ?? action.markdown ?? `${previous}\n${action.patch || ""}`.trimStart();
        }
        if (action.type === "delete_markdown") {
          delete next.markdowns[resolveRef(actionNodeId(action), current.selectedNodeId, created)];
        }
        if (!KNOWN_ACTION_TYPES.has(action.type)) {
          unknownCount += 1;
        }
      }
      const structuralChanged = actions.some((action) =>
        ["create_node", "delete_node", "create_edge", "delete_edge"].includes(action.type),
      );
      if (structuralChanged && current.view === "map") {
        next.nodes = layoutWithDagre(next.nodes, next.edges);
      }
      return next;
    });
    const summary = [
      result.message || "AI 액션 적용",
      `${actions.length}개 액션`,
      createdCount ? `+${createdCount}개 노드` : null,
      updatedCount ? `${updatedCount}개 수정` : null,
      deletedCount ? `-${deletedCount}개` : null,
      unknownCount ? `(알 수 없는 액션 ${unknownCount}개 무시됨)` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    appendLog(unknownCount ? "error" : "success", summary);
    if (createdCount + updatedCount + deletedCount > 0) {
      const fit = (attempt = 0) => {
        const instance = reactFlowInstance.current;
        if (!instance) {
          if (attempt < 10) window.setTimeout(() => fit(attempt + 1), 60);
          return;
        }
        try {
          instance.fitView({ padding: 0.25, duration: 500 });
        } catch {
          // ignore — viewport not ready yet
        }
      };
      window.setTimeout(fit, 80);
    }
  };

  const runAi = async (message) => {
    appendLog("user", message);
    if (!state.settings.command.trim()) {
      appendLog("error", "AI CLI 설정이 없습니다. 설정에서 Codex(`codex exec --json`) 또는 Claude(`claude -p --output-format json`)를 선택하세요.");
      return;
    }
    setAiPending(true);
    try {
      const response = await fetch("/api/ai/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          settings: state.settings,
          state: {
            nodes: state.nodes,
            edges: state.edges,
            markdowns: state.markdowns,
            selectedNodeId: state.selectedNodeId,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        appendLog("error", payload.preview || payload.error || "AI 커맨드 실행에 실패했습니다.");
        return;
      }
      applyActions(payload.result);
    } catch (error) {
      appendLog("error", error.message);
    } finally {
      setAiPending(false);
    }
  };

  return (
    <div className="app">
      {loading && <LoadingScreen />}
      {showOnboarding && (
        <Onboarding
          onCreate={(url, notes) => {
            setState((current) => {
              const starter = createStarterMap(url, notes);
              return {
                ...current,
                ...starter,
                nodes: layoutWithDagre(starter.nodes, starter.edges),
                hasOnboarded: true,
              };
            });
            setShowOnboarding(false);
          }}
        />
      )}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">T</div>
          <span>TubeMap</span>
        </div>
        <div className="breadcrumb">
          <span>테크 토크 KR</span>
          <em>/</em>
          <span>AI 코딩 도구</span>
          {selectedNode && (
            <>
              <em>/</em>
              <strong>{selectedNode.title}</strong>
            </>
          )}
        </div>
        <div className="toolbar">
          <button className={state.view === "map" ? "active" : ""} onClick={() => setState((current) => ({ ...current, view: "map" }))}>
            Map
          </button>
          <button className={state.view === "graph" ? "active" : ""} onClick={() => setState((current) => ({ ...current, view: "graph" }))}>
            Graph
          </button>
          <button onClick={addNode}>
            <Plus size={16} />
            노드
          </button>
          <button onClick={() => reactFlowInstance.current?.fitView({ padding: 0.25, duration: 400 })} title="Fit view">
            <Maximize2 size={16} />
            Fit
          </button>
          <button
            onClick={() => {
              setState((current) => ({
                ...current,
                nodes: layoutWithDagre(current.nodes, current.edges),
              }));
              window.setTimeout(() => reactFlowInstance.current?.fitView({ padding: 0.25, duration: 400 }), 80);
            }}
            title="Auto layout (dagre)"
          >
            <Network size={16} />
            Auto
          </button>
          <button
            onClick={() => {
              if (window.confirm("저장된 상태를 모두 초기화할까요?")) {
                window.localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }
            }}
            title="Reset workspace"
          >
            <Trash2 size={16} />
            Reset
          </button>
          <button onClick={() => setShowOnboarding(true)}>
            <Braces size={16} />
            온보딩
          </button>
          <button onClick={() => setState((current) => ({ ...current, panelOpen: !current.panelOpen }))}>
            {state.panelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            MD
          </button>
        </div>
      </header>

      <main className={`workspace ${state.panelOpen ? "with-panel" : ""} ${state.panelMaximized ? "panel-max" : ""}`}>
        <WorkspaceSidebar
          nodes={state.nodes}
          edges={state.edges}
          markdowns={state.markdowns}
          selectedNodeId={state.selectedNodeId}
          onSelectNode={selectNode}
        />
        <section className="canvas">
          <ReactFlowProvider>
            <CanvasArea
              sourceNodes={flowNodes}
              edges={flowEdges}
              view={state.view}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectNode={selectNode}
              onNodePositionsCommit={commitNodePositions}
              instanceRef={reactFlowInstance}
            />
          </ReactFlowProvider>
        </section>

        {state.panelOpen && (
          <MarkdownPanel
            node={selectedNode}
            markdown={state.markdowns[state.selectedNodeId] || ""}
            relations={relations}
            onChange={(value) => updateMarkdown(state.selectedNodeId, value)}
            onClose={() => setState((current) => ({ ...current, panelOpen: false }))}
            onToggleMax={() => setState((current) => ({ ...current, panelMaximized: !current.panelMaximized }))}
            maximized={state.panelMaximized}
            onSelectNode={selectNode}
            onDeleteMarkdown={() => deleteMarkdown(state.selectedNodeId)}
          />
        )}
      </main>

      <AiComposer settings={state.settings} setSettings={setSettings} onSubmit={runAi} log={state.composerLog} pending={aiPending} />
    </div>
  );
}

function validPosition(value) {
  if (!value || typeof value !== "object") return null;
  const x = Number(value.x);
  const y = Number(value.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function resolveRef(value, selectedNodeId, created) {
  if (!value || value === "selected") return selectedNodeId;
  return created.get(value) || value;
}

function actionNodeId(action) {
  return action.nodeId || action.id || action.target || "selected";
}

function nodePatchFromAction(action) {
  const ignored = new Set(["type", "nodeId", "id", "target", "patch"]);
  return Object.fromEntries(Object.entries(action).filter(([key, value]) => !ignored.has(key) && value !== undefined));
}
