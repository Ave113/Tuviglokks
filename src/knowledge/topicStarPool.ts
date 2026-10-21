/**
 * Map câu hỏi / chủ đề → cung + kim sao ưu tiên.
 * Dùng CHUNG: /api/chat (pool tủ tinh hoa) + có thể interpret sau này.
 * Không thay lá máy — chỉ thu hẹp focus để lấy đúng ngăn tủ.
 */

export type TopicKey =
  | "menh"
  | "tai"
  | "quan"
  | "tinh"
  | "suc"
  | "ban"
  | "gia"
  | "di"
  | "diem_mu"
  | "han"
  | "general";

export interface TopicPoolResult {
  topics: TopicKey[];
  /** Keyword cung (khớp p.name) */
  palaceKeywords: string[];
  /** Tag bổ sung cho retrieve (giải hóa / kn) */
  extraTags: string[];
}

const RULES: { key: TopicKey; re: RegExp; palaces: string[]; tags: string[] }[] = [
  {
    key: "tai",
    re: /ti[eề]n|t[aà]i|l[oộ]c|l[uư][oơ]ng|n[oợ]|đ[aầ]u\s*t[uư]|gi[aà]u|ngh[eè]o|chi\s*ti[eê]u|gi[uữ]\s*ti[eề]n/i,
    palaces: ["Tài", "Điền", "Phúc"],
    tags: ["tiền", "tài bạch", "giữ tiền", "hóa lộc", "hóa kỵ"],
  },
  {
    key: "quan",
    re: /vi[eệ]c|ngh[eề]|c[oô]ng\s*vi[eệ]c|s[uự]\s*nghi[eệ]p|th[iăng]|h[oọ]c|thi\s*c[uử]|l[uư][oơ]ng|s[eế]p|th[aăng]\s*ti[eế]n/i,
    palaces: ["Quan", "Mệnh", "Phụ"],
    tags: ["sự nghiệp", "học", "quan lộc", "chuyên môn"],
  },
  {
    key: "tinh",
    re: /t[iì]nh|y[eê]u|c[uư][oớ]i|v[oợ]|ch[oồ]ng|ng[uư][oờ]i\s*y[eê]u|h[oô]n\s*nh[aâ]n|crush|ng[uư][oờ]i\s*y[eêu]/i,
    palaces: ["Phu", "Phối"],
    tags: ["phu thê", "tình cảm", "hôn nhân", "văn khúc"],
  },
  {
    key: "suc",
    re: /s[uứ]c\s*kh[oỏ]e|b[eệ]nh|m[eệ]t|ng[uủ]|đau|m[oổ]|tai\s*n[aạ]n|stress|th[aầ]n\s*kinh/i,
    palaces: ["Tật", "Mệnh"],
    tags: ["tật ách", "sức khỏe", "thiên hình"],
  },
  {
    key: "ban",
    re: /b[aạ]n|h[oộ]i\s*nh[oó]m|đ[oồ]ng\s*nghi[eệ]p|c[oộ]ng\s*s[uự]|đ[oố]i\s*t[aá]c|mxh|m[aạ]ng\s*x[aã]/i,
    palaces: ["Nô", "Huynh"],
    tags: ["nô bộc", "bạn bè", "không kiếp", "thị phi"],
  },
  {
    key: "gia",
    re: /cha|m[eẹ]|b[oố]|gia\s*đ[iì]nh|ph[uụ]\s*huynh|nh[aà]|anh\s*ch[iị]|em\s*ru[oộ]t/i,
    palaces: ["Phụ", "Huynh", "Điền"],
    tags: ["phụ mẫu", "gia đình", "kình"],
  },
  {
    key: "di",
    re: /đi\s*xa|xu[aấ]t\s*ngo[aạ]i|du\s*h[oọ]c|c[oô]ng\s*t[aá]c|di\s*chuy[eể]n|n[uướ]c\s*ngo[aà]i|xe\s*c[oộ]/i,
    palaces: ["Thiên Di", "Tật"],
    tags: ["thiên di", "thiên mã", "giao thông"],
  },
  {
    key: "diem_mu",
    re: /đi[eể]m\s*m[uù]|m[uù]|t[ií]nh\s*c[aá]ch|b[aả]n\s*th[aâ]n|t[oâ]i\s*l[aà]\s*ng[uư][oờ]i|va\s*đ[aậ]p|y[eế]u\s*đi[eể]m/i,
    palaces: ["Mệnh", "Phúc"],
    tags: ["điểm mù", "mệnh", "overthink", "giải hóa"],
  },
  {
    key: "han",
    re: /n[aă]m\s*nay|n[aă]m\s*\d{4}|h[aạ]n|đ[aạ]i\s*h[aạ]n|ti[eể]u\s*h[aạ]n|th[aá]ng|v[aậ]n/i,
    palaces: ["Mệnh", "Quan", "Tài"],
    tags: ["hạn", "lưu", "thái tuế", "đại hạn"],
  },
];

/**
 * Phân tích câu hỏi → topics + cung ưu tiên.
 * Không match → general (Mệnh + Tài + Quan).
 */
export function resolveTopicPool(query?: string): TopicPoolResult {
  const q = String(query || "").trim();
  if (!q) {
    return {
      topics: ["general"],
      palaceKeywords: ["Mệnh", "Tài", "Quan"],
      extraTags: [],
    };
  }

  const topics: TopicKey[] = [];
  const palaceKeywords: string[] = [];
  const extraTags: string[] = [];

  for (const r of RULES) {
    if (r.re.test(q)) {
      topics.push(r.key);
      for (const p of r.palaces) {
        if (!palaceKeywords.includes(p)) palaceKeywords.push(p);
      }
      for (const t of r.tags) {
        if (!extraTags.includes(t)) extraTags.push(t);
      }
    }
  }

  if (topics.length === 0) {
    return {
      topics: ["general"],
      palaceKeywords: ["Mệnh", "Tài", "Quan", "Phu", "Nô"],
      extraTags: [],
    };
  }

  // Luôn neo nhẹ Mệnh khi hỏi sâu
  if (!palaceKeywords.some((p) => /mệnh/i.test(p))) {
    palaceKeywords.unshift("Mệnh");
  }

  return { topics, palaceKeywords, extraTags };
}

/** Lấy tên sao (chính + phụ trọng) từ các cung khớp keyword. */
export function starsFromPalaces(
  palaces: any[] | undefined,
  palaceKeywords: string[],
): string[] {
  if (!Array.isArray(palaces) || !palaceKeywords.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of palaces) {
    const name = String(p?.name || "");
    if (!palaceKeywords.some((k) => name.includes(k))) continue;
    for (const s of [...(p.majorStars || []), ...(p.minorStars || []), ...(p.adjectiveStars || [])]) {
      const n = String(s?.name || s || "")
        .replace(/\[SAO\s*(?:LƯU|VẬN)\]\s*/gi, "")
        .trim();
      if (!n || seen.has(n.toLowerCase())) continue;
      // bỏ bớt tạp quá nhẹ nếu không phải sát/cát trọng
      if (
        !p.majorStars?.some((m: any) => String(m?.name) === n) &&
        !/Kình|Đà|Không|Kiếp|Hỏa|Linh|Hóa |Lộc|Văn|Tuần|Triệt|Hình|Mã|Khôi|Việt|Tang|Hổ/i.test(n)
      ) {
        continue;
      }
      seen.add(n.toLowerCase());
      out.push(n);
    }
  }
  return out;
}
