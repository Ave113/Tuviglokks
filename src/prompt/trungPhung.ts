// ============================================================================
// TRÙNG PHÙNG 3 TẦNG — Gốc × Vận × Lưu (máy GHIM, AI không được bỏ sót)
//
// Biến cố bước ngoặt của năm hiếm khi do 1 sao đơn lẻ gây ra — máy quét
// VA CHẠM ĐỒNG CUNG giữa 3 tầng lá số và ghim pin để AI xoáy đúng chỗ:
//   - ĐIỆP KỴ (đồng cung + xung chiếu) / SONG LỘC / ĐIỆP QUYỀN / ĐIỆP KHOA
//   - TRÙNG KÌNH / TRÙNG ĐÀ / TANG-HỔ / SONG MÃ (đồng cung + xung) / SONG HAO
//   - KHÔI-VIỆT ĐIỆP + ĐIỆP KHÔI/VIỆT đơn / THỦY HIỂM
//
// Kỷ luật diễn đạt: gọi THẲNG hiện tượng (kể cả dao kéo/đổ máu ở Trùng Kình),
// nhưng luôn "CÓ XU HƯỚNG + điều kiện + 1 NÊN" — cấm phán tuyệt đối kết cục.
// Điểm chỉ cộng LÓT TAY vào trigger (tránh double-count với pulse sẵn có).
// ============================================================================

import {
  allStarsOf,
  BRANCHES_VI,
  toBranchIndex,
  normalizeStarName,
  mutagenLabelOf,
} from "../utils/chartRelations";
import { resolveDamTinhStarName } from "../knowledge/damTinh";

export type TrungPhungKind =
  | "DIEP_KY"
  | "SONG_LOC"
  | "TRUNG_KINH"
  | "TRUNG_DA"
  | "SONG_MA"
  | "KHOI_VIET_DIEP"
  | "THUY_HIEM"
  | "TANG_HO"
  | "SONG_HAO"
  | "DIEP_QUYEN"
  | "DIEP_KHOA"
  | "DIEP_KHOI"
  | "DIEP_VIET";

export type TrungPhungLayer = "gốc" | "vận" | "lưu";

export interface TrungPhungPin {
  kind: TrungPhungKind;
  /** Nhãn ghim: "ĐIỆP KỴ" | "SONG LỘC" | ... */
  label: string;
  palaceName: string;
  branch: string;
  layers: TrungPhungLayer[];
  /** Kênh đời của cung ghim (AI dệt Tiểu hạn đúng domain). */
  domain: TrungPhungDomain;
  /** Điểm lót tay cho trigger (đã trừ double-count). */
  heat: number;
  /** Cơ chế 1 mạch: việc đời → va chạm → 1 NÊN. */
  mechanism: string;
  /** true nếu pin qua xung chiếu (pin vừa). */
  viaXung?: boolean;
}

export interface TrungPhungResult {
  pins: TrungPhungPin[];
  reportText: string;
}

type Layer = TrungPhungLayer;

interface LayerEntry {
  raw: string;
  layer: Layer;
  /** Tên trần quy về gốc (Thiên Mã, Văn Xương, Kình Dương...). */
  resolved: string;
  norm: string;
  mutagen: string;
}

const stripBracket = (s: string): string =>
  String(s || "").replace(/\[SAO\s*(?:LƯU|VẬN)\]\s*/gi, "").trim();

function layerOf(raw: string): Layer {
  const s = String(raw || "");
  if (/\[SAO\s*LƯU\]/i.test(s) || /^Lưu\s/i.test(stripBracket(s))) return "lưu";
  if (/\[SAO\s*VẬN\]/i.test(s) || /^Vận\s/i.test(stripBracket(s))) return "vận";
  return "gốc";
}

function entriesOf(p: any): LayerEntry[] {
  return allStarsOf(p)
    .map((s: any) => ({ name: String(s?.name || "").trim(), mutagen: s?.mutagen }))
    .filter((s) => s.name)
    .map(({ name: raw, mutagen }) => {
      const resolved = resolveDamTinhStarName(raw);
      return {
        raw,
        layer: layerOf(raw),
        resolved,
        norm: normalizeStarName(resolved),
        mutagen: String(mutagenLabelOf(mutagen) || ""),
      };
    });
}

/** Tên trần có phải Kỵ (mutagen Hóa Kỵ hoặc tên chứa Kỵ, trừ Khoa/Quyền/Lộc)? */
function isKy(e: LayerEntry): boolean {
  if (/Hóa Kỵ/i.test(e.mutagen)) return true;
  const n = `${e.norm} ${stripBracket(e.raw)}`;
  return (
    /Hóa Kỵ|(?:^|[\s])Kỵ/i.test(n) &&
    !/Khoa|Quyền|Lộc/i.test(n.replace(/Hóa Kỵ/gi, ""))
  );
}

/** Sao/thụ "Hóa X" (Quyền/Khoa/Lộc): mutagen hoặc tên chứa đúng cụm. */
function isHoaLabel(e: LayerEntry, word: "Quyền" | "Khoa" | "Lộc"): boolean {
  const re = new RegExp(`Hóa ${word}`, "i");
  if (re.test(e.mutagen)) return true;
  return re.test(`${e.norm} ${stripBracket(e.raw)}`);
}

const hasNorm = (list: LayerEntry[], re: RegExp, layers?: Layer[]): boolean =>
  list.some((e) => (!layers || layers.includes(e.layer)) && re.test(e.norm));

const samePalace = (a: string, b: string): boolean => {
  const x = String(a || "").trim();
  const y = String(b || "").trim();
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.length >= 2 && (x.includes(y) || y.includes(x))) return true;
  return false;
};

const KIND_LABEL: Record<TrungPhungKind, string> = {
  DIEP_KY: "ĐIỆP KỴ",
  SONG_LOC: "SONG LỘC",
  TRUNG_KINH: "TRÙNG KÌNH",
  TRUNG_DA: "TRÙNG ĐÀ",
  SONG_MA: "SONG MÃ",
  KHOI_VIET_DIEP: "KHÔI-VIỆT ĐIỆP",
  THUY_HIEM: "THỦY HIỂM",
  TANG_HO: "TANG-HỔ TRÙNG PHÙNG",
  SONG_HAO: "SONG HAO",
  DIEP_QUYEN: "ĐIỆP QUYỀN",
  DIEP_KHOA: "ĐIỆP KHOA",
  DIEP_KHOI: "ĐIỆP KHÔI",
  DIEP_VIET: "ĐIỆP VIỆT",
};

/** Kênh đời theo tên cung — neo domain cho mechanism (map gọn, không 84 template). */
export type TrungPhungDomain =
  | "tien"
  | "viec"
  | "tinh"
  | "suc"
  | "banthan"
  | "mangluoi"
  | "dichuyen";

const DOMAIN_HINT: Record<TrungPhungDomain, string> = {
  tien: "tiền bạc/tài sản",
  viec: "công việc/học hành",
  tinh: "tình cảm/gia đạo",
  suc: "sức khỏe/thân thể",
  banthan: "bản thân/nội tâm",
  mangluoi: "bạn bè/đồng sự",
  dichuyen: "đi lại/môi trường",
};

function domainOfPalaceName(n: string): TrungPhungDomain {
  const s = String(n || "");
  if (/Tài|Điền/i.test(s)) return "tien";
  if (/Quan|Phụ/i.test(s)) return "viec";
  if (/Phu|Thê|Tử|Huynh/i.test(s)) return "tinh";
  if (/Tật/i.test(s)) return "suc";
  if (/Di(?![\p{L}])/iu.test(s) || /Thiên Di/i.test(s)) return "dichuyen";
  if (/Nô/i.test(s)) return "mangluoi";
  return "banthan";
}

/** Vòng sao theo cung (Tuế Tiền / Bác Sỹ bẩm sinh, Tuế Tiền năm xem). */
const ringOf = (p: any, key: string): string => String(p?.[key] || "").trim();

interface HoaItem {
  hoa: string;
  star: string;
  palaceName?: string;
}

const hoaItems = (chartData: any, key: string): HoaItem[] =>
  ((chartData?.[key]?.items || []) as HoaItem[]).filter((it) => it && it.palaceName);

const hoaTargets = (
  chartData: any,
  re: RegExp,
): { palace: string; layer: Layer }[] =>
  [
    ...hoaItems(chartData, "transitYearlyTuHoa").map((it) => ({ ...it, layer: "lưu" as Layer })),
    ...hoaItems(chartData, "transitDecadalTuHoa").map((it) => ({ ...it, layer: "vận" as Layer })),
  ]
    .filter((it) => re.test(String(it.hoa || "")))
    .map((it) => ({ palace: String(it.palaceName || ""), layer: it.layer }));

const uniqLayers = (entries: LayerEntry[]): Layer[] => [
  ...new Set(entries.map((e) => e.layer)),
];

/**
 * Quét giao thoa 3 tầng trên toàn lá — trả pins đã dedup theo (kind, cung).
 */
export function analyzeTrungPhung(palacesArr: any[], chartData: any): TrungPhungResult {
  const pins: TrungPhungPin[] = [];
  const seen = new Set<string>();
  const push = (pin: TrungPhungPin) => {
    const key = `${pin.kind}@${pin.palaceName}@${pin.viaXung ? "x" : "d"}`;
    if (seen.has(key)) return;
    seen.add(key);
    pins.push(pin);
  };
  const palaces = Array.isArray(palacesArr) ? palacesArr : [];
  const kyHoa = hoaTargets(chartData, /Kỵ/i);
  const locHoa = hoaTargets(chartData, /Lộc/i);
  const quyenHoa = hoaTargets(chartData, /Quyền/i);
  const khoaHoa = hoaTargets(chartData, /Khoa/i);
  const byBranch = new Map<number, any>();
  for (const p of palaces) {
    if (p && typeof p.index === "number") byBranch.set(toBranchIndex(p.index), p);
  }

  for (const p of palaces) {
    if (!p) continue;
    const name = String(p.name || "");
    if (!name) continue;
    const branch = BRANCHES_VI[toBranchIndex(p.index)] || "?";
    const es = entriesOf(p);
    const pdom = domainOfPalaceName(name);
    const dTag = DOMAIN_HINT[pdom];

    // --- ĐIỆP KỴ: Kỵ gốc × Kỵ vận/lưu (sao hoặc Hóa đáp) ---
    const natalKy = es.some((e) => e.layer === "gốc" && isKy(e));
    const layerKyStars = es.filter((e) => e.layer !== "gốc" && isKy(e));
    const layerKyHoas = kyHoa.filter((t) => samePalace(t.palace, name));
    if (natalKy && (layerKyStars.length > 0 || layerKyHoas.length > 0)) {
      const layers: Layer[] = ["gốc", ...uniqLayers(layerKyStars), ...layerKyHoas.map((t) => t.layer)];
      const layersUniq: Layer[] = [...new Set(layers)];
      push({
        kind: "DIEP_KY",
        label: KIND_LABEL.DIEP_KY,
        palaceName: name,
        branch,
        domain: pdom,
        layers: layersUniq,
        heat: 10,
        mechanism:
          `Kỵ gốc × Kỵ ${layersUniq.filter((l) => l !== "gốc").join("/")} đè nhau tại ${name} (kênh ${dTag}) — CÓ XU HƯỚNG tranh chấp, sụp đổ dự án hoặc tai tiếng ở kênh cung này khi giấy tờ/người trung gian lỏng lẻo. NÊN: siết chứng từ, không ký nóng, có người thứ ba chứng kiến.`,
      });
    }

    // --- SONG LỘC: Lộc Tồn/Hóa Lộc gốc × Lộc vận/lưu ---
    const natalLoc =
      hasNorm(es, /Lộc Tồn/i, ["gốc"]) || es.some((e) => e.layer === "gốc" && /Hóa Lộc/i.test(e.mutagen));
    const layerLocStars = es.filter(
      (e) =>
        e.layer !== "gốc" &&
        (hasNorm([e], /Lộc Tồn|Hóa Lộc/i) || /Hóa Lộc/i.test(e.mutagen)),
    );
    const layerLocHoas = locHoa.filter((t) => samePalace(t.palace, name));
    if (natalLoc && (layerLocStars.length > 0 || layerLocHoas.length > 0)) {
      const layers: Layer[] = [
        "gốc",
        ...uniqLayers(layerLocStars),
        ...layerLocHoas.map((t) => t.layer),
      ];
      const layersUniq: Layer[] = [...new Set(layers)];
      push({
        kind: "SONG_LOC",
        label: KIND_LABEL.SONG_LOC,
        palaceName: name,
        branch,
        domain: pdom,
        layers: layersUniq,
        heat: 8,
        mechanism:
          `Lộc gốc × Lộc ${layersUniq.filter((l) => l !== "gốc").join("/")} hội tại ${name} (kênh ${dTag}) ("điệp Lộc" — tiền phải lưu thông mới vượng) — CÓ XU HƯỚNG tiền tài bùng nổ, cơ hội kinh doanh nhân đôi ở kênh cung này. NÊN: mở van thu nhưng van giữ phải cứng (tách ví tích sản, cắt lỗ tự động).`,
      });
    }

    // --- TRÙNG KÌNH / TRÙNG ĐÀ ---
    const natalKinh = hasNorm(es, /Kình/i, ["gốc"]);
    const layerKinhStars = es.filter((e) => e.layer !== "gốc" && /Kình/i.test(e.norm));
    if (natalKinh && layerKinhStars.length > 0) {
      push({
        kind: "TRUNG_KINH",
        label: KIND_LABEL.TRUNG_KINH,
        palaceName: name,
        branch,
        domain: pdom,
        layers: ["gốc", ...uniqLayers(layerKinhStars)],
        heat: 8,
        mechanism:
          `Kình đè Kình tại ${name} (kênh ${dTag}) — CÓ XU HƯỚNG va chạm đổ máu, dao kéo/phẫu thuật, tai nạn xe cộ khi nóng vội hoặc ẩu đả. NÊN: khám sức khỏe định kỳ, an toàn giao thông tuyệt đối, tránh xung đột tay chân, trì hoãn 24h quyết nóng.`,
      });
    }
    const natalDa = hasNorm(es, /Đà/i, ["gốc"]);
    const layerDaStars = es.filter((e) => e.layer !== "gốc" && /Đà/i.test(e.norm));
    if (natalDa && layerDaStars.length > 0) {
      push({
        kind: "TRUNG_DA",
        label: KIND_LABEL.TRUNG_DA,
        palaceName: name,
        branch,
        domain: pdom,
        layers: ["gốc", ...uniqLayers(layerDaStars)],
        heat: 7,
        mechanism:
          `Đà đè Đà tại ${name} (kênh ${dTag}) — CÓ XU HƯỚNG trì trệ dây dưa, gút mắc kéo dài, tiểu nhân ngáng đường ở kênh cung này. NÊN: văn bản hóa mọi thỏa thuận, hạn chót rõ ràng, không để việc tồn đọng.`,
      });
    }

    // --- SONG MÃ (đồng cung mạnh; xung chiếu vừa) ---
    const natalMa = hasNorm(es, /Mã/i, ["gốc"]);
    const layerMaStars = es.filter((e) => e.layer !== "gốc" && /Mã/i.test(e.norm));
    if (natalMa && layerMaStars.length > 0) {
      push({
        kind: "SONG_MA",
        label: KIND_LABEL.SONG_MA,
        palaceName: name,
        branch,
        domain: pdom,
        layers: ["gốc", ...uniqLayers(layerMaStars)],
        heat: 6,
        mechanism:
          `Mã gốc × Mã vận/lưu trùng tại ${name} (kênh ${dTag}) — CÓ XU HƯỚNG thay đổi công việc, chuyển chỗ ở hoặc xuất ngoại/đi xa liên tục trong năm. NÊN: chủ động sắp xếp lịch di chuyển, giấy tờ đi đường đủ, đừng đổi việc tay không.`,
      });
    } else if (!natalMa || layerMaStars.length === 0) {
      // Mã vận/lưu xung Thiên Mã gốc → pin vừa
      const b = toBranchIndex(p.index);
      const opp = byBranch.get((b + 6) % 12);
      if (opp) {
        const oppEs = entriesOf(opp);
        const layerMaHere = es.some((e) => e.layer !== "gốc" && /Mã/i.test(e.resolved));
        const natalMaOpp = oppEs.some((e) => e.layer === "gốc" && /Mã/i.test(e.resolved));
        const layerMaOpp = oppEs.some((e) => e.layer !== "gốc" && /Mã/i.test(e.resolved));
        const natalMaHere = es.some((e) => e.layer === "gốc" && /Mã/i.test(e.resolved));
        if ((layerMaHere && natalMaOpp) || (layerMaOpp && natalMaHere)) {
          const host = layerMaHere ? p : opp;
          const hostName = String(host.name || "");
          const hostBranch = BRANCHES_VI[toBranchIndex(host.index)] || "?";
          const hostDom = domainOfPalaceName(hostName);
          const hostLayers = [
            ...new Set(
              entriesOf(host)
                .filter((e) => e.layer !== "gốc")
                .map((e) => e.layer),
            ),
          ];
          push({
            kind: "SONG_MA",
            label: KIND_LABEL.SONG_MA,
            palaceName: hostName,
            branch: hostBranch,
            domain: hostDom,
            layers: ["gốc", ...hostLayers],
            heat: 4,
            viaXung: true,
            mechanism:
              `Mã vận/lưu xung Thiên Mã gốc (${name} ↔ ${String(opp.name || "")}, kênh ${DOMAIN_HINT[hostDom]}) — CÓ XU HƯỚNG dịch chuyển, động việc/động chỗ ở mức vừa. NÊN: tính trước phương án di chuyển, không quyết đổi chỗ trong lúc nóng.`,
          });
        }
      }
    }

    // --- KHÔI-VIỆT ĐIỆP (Mạch A2 VĐC): Khôi + Việt vận/lưu trùng cung ---
    const layerKhoiStars = es.filter((e) => e.layer !== "gốc" && /Khôi/i.test(e.resolved));
    const layerVietStars = es.filter((e) => e.layer !== "gốc" && /Việt/i.test(e.resolved));
    if (layerKhoiStars.length > 0 && layerVietStars.length > 0) {
      const natalBoost = es.some(
        (e) => e.layer === "gốc" && /Khôi|Việt/i.test(e.resolved),
      );
      push({
        kind: "KHOI_VIET_DIEP",
        label: KIND_LABEL.KHOI_VIET_DIEP,
        palaceName: name,
        branch,
        domain: pdom,
        layers: [...uniqLayers([...layerKhoiStars, ...layerVietStars])],
        heat: natalBoost ? 10 : 8,
        mechanism:
          `Khôi + Việt vận/lưu điệp tại ${name} (kênh ${dTag})${natalBoost ? " (có Khôi/Việt gốc đồng cung càng ứng)" : ""} — CÓ XU HƯỚNG quý nhân, hỷ sự đúng kênh cung này (thi cử/tuyển chọn/cầu hôn tùy cung). NÊN: nộp hồ sơ, ngỏ lời, chốt việc trong năm — đừng ngồi chờ.`,
      });
    }

    // --- THỦY HIỂM (Mạch A2 VĐC): Xương vận/lưu + Đà vận/lưu + Kỵ ---
    const layerXuongStars = es.filter((e) => e.layer !== "gốc" && /Xương/i.test(e.resolved));
    const layerDaLaStars = es.filter((e) => e.layer !== "gốc" && /Đà/i.test(e.resolved));
    const kyStarsHere = es.filter((e) => isKy(e));
    const kyHoaHere = kyHoa.filter((t) => samePalace(t.palace, name));
    if (layerXuongStars.length > 0 && layerDaLaStars.length > 0 && (kyStarsHere.length > 0 || kyHoaHere.length > 0)) {
      const hitLayers: Layer[] = [
        ...new Set<Layer>([
          ...uniqLayers([...layerXuongStars, ...layerDaLaStars, ...kyStarsHere]),
          ...kyHoaHere.map((t) => t.layer),
        ]),
      ];
      push({
        kind: "THUY_HIEM",
        label: KIND_LABEL.THUY_HIEM,
        palaceName: name,
        branch,
        domain: pdom,
        layers: hitLayers.length ? hitLayers : (["lưu"] as Layer[]),
        heat: 10,
        mechanism:
          `Xương + Đà vận/lưu gặp Kỵ tại ${name} (kênh ${dTag}) (bộ Thủy hiểm) — CÓ XU HƯỚNG tai nạn sông nước, tranh chấp văn bản/hợp đồng, thị phi thi cử ở kênh cung này. NÊN: tránh sông nước một mình, soát kỹ từng chữ trước khi ký, giữ khoảng cách thị phi.`,
      });
    }
    // --- TANG-HỔ TRÙNG PHÙNG: Tang/Hổ gốc (vành Tuế Tiền) × Tang/Hổ vận/lưu ---
    // Natal Tang/Hổ nằm ở field suiqian12 (không ở minorStars) — quét ring.
    const suiRing = ringOf(p, "suiqian12");
    const natalTangMon = /Tang Môn/i.test(suiRing);
    const natalBachHo = /Bạch Hổ/i.test(suiRing);
    const layerTangMon = es.filter((e) => e.layer !== "gốc" && /Tang Môn/i.test(e.resolved));
    const layerBachHo = es.filter((e) => e.layer !== "gốc" && /Bạch Hổ/i.test(e.resolved));
    if ((natalTangMon && layerTangMon.length > 0) || (natalBachHo && layerBachHo.length > 0)) {
      const contributors = [
        ...(natalTangMon ? layerTangMon : []),
        ...(natalBachHo ? layerBachHo : []),
      ];
      push({
        kind: "TANG_HO",
        label: KIND_LABEL.TANG_HO,
        palaceName: name,
        branch,
        domain: pdom,
        layers: ["gốc", ...uniqLayers(contributors)],
        heat: 8,
        mechanism:
          `Tang/Hổ gốc × Tang/Hổ vận/lưu đè nhau tại ${name} (kênh ${dTag}) — CÓ XU HƯỚNG tang chế trong gia đạo, đổ máu/phẫu thuật, hoặc vướng kiện tụng, lao lý khi hành xử nóng vội, thiếu chứng từ. NÊN: giữ hòa khí gia đạo, khám sức khỏe định kỳ, mọi việc dính pháp lý phải có văn bản và người am hiểu đi cùng.`,
      });
    }

    // --- SONG HAO: Hao gốc (Tuế Tiền/Bác Sỹ) × Hao vành năm ---
    // Hao lưu không tồn tại dạng [SAO LƯU]; vành Tuế Tiền năm (yearSuiqian12)
    // chính là tầng lưu của Hao — đọc ring, không đọc minorStars.
    const boshiRing = ringOf(p, "boshi12");
    const natalHao = /Hao/i.test(suiRing) || /Hao/i.test(boshiRing);
    const yearSuiRing = ringOf(p, "yearSuiqian12");
    const layerHaoRing = /Hao/i.test(yearSuiRing);
    const layerHaoStars = es.filter((e) => e.layer !== "gốc" && /Hao/i.test(e.norm));
    if (natalHao && (layerHaoRing || layerHaoStars.length > 0)) {
      const layers: Layer[] = ["gốc", ...uniqLayers(layerHaoStars)];
      if (layerHaoRing && !layers.includes("lưu")) layers.push("lưu");
      push({
        kind: "SONG_HAO",
        label: KIND_LABEL.SONG_HAO,
        palaceName: name,
        branch,
        domain: pdom,
        layers,
        heat: 7,
        mechanism:
          `Hao gốc × Hao lưu đè nhau tại ${name} (kênh ${dTag}) — CÓ XU HƯỚNG "thủng ví": tiền thất thoát ồ ạt, đầu tư sụp đổ hoặc chi khủng cho việc bất khả kháng. NÊN: giữ quỹ dự phòng tối thiểu 3–6 tháng chi tiêu, mọi khoản lớn đều có ngưỡng cắt lỗ viết sẵn.`,
      });
    }

    // --- ĐIỆP QUYỀN / ĐIỆP KHOA: Hóa bẩm sinh × Hóa vận/lưu đáp ---
    const natalQuyen = es.some((e) => e.layer === "gốc" && isHoaLabel(e, "Quyền"));
    const layerQuyenStars = es.filter((e) => e.layer !== "gốc" && isHoaLabel(e, "Quyền"));
    const layerQuyenHoas = quyenHoa.filter((t) => samePalace(t.palace, name));
    if (natalQuyen && (layerQuyenStars.length > 0 || layerQuyenHoas.length > 0)) {
      const layers: Layer[] = [
        "gốc",
        ...uniqLayers(layerQuyenStars),
        ...layerQuyenHoas.map((t) => t.layer),
      ];
      push({
        kind: "DIEP_QUYEN",
        label: KIND_LABEL.DIEP_QUYEN,
        palaceName: name,
        branch,
        domain: pdom,
        layers: [...new Set(layers)],
        heat: 6,
        mechanism:
          `Quyền gốc × Quyền vận/lưu điệp tại ${name} (kênh ${dTag}) — CÓ XU HƯỚNG tranh đoạt chức vị, cơ hội thăng tiến hoặc va chạm quyền lực ở kênh cung này. NÊN: tranh bằng năng lực + văn bản thành tích, tránh đấu đá phe phái.`,
      });
    }
    const natalKhoa = es.some((e) => e.layer === "gốc" && isHoaLabel(e, "Khoa"));
    const layerKhoaStars = es.filter((e) => e.layer !== "gốc" && isHoaLabel(e, "Khoa"));
    const layerKhoaHoas = khoaHoa.filter((t) => samePalace(t.palace, name));
    if (natalKhoa && (layerKhoaStars.length > 0 || layerKhoaHoas.length > 0)) {
      const layers: Layer[] = [
        "gốc",
        ...uniqLayers(layerKhoaStars),
        ...layerKhoaHoas.map((t) => t.layer),
      ];
      push({
        kind: "DIEP_KHOA",
        label: KIND_LABEL.DIEP_KHOA,
        palaceName: name,
        branch,
        domain: pdom,
        layers: [...new Set(layers)],
        heat: 6,
        mechanism:
          `Khoa gốc × Khoa vận/lưu điệp tại ${name} (kênh ${dTag}) — CÓ XU HƯỚNG thi cử đỗ đạt, danh tiếng được nâng hoặc tai qua nạn khỏi một cách kỳ diệu ở kênh cung này. NÊN: nộp hồ sơ, thi cử, công bố thành quả trong năm.`,
      });
    }

    // --- ĐIỆP KHÔI / ĐIỆP VIỆT: Khôi/Việt gốc × Khôi/Việt lưu/vận ---
    // (Dạng gốc theo Đàm Tinh: lưu Khôi/Việt phải điệp sao gốc mới phát lực;
    //  cặp Khôi+Việt giữ nguyên làm pin mạnh phía trên.)
    const natalKhoi = es.some((e) => e.layer === "gốc" && /Thiên Khôi/i.test(e.resolved));
    const layerKhoi = es.filter((e) => e.layer !== "gốc" && /Khôi/i.test(e.resolved));
    if (natalKhoi && layerKhoi.length > 0) {
      push({
        kind: "DIEP_KHOI",
        label: KIND_LABEL.DIEP_KHOI,
        palaceName: name,
        branch,
        domain: pdom,
        layers: ["gốc", ...uniqLayers(layerKhoi)],
        heat: 6,
        mechanism:
          `Khôi gốc × Khôi vận/lưu điệp tại ${name} (kênh ${dTag}) — CÓ XU HƯỚNG quý nhân nâng đỡ, cơ hội chính đồ, thi cử hanh thông ở kênh cung này. NÊN: chủ động nắm cơ hội, nhờ người có vị thế giới thiệu.`,
      });
    }
    const natalViet = es.some((e) => e.layer === "gốc" && /Thiên Việt/i.test(e.resolved));
    const layerViet = es.filter((e) => e.layer !== "gốc" && /Việt/i.test(e.resolved));
    if (natalViet && layerViet.length > 0) {
      push({
        kind: "DIEP_VIET",
        label: KIND_LABEL.DIEP_VIET,
        palaceName: name,
        branch,
        domain: pdom,
        layers: ["gốc", ...uniqLayers(layerViet)],
        heat: 6,
        mechanism:
          `Việt gốc × Việt vận/lưu điệp tại ${name} (kênh ${dTag}) — CÓ XU HƯỚNG quý nhân dị lộ, cơ hội bất ngờ, việc tưởng tắc mà thông ở kênh cung này. NÊN: mở lòng đón giúp đỡ, trả ơn sòng phẳng để giữ quý nhân.`,
      });
    }

    // --- KỴ XUNG KỴ: Kỵ gốc cung này × Kỵ vận/lưu đối cung (pin vừa) ---
    const hasNatalKyHere = es.some((e) => e.layer === "gốc" && isKy(e));
    if (hasNatalKyHere) {
      const b = toBranchIndex(p.index);
      const opp = byBranch.get((b + 6) % 12);
      if (opp) {
        const oppEs = entriesOf(opp);
        const oppLayerKy = oppEs.filter((e) => e.layer !== "gốc" && isKy(e));
        const oppKyHoas = kyHoa.filter((t) => samePalace(t.palace, String(opp.name || "")));
        if (oppLayerKy.length > 0 || oppKyHoas.length > 0) {
          const oppName = String(opp.name || "");
          const oppBranch = BRANCHES_VI[toBranchIndex(opp.index)] || "?";
          const oppDom = domainOfPalaceName(oppName);
          push({
            kind: "DIEP_KY",
            label: KIND_LABEL.DIEP_KY,
            palaceName: oppName,
            branch: oppBranch,
            domain: oppDom,
            layers: ["gốc", ...uniqLayers(oppLayerKy), ...oppKyHoas.map((t) => t.layer)],
            heat: 8,
            viaXung: true,
            mechanism:
              `Kỵ gốc tại ${name} bị Kỵ vận/lưu từ ${oppName} bắn sang (kênh ${DOMAIN_HINT[oppDom]}) — CÓ XU HƯỚNG tranh chấp, tai tiếng bật từ phía đối diện, thị phi từ xa tới. NÊN: không đáp trả khiêu khích, giữ chứng từ sạch, để thị phi tự xẹp.`,
          });
        }
      }
    }
  }

  // Ưu tiên nhiệt cao
  pins.sort((a, b) => b.heat - a.heat);
  return { pins, reportText: formatTrungPhungReport(pins) };
}

/** Điểm lót tay cho trigger theo cung (đã trừ double-count — trần 8/cung). */
export function trungPhungBonusFor(palaceName: string, pins: TrungPhungPin[]): number {
  const hits = pins.filter((pin) => samePalace(pin.palaceName, palaceName));
  if (!hits.length) return 0;
  const strong = hits.some((h) =>
    ["DIEP_KY", "THUY_HIEM", "TRUNG_KINH", "SONG_LOC", "TANG_HO"].includes(h.kind),
  );
  return Math.min(
    8,
    hits.reduce((sum, h) => sum + (h.viaXung ? 2 : 3), 0) + (strong ? 2 : 0),
  );
}

export function formatTrungPhungReport(pins: TrungPhungPin[]): string {
  if (!pins.length) {
    return (
      "  - Không phát hiện giao thoa 3 tầng nào (không Song Lộc/Điệp Kỵ/Quyền/Khoa/Khôi/Việt, Trùng Kình Đà, Tang-Hổ, Song Mã/Hao, Khôi-Việt điệp, Thủy hiểm, Kỵ xung). Luận êm theo thẻ/kích hoạt."
    );
  }
  const shown = pins.slice(0, 8);
  const lines: string[] = shown.map(
    (pin, i) =>
      `  ${i + 1}. [${pin.label} · ${pin.heat}đ · ${pin.layers.join("×")} · kênh ${DOMAIN_HINT[pin.domain]}] ${pin.palaceName} (${pin.branch})${pin.viaXung ? " — qua xung chiếu" : ""}\n     ${pin.mechanism}`,
  );
  if (pins.length > shown.length) {
    lines.push(
      `  - (+${pins.length - shown.length} pin nhẹ khác đã gộp điểm vào kích hoạt hạn — không cần mục riêng.)`,
    );
  }
  return lines.join("\n");
}

/** Block cheat sheet cho prompt — entry chính. */
export function buildTrungPhungReport(palacesArr: any[], chartData: any): string {
  const { reportText } = analyzeTrungPhung(palacesArr, chartData);
  return [
    "=== GIAO THOA 3 TẦNG GỐC×VẬN×LƯU (MÁY GHIM — PHẦN 3 BẮT BUỘC KHÔNG BỎ SÓT PIN NÀO) ===",
    "CẤM bịa pin ngoài list. Mỗi pin = 1 mạch Tiểu hạn: việc đời → cơ chế đè nhau → 1 NÊN. Chỉ CÓ XU HƯỚNG, cấm phán tuyệt đối.",
    "",
    reportText,
  ].join("\n");
}

/** Bản /api/chat — cùng dữ liệu pin, đầu mục theo ngữ cảnh chat (không tham chiếu "PHẦN 4" của interpret). */
export function buildTrungPhungReportChat(palacesArr: any[], chartData: any): string {
  const { reportText } = analyzeTrungPhung(palacesArr, chartData);
  return [
    "CẤM bịa pin ngoài list. Mỗi pin = 1 mạch Tiểu hạn: việc đời → cơ chế đè nhau → 1 NÊN. Chỉ CÓ XU HƯỚNG, cấm phán tuyệt đối.",
    "",
    reportText,
  ].join("\n");
}
