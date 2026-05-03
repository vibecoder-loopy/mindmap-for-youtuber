import dagre from "dagre";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 96;

export function layoutWithDagre(nodes, edges, options = {}) {
  if (!nodes.length) return nodes;
  const direction = options.direction || "TB";
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: direction,
    nodesep: options.nodesep ?? 80,
    ranksep: options.ranksep ?? 110,
    marginx: 40,
    marginy: 40,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(graph);

  return nodes.map((node) => {
    const positioned = graph.node(node.id);
    if (!positioned) return node;
    return {
      ...node,
      position: { x: positioned.x - NODE_WIDTH / 2, y: positioned.y - NODE_HEIGHT / 2 },
    };
  });
}

export function layoutWithForce(nodes, edges, options = {}) {
  if (!nodes.length) return new Map();
  const width = options.width || 1100;
  const height = options.height || 760;

  const degree = new Map();
  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
  }

  const radius = Math.min(width, height) * 0.18;
  const simNodes = nodes.map((node, index) => ({
    id: node.id,
    x: width / 2 + Math.cos((index / nodes.length) * Math.PI * 2) * radius + (Math.random() - 0.5) * 20,
    y: height / 2 + Math.sin((index / nodes.length) * Math.PI * 2) * radius + (Math.random() - 0.5) * 20,
  }));

  const idSet = new Set(simNodes.map((node) => node.id));
  const simLinks = edges
    .filter((edge) => idSet.has(edge.source) && idSet.has(edge.target))
    .map((edge) => ({ source: edge.source, target: edge.target }));

  const simulation = forceSimulation(simNodes)
    .force(
      "charge",
      forceManyBody()
        .strength((d) => -260 - (degree.get(d.id) || 0) * 90)
        .distanceMin(24)
        .distanceMax(640),
    )
    .force(
      "link",
      forceLink(simLinks)
        .id((node) => node.id)
        .distance((link) => 120 + Math.min((degree.get(link.source.id) || 0) + (degree.get(link.target.id) || 0), 8) * 6)
        .strength(0.55),
    )
    .force("center", forceCenter(width / 2, height / 2).strength(0.06))
    .force("collision", forceCollide(32))
    .alpha(1)
    .alphaDecay(0.025)
    .stop();

  for (let i = 0; i < 480; i += 1) simulation.tick();

  const positions = new Map();
  for (const node of simNodes) {
    positions.set(node.id, { x: node.x, y: node.y });
  }
  return positions;
}
