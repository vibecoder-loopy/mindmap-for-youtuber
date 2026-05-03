// Sample data — refined monochrome version
const NODE_TYPES = {
  idea:      { label: "Idea",      dot: "#FFFFFF" },
  script:    { label: "Script",    dot: "#7E7E84" },
  research:  { label: "Research",  dot: "#5A5A60" },
  reference: { label: "Reference", dot: "#5A5A60" },
  thumb:     { label: "Thumbnail", dot: "#FFFFFF" },
  series:    { label: "Series",    dot: "#FF2D2D" },
};

const STATUS = {
  idea:    { label: "Idea",    color: "#5A5A60" },
  script:  { label: "Script",  color: "#9A9AA0" },
  shoot:   { label: "Shoot",   color: "#C9C9CE" },
  edit:    { label: "Edit",    color: "#C9C9CE" },
  publish: { label: "Live",    color: "#FF2D2D" },
};

const INITIAL_NODES = [
  {
    id: "n-hub", type: "series", x: 540, y: 360,
    title: "AI 코딩 도구",
    subtitle: "Series · 8 episodes",
    status: "shoot",
    pinned: true,
  },
  {
    id: "n-ep1", type: "idea", x: 200, y: 140,
    title: "Cursor vs Copilot",
    ep: "EP01",
    status: "publish",
    views: "82.4K",
    publishedAt: "Apr 12",
    thumb: "ep1",
  },
  {
    id: "n-ep2", type: "idea", x: 220, y: 380,
    title: "주말에 SaaS 만들기",
    ep: "EP02",
    status: "edit",
    publishedAt: "May 10",
    thumb: "ep2",
  },
  {
    id: "n-ep3", type: "idea", x: 230, y: 600,
    title: "Claude Code 가이드",
    ep: "EP03",
    status: "shoot",
    thumb: "ep3",
  },
  {
    id: "n-ep4", type: "idea", x: 880, y: 130,
    title: "1인 개발자의 AI 스택",
    ep: "EP04",
    status: "script",
    thumb: "ep4",
  },
  {
    id: "n-ep5", type: "idea", x: 900, y: 380,
    title: "AI 디버깅 클래스",
    ep: "EP05",
    status: "idea",
    thumb: "ep5",
  },
  {
    id: "n-ep6", type: "idea", x: 880, y: 600,
    title: "바이브 코딩의 한계",
    ep: "EP06",
    status: "idea",
    thumb: "ep6",
  },
  {
    id: "n-ep2-script", type: "script", x: 60, y: 280,
    title: "Script v3",
    subtitle: "1,840 chars",
    progress: 0.86,
  },
  {
    id: "n-ep2-thumb", type: "thumb", x: 80, y: 470,
    title: "Thumbnail A/B",
    subtitle: "3 variants",
    abCount: 3,
  },
  {
    id: "n-r1", type: "research", x: 1180, y: 60,
    title: "AI 도구 가격 비교",
    subtitle: "12 services",
  },
  {
    id: "n-r2", type: "reference", x: 1200, y: 220,
    title: "Fireship — AI Stack 2025",
    channel: "Fireship",
    refViews: "1.2M",
  },
  {
    id: "n-r3", type: "reference", x: 1200, y: 470,
    title: "ThePrimeagen — Debug like a pro",
    channel: "ThePrimeagen",
    refViews: "340K",
  },
  {
    id: "n-r4", type: "research", x: 1180, y: 700,
    title: "r/cscareerquestions thread",
    subtitle: "3.4K comments",
  },
];

const INITIAL_EDGES = [
  { from: "n-hub", to: "n-ep1" },
  { from: "n-hub", to: "n-ep2" },
  { from: "n-hub", to: "n-ep3" },
  { from: "n-hub", to: "n-ep4" },
  { from: "n-hub", to: "n-ep5" },
  { from: "n-hub", to: "n-ep6" },
  { from: "n-ep2", to: "n-ep2-script" },
  { from: "n-ep2", to: "n-ep2-thumb" },
  { from: "n-ep4", to: "n-r1" },
  { from: "n-ep4", to: "n-r2" },
  { from: "n-ep5", to: "n-r3" },
  { from: "n-ep6", to: "n-r4" },
  { from: "n-ep1", to: "n-ep4", soft: true },
  { from: "n-ep3", to: "n-ep5", soft: true },
];

const ZONES = [
  { id: "z-hub",  name: "AI 코딩 도구.md",          nodeId: "n-hub",  group: "Series" },
  { id: "z-ep1",  name: "EP01 Cursor vs Copilot.md", nodeId: "n-ep1", group: "Episodes" },
  { id: "z-ep2",  name: "EP02 주말 SaaS.md",          nodeId: "n-ep2", group: "Episodes" },
  { id: "z-ep3",  name: "EP03 Claude Code.md",        nodeId: "n-ep3", group: "Episodes" },
  { id: "z-ep4",  name: "EP04 1인 개발자 스택.md",    nodeId: "n-ep4", group: "Episodes" },
  { id: "z-ep5",  name: "EP05 AI 디버깅.md",          nodeId: "n-ep5", group: "Episodes" },
  { id: "z-ep6",  name: "EP06 바이브 코딩의 한계.md", nodeId: "n-ep6", group: "Episodes" },
];

const SAMPLE_MD = `---
title: EP02 주말에 SaaS 만들기
status: edit
length: 11분
upload: 2025-05-10
tags: [사이드프로젝트, SaaS, Cursor]
---

# 주말에 SaaS 만들기

> 48시간 동안 진짜 돌아가는 SaaS 하나 만들기.
> AI에게 "잘" 시키는 법이 핵심.

## 훅

여러분, 솔직히 말해서요. 사이드프로젝트 시작은 쉬운데
완성을 못 하잖아요? 저도 그랬어요.

근데 이번 주말에 진짜로 48시간 만에 SaaS 하나를 띄웠습니다.
심지어 첫날에 유료 결제도 받았어요.

## 챕터

- 00:20 — 왜 사이드프로젝트는 늘 실패할까
- 01:40 — 이번 도전의 룰 3가지
- 03:10 — Day 1 아이디어 → 핵심 기능
- 06:30 — Day 2 결제 붙이고 배포
- 09:10 — 하루 차로 본 실제 매출
- 10:20 — AI를 잘 쓰는 사람의 차이
- 11:00 — 정리

## 연결된 노드

- [[n-r1|AI 도구 가격 비교표]] 사용한 도구 가격 인용
- [[n-ep1|EP01 Cursor vs Copilot]] 도구 선택 근거 백링크
- [[n-ep2-thumb|Thumbnail A/B]] A안 결정됨

## TODO

- [x] 스크립트 v3 마무리
- [x] B-roll 화면 녹화
- [ ] 썸네일 최종 1안 확정
- [ ] 챕터 마커 자동생성
- [ ] 자막 .srt 검수
`;

window.NODE_TYPES = NODE_TYPES;
window.STATUS = STATUS;
window.INITIAL_NODES = INITIAL_NODES;
window.INITIAL_EDGES = INITIAL_EDGES;
window.ZONES = ZONES;
window.SAMPLE_MD = SAMPLE_MD;
