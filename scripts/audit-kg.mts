// AUDIT Knowledge Graph toàn diện: build, traverse, query, prompt injection.
import fs from "fs";
import { makeChartPayload } from "../src/server/test/fixtures.ts";
import { buildChartPromptContext } from "../src/prompt/buildChartPromptContext.ts";
import { buildInterpretUserPrompt } from "../src/prompt/formatInterpretPrompt.ts";
import { buildKnowledgeGraph, queryGraphForInterpretation, traverseFrom } from "../src/knowledge/knowledgeGraph.ts";

const problems: string[] = [];
const okays: string[] = [];

const c: any = makeChartPayload();
const pal = c.palaces || [];

// ===== 1) Build graph — không crash, đúng cấu trúc =====
let graph: ReturnType<typeof buildKnowledgeGraph>;
try {
  graph = buildKnowledgeGraph(pal, []);
  okays.push(`buildKnowledgeGraph: ${graph.nodes.size} nodes, ${graph.edges.length} edges — không crash`);
} catch (e: any) {
  problems.push(`buildKnowledgeGraph CRASH: ${e.message}`);
  graph = { nodes: new Map(), edges: [], adjacency: new Map() };
}

// ===== 2) Node coverage — đủ 12 cung? =====
{
  const palaceNodes = [...graph.nodes.values()].filter((n) => n.type === "palace");
  if (palaceNodes.length >= 12) okays.push(`Palace nodes: ${palaceNodes.length}/12`);
  else problems.push(`Palace nodes: chỉ ${palaceNodes.length}/12 — thiếu cung`);
  const starNodes = [...graph.nodes.values()].filter((n) => n.type === "star");
  if (starNodes.length > 50) okays.push(`Star nodes: ${starNodes.length}`);
  else problems.push(`Star nodes: chỉ ${starNodes.length} — ít, có thể thiếu sao`);
}

// ===== 3) Edge coverage — đủ loại? =====
{
  const edgeTypes = new Map<string, number>();
  for (const e of graph.edges) edgeTypes.set(e.type, (edgeTypes.get(e.type) || 0) + 1);
  const required = ["tam-hop", "xung-chieu", "nhi-hop", "luc-hai", "phi-hoa", "cung-chua-sao"];
  for (const t of required) {
    const n = edgeTypes.get(t) || 0;
    if (n > 0) okays.push(`Edge "${t}": ${n}`);
    else problems.push(`Edge "${t}": 0 — thiếu loại edge cần thiết`);
  }
}

// ===== 4) Traversal từ Mệnh — có kết quả? =====
{
  const menhNode = [...graph.nodes.values()].find((n) => n.type === "palace" && n.label.includes("Mệnh"));
  if (!menhNode) { problems.push("Không tìm thấy node cung Mệnh"); }
  else {
    try {
      const paths = traverseFrom(graph, menhNode.id, 2);
      if (paths.length > 0) okays.push(`traverseFrom Mệnh depth 2: ${paths.length} paths`);
      else problems.push("traverseFrom Mệnh depth 2: 0 paths — graph không liên kết");
    } catch (e: any) { problems.push(`traverseFrom CRASH: ${e.message}`); }
  }
}

// ===== 5) queryGraphForInterpretation — output có ý nghĩa? =====
{
  try {
    const q = queryGraphForInterpretation(graph, "Mệnh");
    if (q.palaceContext.length > 50) okays.push(`palaceContext: ${q.palaceContext.length} ký tự`);
    else problems.push(`palaceContext quá ngắn: ${q.palaceContext.length}`);
    if (q.relatedInsights.length > 0) okays.push(`relatedInsights: ${q.relatedInsights.length}`);
    else problems.push("relatedInsights: 0 — không có insight");
    if (q.tensions.length > 0) okays.push(`tensions: ${q.tensions.length}`);
    // Tensions có rò tiếng Anh?
    const eng = q.tensions.filter((t) => /\b(disease|socket|error)\b/i.test(t));
    if (eng.length) problems.push(`Tensions rò tiếng: ${eng.join(", ")}`);
  } catch (e: any) { problems.push(`queryGraphForInterpretation CRASH: ${e.message}`); }
}

// ===== 6) Prompt injection — knowledgeGraphStr trong context =====
{
  const ctx: any = buildChartPromptContext(c);
  const kg = String(ctx.knowledgeGraphStr || "");
  if (kg.length > 100) okays.push(`knowledgeGraphStr: ${kg.length} ký tự trong ctx`);
  else problems.push(`knowledgeGraphStr quá ngắn: ${kg.length} ký tự`);
  // Nội dung có ý nghĩa? (chứa tên cung/sao)
  if (kg.includes("Mệnh") || kg.includes("Thìn")) okays.push("KG content: có tên cung/sao thật");
  else problems.push("KG content: không chứa tên cung/sao — có thể là rác");
  // Mojibake
  const MOJI = /[\u0080-\u009F\u00AD\u00C6]/;
  if (MOJI.test(kg)) problems.push("KG content: có mojibake");
  // Trong user prompt?
  const usr = buildInterpretUserPrompt(ctx, c);
  if (usr.includes("KNOWLEDGE GRAPH")) okays.push("User prompt: có block KNOWLEDGE GRAPH");
  else problems.push("User prompt: KHÔNG có block KNOWLEDGE GRAPH — injection hỏng");
}

// ===== 7) Performance — build + query nhanh không? =====
{
  const t0 = performance.now();
  const g2 = buildKnowledgeGraph(pal, []);
  const t1 = performance.now();
  queryGraphForInterpretation(g2, "Mệnh");
  const t2 = performance.now();
  const buildMs = Math.round(t1 - t0);
  const queryMs = Math.round(t2 - t1);
  if (buildMs < 200) okays.push(`buildKnowledgeGraph: ${buildMs}ms (nhanh)`);
  else problems.push(`buildKnowledgeGraph: ${buildMs}ms — CHẬM, có thể nghẽn mỗi request`);
  if (queryMs < 50) okays.push(`queryGraphForInterpretation: ${queryMs}ms (nhanh)`);
  else problems.push(`queryGraphForInterpretation: ${queryMs}ms — CHẬM`);
}

// ===== 8) Edge case — chart rác / thiếu cung =====
{
  try {
    const emptyGraph = buildKnowledgeGraph([], []);
    okays.push(`buildKnowledgeGraph([]) : ${emptyGraph.nodes.size} nodes, 0 crash`);
  } catch (e: any) { problems.push(`buildKnowledgeGraph([]) CRASH: ${e.message}`); }
  try {
    const q = queryGraphForInterpretation(buildKnowledgeGraph([], []), "Mệnh");
    okays.push(`queryGraph on empty graph: không crash (palaceContext len=${q.palaceContext.length})`);
  } catch (e: any) { problems.push(`queryGraph on empty graph CRASH: ${e.message}`); }
}

console.log("=== OK ===\n" + okays.map((s) => "  ✓ " + s).join("\n"));
console.log("\n=== VẤN ĐỀ ===\n" + (problems.length ? problems.map((s) => "  !! " + s).join("\n") : "  (không có)"));
