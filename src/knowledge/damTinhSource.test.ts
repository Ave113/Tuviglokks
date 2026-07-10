import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import {
  clearDamTinhSourceCache,
  DAM_TINH_MAIN_STAR_HEADERS,
  DAM_TINH_SOURCE_PATH,
  DAM_TINH_SOURCE_RELATIVE,
  getDamTinhSourceIndex,
  getDamTinhSourceSectionByHan,
  getDamTinhSourceSectionByStar,
  listDamTinhMainSourceSections,
  readDamTinhSourceRaw,
} from "./damTinhSource";

describe("damTinhSource", () => {
  beforeEach(() => {
    clearDamTinhSourceCache();
  });

  it("file nguồn nằm trong src/knowledge/data/, không ở root", () => {
    expect(DAM_TINH_SOURCE_RELATIVE).toBe("src/knowledge/data/vuongdinhchidamtinh.txt");
    expect(fs.existsSync(DAM_TINH_SOURCE_PATH)).toBe(true);
    const stat = fs.statSync(DAM_TINH_SOURCE_PATH);
    expect(stat.size).toBeGreaterThan(300_000);
  });

  it("readDamTinhSourceRaw cache — hai lần gọi trả cùng tham chiếu", () => {
    const a = readDamTinhSourceRaw();
    const b = readDamTinhSourceRaw();
    expect(a).toBe(b);
    expect(a).toContain("谈星");
  });

  it("trích mục 紫微 theo Hán (phồn thể) và theo tên Việt Tử Vi", () => {
    const byHan = getDamTinhSourceSectionByHan("紫微");
    expect(byHan).not.toBeNull();
    expect(byHan!.content).toContain("紫微属阴土");

    const byStar = getDamTinhSourceSectionByStar("Tử Vi");
    expect(byStar?.header).toBe("紫微");
    expect(byStar?.content).toContain("北斗星系主星");
  });

  it("map phồn thể → giản thể cho tiêu đề mục (天機 → 天机)", () => {
    const section = getDamTinhSourceSectionByHan("天機");
    expect(section?.header).toBe("天机");
    expect(section?.content.length).toBeGreaterThan(200);
  });

  it("chỉ mục đủ 14 chính tinh trong phần谈星", () => {
    const main = listDamTinhMainSourceSections();
    expect(main).toHaveLength(DAM_TINH_MAIN_STAR_HEADERS.length);
    for (const header of DAM_TINH_MAIN_STAR_HEADERS) {
      expect(getDamTinhSourceIndex().has(header)).toBe(true);
    }
  });

  it("tên sao không có trong DAM_TINH trả null", () => {
    expect(getDamTinhSourceSectionByStar("Sao Không Tồn Tại")).toBeNull();
  });
});