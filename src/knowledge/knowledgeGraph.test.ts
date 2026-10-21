// ============================================================================
// TEST KNOWLEDGE GRAPH — build / node-edge cấu trúc / multi-hop / query prompt
// Fixture: lá số thật qua generateTuviAstrolabe + buildInterpretPayload
// (2001-07-08 05:15, Nam, miền Nam) — cùng cách neo lá như các test khác.
// ============================================================================

import { describe, expect, it } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { TUVI_STAR_CATALOG } from "../utils/tuviStarCatalog";
import {
  buildKnowledgeGraph,
  incidentEdges,
  queryGraphForInterpretation,
  resolveNodeId,
  traverseFrom,
  type KnowledgeGraph,
} from "./knowledgeGraph";

const fixtureGraph = (): KnowledgeGraph => {
  const payload = buildInterpretPayload(
    generateTuviAstrolabe("2001-07-08", "05:15", BIRTHPLACE.SOUTH, "Nam"),
    2026,
  );
  return buildKnowledgeGraph(payload.palaces || [], TUVI_STAR_CATALOG);
};

describe("buildKnowledgeGraph — dựng graph từ lá số", () => {
  it("build không lỗi từ fixture chart, có node + cạnh", () => {
    let g: KnowledgeGraph | null = null;
    expect(() => {
      g = fixtureGraph();
    }).not.toThrow();
    expect(g).not.toBeNull();
    expect(g!.nodes.size).toBeGreaterThan(12);
    expect(g!.edges.length).toBeGreaterThan(30);
    // adjacency bắng đủ cho mọi node có cạnh
    for (const e of g!.edges) {
      expect(g!.adjacency.has(e.from)).toBe(true);
      expect(g!.adjacency.has(e.to)).toBe(true);
    }
  });

  it("có đủ 12 cung như palace node", () => {
    const g = fixtureGraph();
    const palaceNodes = [...g.nodes.values()].filter((n) => n.type === "palace");
    expect(palaceNodes.length).toBeGreaterThanOrEqual(12);
    const labels = palaceNodes.map((n) => n.label);
    expect(labels).toContain("Mệnh");
    expect(labels).toContain("Tài Bạch");
  });

  it("mọi cung đều có 2 cạnh tam-hop; đếm chuẩn 12/6/6 cạnh tam-hop/xung/nhị-hợp/lục-hại", () => {
    const g = fixtureGraph();
    const palaceNodes = [...g.nodes.values()].filter((n) => n.type === "palace");
    for (const p of palaceNodes) {
      const tam = incidentEdges(g, p.id).filter((e) => e.type === "tam-hop");
      expect(tam.length).toBe(2); // (b+4) + (b+8), mỗi cặp 1 cạnh
    }
    const countType = (t: string) => g.edges.filter((e) => e.type === t).length;
    expect(countType("tam-hop")).toBe(12);
    expect(countType("xung-chieu")).toBe(6);
    expect(countType("nhi-hop")).toBe(6);
    expect(countType("luc-hai")).toBe(6);
  });

  it("mỗi sao chính tinh trên lá đều là star node", () => {
    const payload = buildInterpretPayload(
      generateTuviAstrolabe("2001-07-08", "05:15", BIRTHPLACE.SOUTH, "Nam"),
      2026,
    );
    const g = fixtureGraph();
    const majors = (payload.palaces || []).flatMap((p: any) =>
      (p?.majorStars || []).map((s: any) => String(s?.name || "")),
    );
    expect(majors.length).toBeGreaterThan(0);
    for (const name of majors) {
      expect(resolveNodeId(g, name)).not.toBeNull();
    }
  });

  it("traverseFrom Mệnh (2 hops) trả các đường liên kết hợp lệ; lọc edgeTypes đúng loại", () => {
    const g = fixtureGraph();
    const start = resolveNodeId(g, "Mệnh")!;
    expect(start).toBeTruthy();

    const results = traverseFrom(g, "Mệnh", 2);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.path[0]).toBe(start);
      expect(r.edges.length).toBe(r.path.length - 1);
      expect(r.edges.length).toBeGreaterThanOrEqual(1);
      expect(r.insights.length).toBe(r.edges.length);
      for (const line of r.insights) expect(line.length).toBeGreaterThan(0);
      // không lặp node trên path
      expect(new Set(r.path).size).toBe(r.path.length);
    }

    // lọc theo edgeTypes
    const onlyTamHop = traverseFrom(g, "Mệnh", 2, ["tam-hop"]);
    expect(onlyTamHop.length).toBeGreaterThan(0);
    for (const r of onlyTamHop) {
      for (const e of r.edges) expect(e.type).toBe("tam-hop");
    }

    // depth 1 — chỉ 1 bước, vẫn có kết quả
    const depth1 = traverseFrom(g, "Mệnh", 1);
    expect(depth1.length).toBeGreaterThan(0);
    for (const r of depth1) expect(r.edges.length).toBe(1);
  });

  it("queryGraphForInterpretation trả context + insights không rỗng cho Mệnh và Tài Bạch", () => {
    const g = fixtureGraph();
    const menh = queryGraphForInterpretation(g, "Mệnh");
    expect(menh.palaceContext).toMatch(/Cung Mệnh/);
    expect(menh.palaceContext).toMatch(/tam hợp/);
    expect(menh.palaceContext).toMatch(/xung chiếu/);
    expect(menh.relatedInsights.length).toBeGreaterThan(0);

    const tai = queryGraphForInterpretation(g, "Tài Bạch");
    expect(tai.palaceContext).toMatch(/Tài Bạch/);
    expect(tai.relatedInsights.length).toBeGreaterThan(0);
  });

  it("cạnh hợp lệ: weight 1-10, không self-loop, label tiếng Việt cho quan hệ hình học", () => {
    const g = fixtureGraph();
    for (const e of g.edges) {
      expect(e.weight).toBeGreaterThanOrEqual(1);
      expect(e.weight).toBeLessThanOrEqual(10);
      expect(e.from).not.toBe(e.to);
      if (e.type === "tam-hop" || e.type === "xung-chieu" || e.type === "luc-hai") {
        expect(e.label).toBeTruthy();
      }
    }
  });
});
