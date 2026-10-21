// Debug: vì sao mẩu mới không vào prompt interpret trên lá mẫu
import { retrieveKinhNghiem } from "../src/knowledge/kinhNghiemKnowledge.ts";
import { makeChartPayload } from "../src/server/test/fixtures.ts";
import { collectAllAuxStarNames, collectCycleStarLabels, collectAllMajorStarNames } from "../src/prompt/chartReports.ts";
import { collectPatternIdsOnChart } from "../src/utils/cachCucLogic.ts";
import { buildChartIndex } from "../src/utils/chartRelations.ts";
import { getNatalTuHoaQuartet, extractBirthHeavenlyStem, HOA_LABELS } from "../src/utils/tuHoa.ts";
import { getDamTinhForAuxStars } from "../src/knowledge/damTinh.ts";

const c: any = makeChartPayload();
const pal = c.palaces || [];
const majors = collectAllMajorStarNames(pal);
const auxAll = [...new Set(collectAllAuxStarNames(pal).map((n: string) => String(n).replace(/\[SAO[^\]]*\]\s*/g, "").trim()))].filter(Boolean);
const stem = extractBirthHeavenlyStem(c, c.birthLunarYear);
const q = stem ? getNatalTuHoaQuartet(stem) : undefined;
const pool = [
  ...majors,
  ...auxAll.filter((n: string) => /Kình|Đà|Không|Kiếp|Hỏa|Linh|Hóa |Lộc Tồn|Văn Xương|Văn Khúc|Thiên Mã|Hồng|Đào|Tuần|Triệt|Vong|Hao|Tang|Hổ|Khốc|Hư|Giải|Khôi|Việt|Long|Phượng|Hổ|Cái|Hình|Riêu|Cô|Quả|Vận |Lưu |Niên Giải|Phủ|Tướng|Sát|Phá|Tham|Cự|Cơ|Đồng|Lương/i.test(n)),
  ...(q ? [...HOA_LABELS, ...q] : []),
  ...collectCycleStarLabels(pal),
];
const pids = collectPatternIdsOnChart(buildChartIndex(pal) as any);
console.log("patternIds trên lá:", pids.join(", "));

const got = retrieveKinhNghiem({ stars: pool, patternIds: pids }, 20);
const newPrefixes = ["kn-cach-", "kn-han2-", "kn-bo-", "kn-han-"];
const isnew = (id: string) => newPrefixes.some((p) => id.startsWith(p));
const oldM = got.filter((e) => !isnew(e.id));
const newM = got.filter((e) => isnew(e.id));
console.log("\nTOP-20 KN: cũ=" + oldM.length, "mới=" + newM.length);
console.log("--- CŨ ---");
oldM.forEach((e, i) => console.log(`  ${i + 1}. ${e.title} (pids:${e.patternIds?.length || 0})`));
console.log("--- MỚI ---");
newM.forEach((e, i) => console.log(`  ${i + 1}. ${e.title}`));

// Đàm Tinh aux — entry mới trong top-16
const auxText = getDamTinhForAuxStars([...auxAll, ...collectCycleStarLabels(pal)], 16);
const newStars = ["Bác Sỹ", "Thiên Nguyệt", "Thái Tuế", "Trường Sinh", "Thanh Long", "Vong Thần", "Tướng Tinh", "Hỷ Thần", "Bệnh Phù", "Hối Khí"];
const inAux = newStars.filter((s) => auxText.includes(s));
console.log("\nĐÀM TINH AUX (top 16): entry mới lọt =", inAux.length, "/", newStars.length, "→", inAux.join(", ") || "(không)");
console.log("auxText sample:", auxText.slice(0, 300));

// Giải hóa
import { buildCabinetFromChart } from "../src/knowledge/buildCabinetFromChart.ts";
const cab = buildCabinetFromChart(c, { mode: "interpret", useTopicFocus: false });
console.log("\nGIẢI HÓA:", cab.giaiHoaKnowledgeStr.length, "ký tự");
console.log("Sample:", cab.giaiHoaKnowledgeStr.slice(0, 200));
