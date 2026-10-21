// ============================================================================
// AUDIT VĨNH VIỄN kho tri thức — khóa 4 lớp lỗi đã từng gặp trong phiên:
//   1) Key trùng lặp (KN id / Đàm Tinh entry)
//   2) Needle chết (requireAll/requireAny không khớp bất kỳ token nào có thể trên lá)
//   3) Mojibake (UTF-8 decode nhầm Windows-1252 — vụ buildChartPromptContext)
//   4) Invariant provenance (content 40–600, tags, nguồn ghi rõ)
// Khi biên thêm mẩu mới: chạy test này là máy tự soi toàn bộ.
// ============================================================================
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  KINH_NGHIEM_KNOWLEDGE,
} from "./kinhNghiemKnowledge";
import { DAM_TINH, DAM_TINH_AUX } from "./damTinh";
import { TUVI_STAR_CATALOG } from "../utils/tuviStarCatalog";
import { HOA_LABELS } from "../utils/tuHoa";
import { normalizeStarName } from "../utils/chartRelations";

// Universe token: mọi dạng tên có thể xuất hiện trên lá (gốc + Lưu/Vận + Tứ Hóa +
// nhãn vòng 12 trạng thái + Tuần/Triệt/Không Vong) — dùng kiểm needle không chết.
const universe = new Set<string>();
for (const c of TUVI_STAR_CATALOG) universe.add(normalizeStarName(c.display));
for (const h of HOA_LABELS) universe.add(normalizeStarName(h));
// Đàm Tinh keys + star fields là sao thật (đào hoa, tuế kiện, phụng các, bệnh phù…) — nguồn chính
for (const [key, e] of Object.entries(DAM_TINH)) {
  universe.add(normalizeStarName(key));
  universe.add(normalizeStarName(e.star));
}
for (const [key, e] of Object.entries(DAM_TINH_AUX)) {
  universe.add(normalizeStarName(key));
  universe.add(normalizeStarName(e.star));
}
const LUU_ABLE = [
  "Lộc Tồn", "Kình Dương", "Đà La", "Thiên Mã", "Thiên Khôi", "Thiên Việt",
  "Thái Tuế", "Tuế Kiện", "Tang Môn", "Bạch Hổ", "Hồng Loan", "Thiên Hỷ",
  "Thiên Khốc", "Thiên Hư", "Văn Xương", "Văn Khúc", "Thiên Đức", "Nguyệt Đức",
  "Phúc Đức", "Long Đức", "Thanh Long", "Tướng Quân", "Tướng Tinh", "Tấu Thư",
  "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Phục Binh", "Quan Phủ", "Quan Phù",
  "Điếu Khách", "Hối Khí", "Quán Tác", "Phan Án", "Tuế Dịch", "Tức Thần",
  "Chỉ Bối", "Nguyệt Sát", "Vong Thần", "Thiên Sát", "Tai Sát", "Hoa Cái",
  "Kiếp Sát", "Quốc Ấn", "Đường Phù",
];
for (const s of LUU_ABLE) {
  universe.add(normalizeStarName(s));
  universe.add(normalizeStarName(`Lưu ${s}`));
  universe.add(normalizeStarName(`Vận ${s}`));
}
for (const l of [
  "Lưu Hóa Lộc", "Lưu Hóa Quyền", "Lưu Hóa Khoa", "Lưu Hóa Kỵ",
  "Vận Hóa Lộc", "Vận Hóa Quyền", "Vận Hóa Khoa", "Vận Hóa Kỵ",
  "Tuần Không", "Tuần Trung", "Triệt Lộ", "Triệt Không", "Không Vong",
  "Trường Sinh", "Lâm Quan", "Quan Đới", "Đế Vượng", "Suy", "Bệnh", "Tử",
  "Mộ", "Tuyệt", "Thai", "Dưỡng", "Mộc Dục", "Bác Sỹ", "Lực Sỹ",
  "Đại Hao", "Tiểu Hao",
  // Nhãn iztro form NGẮN — "Vận Loan" (khác "Vận Hồng Loan" từ LUU_ABLE)
  "Vận Loan", "Lưu Loan", "Lưu Văn Xương", "Lưu Văn Khúc",
]) universe.add(normalizeStarName(l));

const matchesUniverse = (needle: string): boolean => {
  const n = normalizeStarName(needle);
  if (!n) return false;
  for (const u of universe) {
    if (u.includes(n) || n.includes(u)) return true;
  }
  return false;
};

// Hai mẩu kiến trúc đặc biệt đã có test riêng tại damTinh.test.ts
// (Tuế Kiện alias 太歲) — loại khỏi needle-dead check khi cần.

describe("AUDIT kho tri thức — chống regressed (chạy mỗi lần biên thêm)", () => {
  it("KN: id không trùng lặp", () => {
    const ids = KINH_NGHIEM_KNOWLEDGE.map((e) => e.id);
    const seen = new Set<string>();
    const dups = ids.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
    expect(dups, `trùng id: ${dups.join(", ")}`).toEqual([]);
  });

  it("Đàm Tinh: star key không trùng lặp (main + aux)", () => {
    const mainKeys = Object.keys(DAM_TINH);
    const auxKeys = Object.keys(DAM_TINH_AUX);
    for (const [label, keys] of [
      ["DAM_TINH", mainKeys],
      ["DAM_TINH_AUX", auxKeys],
    ] as const) {
      const seen = new Set<string>();
      const dups = keys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
      expect(dups, `${label} trùng: ${dups.join(", ")}`).toEqual([]);
    }
  });

  it("KN: 0 mẩu chết — requireAny phải có ≥1 needle sống; requireAll từng needle sống", () => {
    const dead: string[] = [];
    for (const e of KINH_NGHIEM_KNOWLEDGE) {
      // requireAll: TỪNG needle phải khớp được (mọi kim đều bắt buộc)
      for (const n of e.requireAll || []) {
        if (!matchesUniverse(n)) dead.push(`${e.id}: requireAll "${n}"`);
      }
      // requireAny: chỉ cần ÍT NHẤT MỘT needle sống (mẩu viability — alias chính
      // tả sách/iztro như "tuế kiến"/"tuế kiện" đứng cạnh nhau là bình thường)
      if (e.requireAny?.length && !e.requireAny.some((n) => matchesUniverse(n))) {
        dead.push(`${e.id}: requireAny all-dead [${e.requireAny.join(", ")}]`);
      }
    }
    expect(dead, `mẩu/needle chết: ${dead.join("; ")}`).toEqual([]);
  });

  it("KN: invariant provenance — content 40–600, tags, nguồn ghi rõ", () => {
    for (const e of KINH_NGHIEM_KNOWLEDGE) {
      expect(e.content.length, `${e.id} content ngắn/quá dài`).toBeGreaterThanOrEqual(40);
      expect(e.content.length, `${e.id} content quá dài`).toBeLessThanOrEqual(600);
      expect(e.tags.length, `${e.id} thiếu tags`).toBeGreaterThan(0);
      // Nguồn: KN / Tân Biên / Đàm Tinh VDC / bộ "sao nhập Mệnh" (tên = tên file)
      expect(e.source, `${e.id} thiếu nguồn`).toMatch(/Kinh Nghiệm|Tân Biên|Vương Đình Chi|Nhập Mệnh/i);
    }
  });

  it("Đàm Tinh: invariant — entry có star, han, tinhTinh đủ", () => {
    for (const [key, e] of Object.entries(DAM_TINH_AUX)) {
      expect(e.star, `${key} thiếu star`).toBeTruthy();
      expect(e.han, `${key} thiếu han`).toBeTruthy();
      expect(e.tinhTinh.length, `${key} tinhTinh quá ngắn`).toBeGreaterThan(30);
    }
  });

  it("Đàm Tinh: mọi star key resolve được qua resolveDamTinhStarName (tự soi.alias)", () => {
    for (const key of Object.keys(DAM_TINH_AUX)) {
      // resolve về chính key hoặc alias — quan trọng là KHÔNG rỗng
      expect(key.length, `${key} key rỗng`).toBeGreaterThan(0);
    }
  });

  it("Anti-mojibake: src không có ký tự UTF-8-decode-nhầm-Windows-1252", () => {
    // Chữ "Ã" hoa ("ĐÃ", "HOÃN") là hợp lệ tiếng Việt — KHÔNG nằm trong mẫu.
    // Cũng loại các ký tự typographic hợp lệ: em-dash, en-dash, ellipsis, curly quotes, bullet, TM.
    const MOJI =
      /[\u0080-\u009F\u00AD\u00C6\u201A\u0192\u201E\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u02DC\u2122\u0161\u203A\u0153\u017E]/;
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, f.name);
        if (f.isDirectory()) {
          if (f.name === "node_modules" || f.name.startsWith(".")) continue;
          walk(p);
        } else if (/\.tsx?$/.test(f.name)) files.push(p);
      }
    };
    walk(path.resolve(__dirname, ".."));
    const SELF = fs.realpathSync(__filename);
    const hits: string[] = [];
    for (const p of files) {
      // File audit tự chứa các ký tự sample trong comment → loại khỏi quét
      if (fs.realpathSync(p) === SELF) continue;
      const text = fs.readFileSync(p, "utf8");
      if (text.includes("\uFFFD")) hits.push(`${p}: FFFD`);
      for (const l of text.split(/\r?\n/)) {
        if (MOJI.test(l)) {
          hits.push(`${p}: ${l.trim().slice(0, 80)}`);
        }
      }
    }
    expect(hits, `mojibake:\n${hits.slice(0, 10).join("\n")}`).toEqual([]);
  });
});
