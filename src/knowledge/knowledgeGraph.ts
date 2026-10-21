// ============================================================================
// KNOWLEDGE GRAPH — nối SAO ↔ CUNG ↔ CÁCH CỤC thành đồ thị truy vấn được
// ----------------------------------------------------------------------------
// Mục tiêu: multi-hop reasoning cho luận giải. Tri thức phẳng (Đàm Tinh, Kinh
// Nghiệm, Giải Hóa) + quan hệ hình học (chartRelations.ts) được "neo" thành
// node/edge để:
//   - traverseFrom(): đi nhiều bước từ một node (vd Cung Mệnh) thu các đường
//     liên kết kèm insight đọc được.
//   - queryGraphForInterpretation(): trả khối văn bản (palaceContext /
//     relatedInsights / tensions) nhét thẳng vào prompt.
//
// KHÔNG SỬA file cũ: mọi dữ liệu đọc qua import từ damTinh / kinhNghiem /
// giaiHoa / chartRelations / cachCucLogic. Bảng quan hệ dùng ĐÚNG NHI_HOP,
// LUC_HAI, toBranchIndex, findStarBranch — không khai báo lại công thức.
//
// Node id quy ước:
//   star:<norm>      — sao thực có trên lá (chuẩn hóa normalizeStarName)
//   palace:<norm>    — 12 cung
//   cach-cuc:<pid>   — cách cục máy phát hiện trên lá
//   han:<...>        — (dự phòng) hạn/lưu niên: thêm qua addKGNode/addKGEdge
//
// adjacency: Map nodeId → các cạnh KỀ node đó (cả 2 đầu). Quan hệ đối xứng
// (tam-hop/xung-chieu/nhi-hop/luc-hai) lưu MỖI CẶP MỘT CẠNH; traverse đi theo
// cả 2 chiều nên không cần cạnh ngược.
// ============================================================================

import {
  BRANCHES_VI,
  NHI_HOP,
  LUC_HAI,
  toBranchIndex,
  buildChartIndex,
  findStarBranch,
  normalizeStarName,
  allStarsOf,
  mutagenLabelOf,
  SAT_KY_STARS,
  type ChartIndex,
} from "../utils/chartRelations";
import { HOA_LABELS, getNatalTuHoaQuartet, normalizeHeavenlyStem } from "../utils/tuHoa";
import { DAM_TINH, DAM_TINH_AUX, DAM_TINH_TU_HOA, resolveDamTinhStarName } from "./damTinh";
import { KINH_NGHIEM_KNOWLEDGE } from "./kinhNghiemKnowledge";
import { GIAI_HOA_KNOWLEDGE } from "./giaiHoaKnowledge";
import { enrichAnalysis } from "../utils/cachCucLogic";
import { normalizePatternId, resolveCachCucKnowledge } from "./cachCucKnowledgeMap";
import type { CatalogStar } from "../utils/tuviStarCatalog";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface KGNode {
  id: string; // normalized star name or palace name
  type: "star" | "palace" | "cach-cuc" | "han";
  label: string; // Vietnamese display name
  data?: any; // Đàm Tinh entry, KN entry, v.v.
}

export interface KGEdge {
  from: string; // node id
  to: string; // node id
  type:
    | "tam-hop"
    | "xung-chieu"
    | "nhi-hop"
    | "luc-hai"
    | "phi-hoa"
    | "combo"
    | "han-ap-luc"
    | "giai-hoa"
    | "cung-chua-sao";
  weight: number; // 1-10 strength of relationship
  label?: string; // Vietnamese description
}

export interface KnowledgeGraph {
  nodes: Map<string, KGNode>;
  edges: KGEdge[];
  adjacency: Map<string, KGEdge[]>; // for fast traversal (cạnh kề CẢ HAI đầu)
}

export interface TraverseResult {
  path: string[]; // chuỗi node id
  edges: KGEdge[]; // edges[i] nối path[i] -> path[i+1]
  insights: string[]; // mô tả đọc được cho từng bước
}

export interface PalaceQueryResult {
  palaceContext: string;
  relatedInsights: string[];
  tensions: string[];
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

const MAX_PATHS = 80; // chặn nổ tổ hợp khi traverse sâu

const EDGE_VERB: Record<string, string> = {
  "tam-hop": "tam hợp",
  "xung-chieu": "xung chiếu",
  "nhi-hop": "nhị hợp",
  "luc-hai": "lục hại",
  "phi-hoa": "phi hóa",
  combo: "liên kết",
  "han-ap-luc": "tạo áp lực",
  "giai-hoa": "hóa giải",
  "cung-chua-sao": "thủ",
};

const starNodeId = (norm: string) => `star:${norm}`;
const palaceNodeId = (norm: string) => `palace:${norm}`;

/** Đổi tên hiển thị: bỏ tiền tố [SAO LƯU]/[SAO VẬN] + phần "(...)" cuối. */
const baseDisplayOf = (raw: string): string =>
  String(raw || "")
    .replace(/\[SAO\s*(?:LƯU|VẬN)\]\s*/gi, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();

/** Sao lưu/vận mang Tứ Hóa? "Lưu Hóa Kỵ (Liêm Trinh)" → true. */
const isTransitHoaToken = (display: string): boolean => /^(lưu|vận)\s+hóa/i.test(display);

/** "Lưu Hóa Kỵ" / "Vận Hóa Lộc" → "Hóa Kỵ" / "Hóa Lộc" để tra Đàm Tinh Tứ Hóa. */
const natalHoaLabelOf = (display: string): string =>
  display.replace(/^(lưu|vận)\s+/i, "").trim();

const truncateText = (s: string, max: number): string => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
};

const damTinhDataFor = (display: string): any => {
  const key = resolveDamTinhStarName(display);
  if (!key) return undefined;
  return DAM_TINH[key] || DAM_TINH_AUX[key] || DAM_TINH_TU_HOA[key] || DAM_TINH_TU_HOA[natalHoaLabelOf(key)] || undefined;
};

/** Thêm node (bỏ qua nếu id đã tồn tại). Dùng công khai để module hạn/lưu niên mở rộng graph. */
export function addKGNode(graph: KnowledgeGraph, node: KGNode): KGNode {
  const existing = graph.nodes.get(node.id);
  if (existing) return existing;
  graph.nodes.set(node.id, node);
  return node;
}

/** Thêm cạnh: chặn self-loop, chặn trùng (type|from|to|label), clamp weight 1-10. */
export function addKGEdge(graph: KnowledgeGraph, edge: KGEdge): void {
  if (!edge || !graph.nodes.has(edge.from) || !graph.nodes.has(edge.to)) return;
  if (edge.from === edge.to) return;
  const weight = Math.max(1, Math.min(10, Math.round(Number(edge.weight) || 5)));
  const key = `${edge.type}|${edge.from}|${edge.to}|${edge.label ?? ""}`;
  // chống trùng tuyệt đối trong 1 lần build — dùng cờ trên graph object
  const seen = (graph as any).__edgeKeys as Set<string> | undefined;
  if (seen) {
    if (seen.has(key)) return;
    seen.add(key);
  }
  const e: KGEdge = { from: edge.from, to: edge.to, type: edge.type, weight };
  if (edge.label) e.label = edge.label;
  graph.edges.push(e);
  if (!graph.adjacency.has(e.from)) graph.adjacency.set(e.from, []);
  if (!graph.adjacency.has(e.to)) graph.adjacency.set(e.to, []);
  graph.adjacency.get(e.from)!.push(e);
  graph.adjacency.get(e.to)!.push(e);
}

/** Toàn bộ cạnh KỀ một node (cả 2 đầu from/to). */
export function incidentEdges(graph: KnowledgeGraph, nodeId: string): KGEdge[] {
  return graph.adjacency.get(nodeId) || [];
}

/** Nhãn "<label> (<branch>)" cho cung. */
const palaceTag = (graph: KnowledgeGraph, nodeId: string): string => {
  const n = graph.nodes.get(nodeId);
  if (!n) return nodeId;
  const branch = n.data?.branch ? ` (${n.data.branch})` : "";
  return `${n.label}${branch}`;
};

/** Một dòng insight cho 1 cạnh. */
const edgeInsightLine = (graph: KnowledgeGraph, e: KGEdge): string => {
  const f = graph.nodes.get(e.from)?.label ?? e.from;
  const t = graph.nodes.get(e.to)?.label ?? e.to;
  if (e.label) {
    // nhãn đã là câu hoàn chỉnh (quan hệ hình học / áp lực / cách cục) → dùng thẳng
    if (e.label.includes(f) || e.label.includes(t)) return e.label;
    return `${f} — ${e.label} — ${t}`;
  }
  return `${f} ${EDGE_VERB[e.type] || e.type} ${t}`;
};

// ----------------------------------------------------------------------------
// BUILD GRAPH
// ----------------------------------------------------------------------------

interface StarRecord {
  palaceId: string;
  branchIdx: number;
  raw: string;
  display: string; // tên sạch (đã bỏ [SAO ...] + "(...)")
  norm: string;
  isHoaToken: boolean;
  carriedNorm?: string; // sao gốc trong "(...)" của token Lưu/Vận Hóa
  carriedDisplay?: string;
  mutagenLabel?: string; // "Hóa Lộc|Quyền|Khoa|Kỵ" bẩm sinh (field mutagen)
  groupWeight: number; // trọng số cung-chua-sao theo nhóm sao
  isMajor: boolean;
}

const branchIndexOf = (p: any, fallback: number): number => {
  const idx = Number(p?.index);
  if (Number.isFinite(idx)) return toBranchIndex(idx);
  const br = String(p?.earthlyBranch || "").normalize("NFC").trim();
  const byName = BRANCHES_VI.indexOf(br);
  return byName >= 0 ? byName : ((fallback % 12) + 12) % 12;
};

/**
 * Dựng Knowledge Graph từ payload lá số (12 cung) + danh mục sao.
 * starCatalog: TUVI_STAR_CATALOG — dùng để chuẩn hóa tên hiển thị (norm → display).
 */
export function buildKnowledgeGraph(palaces: any[] = [], starCatalog: any[] = []): KnowledgeGraph {
  const graph: KnowledgeGraph = {
    nodes: new Map(),
    edges: [],
    adjacency: new Map(),
  };
  (graph as any).__edgeKeys = new Set<string>();

  const list = (Array.isArray(palaces) ? palaces : []).filter(Boolean);
  const idx: ChartIndex = buildChartIndex(list);

  // norm → display từ danh mục (ưu tiên tên chuẩn vi-VN iztro)
  const normToDisplay = new Map<string, string>();
  for (const s of (Array.isArray(starCatalog) ? starCatalog : []) as CatalogStar[]) {
    if (s?.norm && s?.display) normToDisplay.set(normalizeStarName(s.norm), s.display);
  }

  // ---- PASS A: NODES ---------------------------------------------------------
  // 1) Palace nodes
  const palaceNodeByBranch = new Map<number, KGNode>();
  list.forEach((p: any, i: number) => {
    const b = branchIndexOf(p, i);
    const rawName = String(p?.name || "").trim() || `Cung ${BRANCHES_VI[b]}`;
    const norm = normalizeStarName(rawName) || `cung ${BRANCHES_VI[b]}`.toLowerCase();
    let id = palaceNodeId(norm);
    if (graph.nodes.has(id)) id = `${id}@${BRANCHES_VI[b]}`; // phòng trùng tên cung
    const node = addKGNode(graph, {
      id,
      type: "palace",
      label: rawName,
      data: {
        name: rawName,
        branchIdx: b,
        branch: BRANCHES_VI[b],
        heavenlyStem: normalizeHeavenlyStem(p?.heavenlyStem) || "",
        isOriginalPalace: Boolean(p?.isOriginalPalace),
        selfMutagens: [] as string[], // tự hóa ghi ở đây, không tạo self-loop
      },
    });
    if (!palaceNodeByBranch.has(b)) palaceNodeByBranch.set(b, node);
  });

  // 2) Star nodes (+ node Tứ Hóa từ mutagen bẩm sinh)
  const starRecords: StarRecord[] = [];
  const ensureHoaNode = (hoaLabel: string): KGNode | null => {
    const label = String(hoaLabel || "").trim();
    if (!label) return null;
    const norm = normalizeStarName(label);
    if (!norm) return null;
    const id = starNodeId(norm);
    const existing = graph.nodes.get(id);
    if (existing) return existing;
    return addKGNode(graph, {
      id,
      type: "star",
      label,
      data: DAM_TINH_TU_HOA[label] || undefined,
    });
  };

  list.forEach((p: any, i: number) => {
    const b = branchIndexOf(p, i);
    const pnode = palaceNodeByBranch.get(b);
    if (!pnode) return;
    const groups: { stars: any[]; weight: number; isMajor: boolean }[] = [
      { stars: p?.majorStars || [], weight: 9, isMajor: true },
      { stars: p?.minorStars || [], weight: 7, isMajor: false },
      { stars: p?.adjectiveStars || [], weight: 5, isMajor: false },
    ];
    for (const g of groups) {
      for (const s of g.stars) {
        const raw = String(s?.name || "").trim();
        if (!raw) continue;
        const display = baseDisplayOf(raw) || raw;
        const norm = normalizeStarName(display);
        if (!norm) continue;
        const isHoaToken = isTransitHoaToken(display);
        const id = starNodeId(norm);
        const existed = graph.nodes.has(id);
        const node = addKGNode(graph, {
          id,
          type: "star",
          label: normToDisplay.get(norm) || display,
          data: damTinhDataFor(display),
        });
        // ưu tiên nhãn sao gốc (không mang tiền tố Lưu/Vận) nếu sao gốc xuất hiện sau
        if (existed && !isHoaToken && /^(lưu|vận)\s/i.test(node.label) && !/^(lưu|vận)\s/i.test(display)) {
          node.label = display;
        }
        const mLabel = mutagenLabelOf(s?.mutagen) || undefined;
        // tách sao gốc khỏi token "Lưu Hóa Kỵ (Liêm Trinh)"
        const carriedMatch = raw.match(/\(([^)]+)\)\s*$/);
        const carriedDisplay = carriedMatch ? String(carriedMatch[1]).trim() : undefined;
        starRecords.push({
          palaceId: pnode.id,
          branchIdx: b,
          raw,
          display,
          norm,
          isHoaToken,
          carriedNorm: carriedDisplay ? normalizeStarName(carriedDisplay) : undefined,
          carriedDisplay,
          mutagenLabel: mLabel,
          groupWeight: g.weight,
          isMajor: g.isMajor,
        });
        // node Tứ Hóa bẩm sinh từ mutagen (chỉ sao GỐC mang mutagen)
        if (mLabel) ensureHoaNode(mLabel);
      }
    }
  });

  // 3) Token index: norm → node id (dùng để khớp token requireAll/requireAny/tags)
  const tokenIndex = new Map<string, string>();
  for (const n of graph.nodes.values()) {
    if (n.type === "star") {
      tokenIndex.set(normalizeStarName(n.label), n.id);
      tokenIndex.set(n.id.slice("star:".length), n.id);
    } else if (n.type === "palace") {
      const norm = normalizeStarName(n.label);
      tokenIndex.set(norm, n.id);
      tokenIndex.set(norm.replace(/^cung\s+/, ""), n.id); // "Cung Tài Bạch" → "tài bạch"
    }
  }
  const resolveTokenNode = (token: string): string | null => {
    const t = normalizeStarName(token);
    if (!t) return null;
    return tokenIndex.get(t) || tokenIndex.get(t.replace(/^cung\s+/, "")) || null;
  };

  // ---- PASS B: EDGES ---------------------------------------------------------
  const palaceLabelAt = (b: number): string => {
    const n = palaceNodeByBranch.get(b);
    return n ? `${n.label} (${BRANCHES_VI[b]})` : BRANCHES_VI[b];
  };

  // 1) cung-chua-sao + han-ap-luc + liên kết Tứ Hóa
  for (const rec of starRecords) {
    const sId = starNodeId(rec.norm);
    // cung-chua-sao: cung thủ sao
    addKGEdge(graph, {
      from: rec.palaceId,
      to: sId,
      type: "cung-chua-sao",
      weight: rec.groupWeight,
      label: `${palaceTag(graph, rec.palaceId)} thủ ${rec.display}`,
    });
    // han-ap-luc: sát/kỵ tinh đè lên cung
    if (SAT_KY_STARS.includes(rec.norm)) {
      addKGEdge(graph, {
        from: sId,
        to: rec.palaceId,
        type: "han-ap-luc",
        weight: 7,
        label: `${rec.display} tạo áp lực tại ${palaceTag(graph, rec.palaceId)}`,
      });
    }
    // Hóa Kỵ bẩm sinh gắn trên sao gốc → áp lực mạnh
    if (rec.mutagenLabel === "Hóa Kỵ") {
      addKGEdge(graph, {
        from: sId,
        to: rec.palaceId,
        type: "han-ap-luc",
        weight: 9,
        label: `${rec.display} mang Hóa Kỵ tại ${palaceTag(graph, rec.palaceId)}`,
      });
    }
    // sao gốc đắc Tứ Hóa bẩm sinh → cạnh sao ↔ hoa-node
    if (rec.mutagenLabel) {
      const hoaNode = ensureHoaNode(rec.mutagenLabel);
      if (hoaNode) {
        addKGEdge(graph, {
          from: hoaNode.id,
          to: sId,
          type: "combo",
          weight: 8,
          label: `${rec.mutagenLabel} tọa tại ${rec.display}`,
        });
      }
    }
    // token "Lưu/Vận Hóa X (Sao Gốc)" → nối về sao gốc trên lá
    if (rec.isHoaToken && rec.carriedNorm) {
      const carriedId = starNodeId(rec.carriedNorm);
      if (graph.nodes.has(carriedId)) {
        addKGEdge(graph, {
          from: sId,
          to: carriedId,
          type: "combo",
          weight: 6,
          label: `${rec.display} gắn ${rec.carriedDisplay}`,
        });
      }
    }
  }

  // 2) Quan hệ hình học giữa các cung — mỗi cặp đối xứng 1 cạnh (chỉ khi partner > b)
  for (let b = 0; b < 12; b++) {
    const aId = palaceNodeByBranch.get(b)?.id;
    if (!aId) continue;
    const addPalaceEdge = (t: number, type: KGEdge["type"], weight: number, verb: string) => {
      if (t <= b) return; // quan hệ đối xứng — chỉ lưu chiều "thấp → cao" để khỏi lặp cạnh
      const tId = palaceNodeByBranch.get(t)?.id;
      if (!tId) return;
      addKGEdge(graph, {
        from: aId,
        to: tId,
        type,
        weight,
        label: `${palaceLabelAt(b)} ${verb} ${palaceLabelAt(t)}`,
      });
    };
    // tam hợp: (b+4) và (b+8)
    addPalaceEdge((b + 4) % 12, "tam-hop", 7, "tam hợp");
    addPalaceEdge((b + 8) % 12, "tam-hop", 7, "tam hợp");
    // xung chiếu: đối cung
    addPalaceEdge((b + 6) % 12, "xung-chieu", 8, "xung chiếu");
    // nhị hợp / lục hại từ bảng chuẩn chartRelations
    addPalaceEdge(NHI_HOP[b], "nhi-hop", 5, "nhị hợp");
    addPalaceEdge(LUC_HAI[b], "luc-hai", 7, "lục hại");
  }

  // 3) Phi Tứ Hóa theo thiên can từng cung (sao đích phải có trên lá)
  for (const p of list) {
    const b = branchIndexOf(p, 0);
    const pnode = palaceNodeByBranch.get(b);
    if (!pnode) continue;
    const stem = normalizeHeavenlyStem(p?.heavenlyStem);
    const quartet = stem ? getNatalTuHoaQuartet(stem) : null;
    if (!quartet || !Array.isArray(quartet)) continue;
    quartet.forEach((star: string, i: number) => {
      const hoaLabel = HOA_LABELS[i] || `Hóa ${i}`;
      const dest = findStarBranch(idx, star);
      if (dest < 0) return;
      if (dest === b) {
        // tự hóa — ghi vào data cung, không tạo self-loop
        const selfs: string[] = pnode.data?.selfMutagens || [];
        selfs.push(`${hoaLabel} (${star})`);
        pnode.data.selfMutagens = selfs;
        return;
      }
      const destNode = palaceNodeByBranch.get(dest);
      if (!destNode) return;
      addKGEdge(graph, {
        from: pnode.id,
        to: destNode.id,
        type: "phi-hoa",
        weight: 8,
        label: `${hoaLabel} (${star})`,
      });
    });
  }

  // 4) Combo: mẫu Kinh Nghiệm (star combos → luận ứng dụng), neo đúng lá
  const pairEdgesFromEntry = (
    tokens: string[] | undefined,
    type: KGEdge["type"],
    weight: number,
    title: string,
    requireAll: boolean,
    cap = 6,
  ) => {
    if (!tokens || tokens.length === 0) return;
    const resolved = tokens.map(resolveTokenNode);
    if (requireAll && resolved.some((r) => !r)) return; // thiếu kim trên lá → bỏ mẫu
    const ids = [...new Set(resolved.filter((r): r is string => Boolean(r)))];
    if (ids.length < 2) return;
    let count = 0;
    for (let i = 0; i < ids.length && count < cap; i++) {
      for (let j = i + 1; j < ids.length && count < cap; j++) {
        addKGEdge(graph, { from: ids[i], to: ids[j], type, weight, label: title });
        count++;
      }
    }
  };

  for (const e of KINH_NGHIEM_KNOWLEDGE) {
    if (e.requireAll?.length) {
      pairEdgesFromEntry(e.requireAll, "combo", 6, e.title, true);
    } else if (e.requireAny?.length) {
      pairEdgesFromEntry(e.requireAny, "combo", 5, e.title, false);
    }
  }

  // 5) Giai Hóa: mẫu hóa giải — nối sao ↔ sao / sao ↔ cung theo gate + tags
  for (const e of GIAI_HOA_KNOWLEDGE) {
    if (e.requireAll?.length) {
      pairEdgesFromEntry(e.requireAll, "giai-hoa", 5, e.title, true);
    } else if (e.requireAny?.length) {
      pairEdgesFromEntry(e.requireAny, "giai-hoa", 4, e.title, false);
    }
    // tags nhắc tên cung có trên lá → nối sao đã resolve với cung đó
    const gateTokens = e.requireAll?.length ? e.requireAll : e.requireAny;
    if (!gateTokens?.length) continue;
    const starIds = [...new Set(gateTokens.map(resolveTokenNode).filter((r): r is string => Boolean(r)))]
      .filter((id) => graph.nodes.get(id)?.type === "star");
    const palaceIds = [...new Set((e.tags || []).map(resolveTokenNode).filter((r): r is string => Boolean(r)))]
      .filter((id) => graph.nodes.get(id)?.type === "palace");
    let count = 0;
    for (const sId of starIds) {
      for (const pId of palaceIds) {
        if (count >= 4) break;
        addKGEdge(graph, { from: sId, to: pId, type: "giai-hoa", weight: 4, label: e.title });
        count++;
      }
    }
  }

  // 6) Cách cục máy trên lá → node cach-cuc + cạnh neo cung/mốc sao
  try {
    const enriched = enrichAnalysis(idx) as any[];
    const seenPid = new Set<string>();
    for (const m of enriched) {
      const match: any = m?.match || m || {};
      const pid = String(match.patternId || "").trim();
      if (!pid || seenPid.has(pid)) continue;
      seenPid.add(pid);
      const basePid = normalizePatternId(pid) || pid;
      const link = resolveCachCucKnowledge(pid) || resolveCachCucKnowledge(basePid);
      const label = link?.name || match.name || basePid;
      const ccId = `cach-cuc:${basePid}`;
      addKGNode(graph, {
        id: ccId,
        type: "cach-cuc",
        label,
        data: {
          patternId: basePid,
          causal: link?.causal || "",
          qualityLabel: m?.effectiveQualityLabel || match.qualityLabel || "",
          anchorPalaceName: match.anchorPalaceName || "",
          anchorBranch: match.anchorBranch || "",
          logicLines: m?.logicLines || [],
          knIds: link?.knIds || [],
          ghIds: link?.ghIds || [],
          lifeDomains: link?.lifeDomains || [],
        },
      });
      // neo vào cung trục của cách
      const anchorBranchIdx = BRANCHES_VI.indexOf(String(match.anchorBranch || "").normalize("NFC").trim());
      const anchorId =
        (anchorBranchIdx >= 0 ? palaceNodeByBranch.get(anchorBranchIdx)?.id : undefined) ||
        resolveTokenNode(match.anchorPalaceName || "");
      if (anchorId) {
        addKGEdge(graph, {
          from: ccId,
          to: anchorId,
          type: "combo",
          weight: 8,
          label: `Cách ${label} đóng tại ${palaceTag(graph, anchorId)}`,
        });
      }
      // nối các sao tạo cách (kèm độ sáng)
      const brights: any[] = match.starBrightness || [];
      let starCount = 0;
      for (const sb of brights) {
        if (starCount >= 6) break;
        const sNorm = normalizeStarName(String(sb?.name || ""));
        if (!sNorm) continue;
        const sId = starNodeId(sNorm);
        if (!graph.nodes.has(sId)) continue;
        addKGEdge(graph, {
          from: ccId,
          to: sId,
          type: "combo",
          weight: 6,
          label: `${label}: ${sb.name}${sb.brightness ? ` (${sb.brightness})` : ""}`,
        });
        starCount++;
      }
    }
  } catch {
    // lá thiếu dữ liệu / analyze lỗi → bỏ qua phần cach-cuc, graph vẫn dùng được
  }

  delete (graph as any).__edgeKeys;
  return graph;
}

// ----------------------------------------------------------------------------
// MULTI-HOP TRAVERSAL
// ----------------------------------------------------------------------------

/**
 * Resolve node id từ chuỗi bất kỳ: id gốc → "star:<norm>" → "palace:<norm>"
 * → fuzzy khớp tên cung (contains 2 chiều, ưu tiên khớp ngắn nhất).
 */
export function resolveNodeId(graph: KnowledgeGraph, raw: string): string | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  if (graph.nodes.has(s)) return s;
  const norm = normalizeStarName(s);
  if (!norm) return null;
  const starId = starNodeId(norm);
  if (graph.nodes.has(starId)) return starId;
  const palaceId = palaceNodeId(norm);
  if (graph.nodes.has(palaceId)) return palaceId;
  // fuzzy: chỉ cung (tên cung thường được hỏi dạng "Mệnh", "Tài Bạch", "Tử Tức"...)
  const alias: Record<string, string> = { "tử tức": "tử nữ" };
  const target = alias[norm] || norm;
  let best: string | null = null;
  let bestLen = -1;
  for (const node of graph.nodes.values()) {
    if (node.type !== "palace") continue;
    const nl = normalizeStarName(node.label);
    if (nl === target) return node.id;
    if (nl.includes(target) || target.includes(nl)) {
      if (bestLen < 0 || nl.length < bestLen) {
        best = node.id;
        bestLen = nl.length;
      }
    }
  }
  return best;
}

/**
 * DFS từ 1 node, tối đa maxDepth bước. Trả các đường (không lặp node) đạt đủ
 * depth hoặc chặn ở lá; mỗi đường kèm edges + insights đọc được.
 * edgeTypes (tùy chọn) lọc loại cạnh khi mở rộng.
 */
export function traverseFrom(
  graph: KnowledgeGraph,
  startNodeId: string,
  maxDepth: number,
  edgeTypes?: string[],
): TraverseResult[] {
  const start = resolveNodeId(graph, startNodeId);
  if (!start) return [];
  const depth = Math.max(1, Math.min(8, Math.floor(Number(maxDepth) || 1)));
  const allowed = edgeTypes && edgeTypes.length ? new Set(edgeTypes) : null;

  const results: TraverseResult[] = [];
  const path: string[] = [start];
  const pathEdges: KGEdge[] = [];
  const onPath = new Set<string>([start]);

  const record = () => {
    if (pathEdges.length === 0) return;
    results.push({
      path: [...path],
      edges: [...pathEdges],
      insights: pathEdges.map((e) => edgeInsightLine(graph, e)),
    });
  };

  const dfs = (current: string) => {
    if (results.length >= MAX_PATHS) return;
    const atCap = pathEdges.length >= depth;
    const adj = incidentEdges(graph, current);
    let extended = false;
    if (!atCap) {
      for (const e of adj) {
        if (allowed && !allowed.has(e.type)) continue;
        const next = e.from === current ? e.to : e.to === current ? e.from : null;
        if (!next || onPath.has(next)) continue;
        extended = true;
        path.push(next);
        pathEdges.push(e);
        onPath.add(next);
        dfs(next);
        onPath.delete(next);
        path.pop();
        pathEdges.pop();
        if (results.length >= MAX_PATHS) return;
      }
    }
    if (!extended && pathEdges.length > 0) record();
  };

  dfs(start);
  return results;
}

// ----------------------------------------------------------------------------
// QUERY CHO PROMPT
// ----------------------------------------------------------------------------

/**
 * Truy vấn graph theo tên cung → khối văn bản inject prompt:
 *  - palaceContext: tóm tắt cung + quan hệ hình học + phi hóa.
 *  - relatedInsights: Đàm Tinh sao chủ / mẫu Kinh Nghiệm-Giải Hóa nối đến.
 *  - tensions: lục hại, sát/kỵ áp lực, Hóa Kỵ bay vào, xung cung nhiều sát.
 */
export function queryGraphForInterpretation(
  graph: KnowledgeGraph,
  targetPalace: string,
): PalaceQueryResult {
  const empty: PalaceQueryResult = { palaceContext: "", relatedInsights: [], tensions: [] };
  const pid = resolveNodeId(graph, targetPalace);
  if (!pid) return empty;
  const pnode = graph.nodes.get(pid)!;
  const incident = incidentEdges(graph, pid);

  // --- sao trong cung ---
  const starEdges = incident
    .filter((e) => e.type === "cung-chua-sao" && e.from === pid)
    .sort((a, b) => b.weight - a.weight);
  const majorStars = starEdges.filter((e) => e.weight >= 9).map((e) => graph.nodes.get(e.to)!);
  const minorStars = starEdges.filter((e) => e.weight < 9).map((e) => graph.nodes.get(e.to)!);

  // --- partner theo loại quan hệ (dedupe) ---
  const partnersOf = (type: string): KGNode[] => {
    const seen = new Set<string>();
    const out: KGNode[] = [];
    for (const e of incident) {
      if (e.type !== type) continue;
      const otherId = e.from === pid ? e.to : e.to === pid ? e.from : null;
      if (!otherId || seen.has(otherId)) continue;
      const n = graph.nodes.get(otherId);
      if (!n || n.type !== "palace") continue;
      seen.add(otherId);
      out.push(n);
    }
    return out;
  };
  const tamHop = partnersOf("tam-hop");
  const xung = partnersOf("xung-chieu");
  const nhiHop = partnersOf("nhi-hop");
  const lucHai = partnersOf("luc-hai");

  // --- phi hóa xuất từ cung này ---
  const flights = incident
    .filter((e) => e.type === "phi-hoa" && e.from === pid)
    .map((e) => `${e.label} → ${palaceTag(graph, e.to)}`);

  // --- palaceContext ---
  const ctx: string[] = [];
  const majorLabels = majorStars.map((n) => n.label);
  const starText = majorLabels.length
    ? majorLabels.join(", ")
    : minorStars.length
      ? `Vô Chính Diệu (bàng tinh: ${minorStars.slice(0, 4).map((n) => n.label).join(", ")})`
      : "Vô Chính Diệu";
  ctx.push(`Cung ${pnode.label} (${pnode.data?.branch || "?"}) thủ ${starText}`);
  if (tamHop.length) ctx.push(`tam hợp ${tamHop.map((n) => palaceTag(graph, n.id)).join(" + ")}`);
  if (xung.length) ctx.push(`xung chiếu ${xung.map((n) => palaceTag(graph, n.id)).join(", ")}`);
  if (nhiHop.length) ctx.push(`nhị hợp ${nhiHop.map((n) => palaceTag(graph, n.id)).join(", ")}`);
  if (lucHai.length) ctx.push(`lục hại ${lucHai.map((n) => palaceTag(graph, n.id)).join(", ")}`);
  const selfs: string[] = pnode.data?.selfMutagens || [];
  if (selfs.length) ctx.push(`tự hóa ${selfs.join(", ")}`);
  const stem = pnode.data?.heavenlyStem ? ` (can ${String(pnode.data.heavenlyStem).toUpperCase()})` : "";
  if (flights.length) ctx.push(`phi tứ hóa${stem}: ${flights.join("; ")}`);
  const palaceContext = ctx.join(" — ");

  // --- relatedInsights ---
  const insights: string[] = [];
  const pushInsight = (line: string) => {
    const t = truncateText(line, 220);
    if (t && !insights.includes(t)) insights.push(t);
  };

  // 1) Đàm Tinh của sao chính trong cung (fallback: sao phụ khi vô chính diệu)
  const tinhStars = (majorStars.length ? majorStars : minorStars).slice(0, 3);
  for (const sn of tinhStars) {
    const tinh = sn.data?.tinhTinh;
    if (tinh) pushInsight(`[Đàm Tinh] ${sn.label}: ${tinh}`);
  }

  // 2) combo/giai-hoa kề cung hoặc kề sao trong cung
  const starIdSet = new Set(starEdges.map((e) => e.to));
  let comboCount = 0;
  let giaiCount = 0;
  for (const e of incident) {
    if (e.type === "combo" && comboCount < 4) {
      pushInsight(`[Kinh nghiệm] ${e.label} (${graph.nodes.get(e.from)?.label} ↔ ${graph.nodes.get(e.to)?.label})`);
      comboCount++;
    } else if (e.type === "giai-hoa" && giaiCount < 3) {
      pushInsight(`[Giải hóa] ${e.label} (${graph.nodes.get(e.from)?.label} ↔ ${graph.nodes.get(e.to)?.label})`);
      giaiCount++;
    }
  }
  for (const sId of starIdSet) {
    if (comboCount >= 4 && giaiCount >= 3) break;
    for (const e of incidentEdges(graph, sId)) {
      if (e.type === "combo" && comboCount < 4) {
        pushInsight(`[Kinh nghiệm] ${e.label} (${graph.nodes.get(e.from)?.label} ↔ ${graph.nodes.get(e.to)?.label})`);
        comboCount++;
      } else if (e.type === "giai-hoa" && giaiCount < 3) {
        pushInsight(`[Giải hóa] ${e.label} (${graph.nodes.get(e.from)?.label} ↔ ${graph.nodes.get(e.to)?.label})`);
        giaiCount++;
      }
    }
  }

  // 3) fallback: mẫu Kinh Nghiệm tag đúng tên cung
  if (insights.length < 3) {
    const pn = normalizeStarName(pnode.label);
    for (const e of KINH_NGHIEM_KNOWLEDGE) {
      if (insights.length >= 5) break;
      const hit = (e.tags || []).some((t) => {
        const tn = normalizeStarName(t);
        return tn === pn || tn.includes(pn);
      });
      if (hit) pushInsight(`[Kinh nghiệm] ${e.title}: ${e.content}`);
    }
  }

  // --- tensions ---
  const tensions: string[] = [];
  const pushTension = (line: string) => {
    const t = truncateText(line, 200);
    if (t && !tensions.includes(t)) tensions.push(t);
  };
  for (const n of lucHai) pushTension(`Lục hại với ${palaceTag(graph, n.id)}`);
  for (const e of incident) {
    if (e.type === "han-ap-luc" && e.to === pid) pushTension(e.label || edgeInsightLine(graph, e));
    if (e.type === "phi-hoa" && e.from === pid && (e.label || "").includes("Kỵ")) {
      pushTension(`${e.label} từ ${palaceTag(graph, pid)} bay vào ${palaceTag(graph, e.to)}`);
    }
  }
  // xung chiếu sang cung nhiều sát/kỵ
  for (const n of xung) {
    const sat = incidentEdges(graph, n.id)
      .filter((e) => e.type === "han-ap-luc" && e.to === n.id)
      .map((e) => graph.nodes.get(e.from)?.label)
      .filter(Boolean);
    if (sat.length) pushTension(`Xung chiếu ${palaceTag(graph, n.id)} có ${sat.join(", ")}`);
  }

  return {
    palaceContext,
    relatedInsights: insights.slice(0, 12),
    tensions: tensions.slice(0, 10),
  };
}
