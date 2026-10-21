/**
 * Bộ 20 lá benchmark cố định — đo an lá + skeleton luận giải (không claim % đời người).
 *
 * Dùng:
 *   - vitest: src/qa/benchmark20.test.ts
 *   - script: npx tsx scripts/qa-benchmark-20.mts
 *
 * Giờ expectedHourBranch = khung Đông phương 2h (Tý 23–01 … Hợi 21–23).
 */
import { BIRTHPLACE, type BirthplaceRegion } from "../constants/birthplace";

export interface BenchmarkChartCase {
  /** B01 … B20 */
  id: string;
  label: string;
  solarDate: string;
  solarTime: string;
  birthplace: BirthplaceRegion;
  gender: "Nam" | "Nữ";
  /** Chi giờ kỳ vọng sau normalize */
  expectedHourBranch: string;
  transitYear: number;
  /** Ghi chú đa dạng (thế hệ / vùng) — không dùng để chấm AI */
  tags: string[];
}

/**
 * 20 lá bất kỳ nhưng đa dạng: giới, thập niên, miền, giờ, năm xem.
 * Không phải “đời thật đã verify” — chỉ fixture đo pipeline.
 */
export const BENCHMARK_20_CHARTS: readonly BenchmarkChartCase[] = [
  // —— giữ nhịp bộ golden cũ (A–H) ——
  {
    id: "B01",
    label: "Nữ 1988-03-12 22:45 Bắc",
    solarDate: "1988-03-12",
    solarTime: "22:45",
    birthplace: BIRTHPLACE.NORTH,
    gender: "Nữ",
    expectedHourBranch: "Hợi",
    transitYear: 2026,
    tags: ["genX", "bac", "toi"],
  },
  {
    id: "B02",
    label: "Nam 2001-07-08 05:15 Nam",
    solarDate: "2001-07-08",
    solarTime: "05:15",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nam",
    expectedHourBranch: "Mão",
    transitYear: 2026,
    tags: ["genZ", "nam", "sang"],
  },
  {
    id: "B03",
    label: "Nam 2009-06-09 23:05 Trung QT vào",
    solarDate: "2009-06-09",
    solarTime: "23:05",
    birthplace: BIRTHPLACE.CENTRAL_SOUTH_OF_17,
    gender: "Nam",
    expectedHourBranch: "Tý",
    transitYear: 2026,
    tags: ["tre", "trung", "vat-ngay"],
  },
  {
    id: "B04",
    label: "Nữ 2004-07-15 19:30 Trung QT vào",
    solarDate: "2004-07-15",
    solarTime: "19:30",
    birthplace: BIRTHPLACE.CENTRAL_SOUTH_OF_17,
    gender: "Nữ",
    expectedHourBranch: "Tuất",
    transitYear: 2026,
    tags: ["genZ", "trung"],
  },
  {
    id: "B05",
    label: "Nữ 1980-11-19 02:45 Trung QT vào",
    solarDate: "1980-11-19",
    solarTime: "02:45",
    birthplace: BIRTHPLACE.CENTRAL_SOUTH_OF_17,
    gender: "Nữ",
    expectedHourBranch: "Sửu",
    transitYear: 2026,
    tags: ["genX", "khuya"],
  },
  {
    id: "B06",
    label: "Nam 2011-04-23 11:00 Nam",
    solarDate: "2011-04-23",
    solarTime: "11:00",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nam",
    expectedHourBranch: "Ngọ",
    transitYear: 2026,
    tags: ["tre", "trua"],
  },
  {
    id: "B07",
    label: "Nữ 1996-01-02 18:15 Nam",
    solarDate: "1996-01-02",
    solarTime: "18:15",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nữ",
    expectedHourBranch: "Dậu",
    transitYear: 2026,
    tags: ["millennial", "chieu"],
  },
  {
    id: "B08",
    label: "Nam 2023-08-05 04:45 Bắc",
    solarDate: "2023-08-05",
    solarTime: "04:45",
    birthplace: BIRTHPLACE.NORTH,
    gender: "Nam",
    expectedHourBranch: "Dần",
    transitYear: 2026,
    tags: ["tre-so-sinh", "sang-som"],
  },
  // —— 12 lá bổ sung ——
  {
    id: "B09",
    label: "Nam 1975-09-02 08:20 Bắc",
    solarDate: "1975-09-02",
    solarTime: "08:20",
    birthplace: BIRTHPLACE.NORTH,
    gender: "Nam",
    expectedHourBranch: "Thìn",
    transitYear: 2026,
    tags: ["boomer-late", "bac"],
  },
  {
    id: "B10",
    label: "Nữ 1990-12-25 14:00 Nam",
    solarDate: "1990-12-25",
    solarTime: "14:00",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nữ",
    expectedHourBranch: "Mùi",
    transitYear: 2027,
    tags: ["millennial", "nam", "nam-xem-2027"],
  },
  {
    id: "B11",
    label: "Nam 1985-05-01 16:40 Trung QT ra",
    solarDate: "1985-05-01",
    solarTime: "16:40",
    birthplace: BIRTHPLACE.CENTRAL_NORTH_OF_17,
    gender: "Nam",
    expectedHourBranch: "Thân",
    transitYear: 2026,
    tags: ["genX", "trung-bac"],
  },
  {
    id: "B12",
    label: "Nữ 2000-02-29 00:30 Nam (năm nhuận)",
    solarDate: "2000-02-29",
    solarTime: "00:30",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nữ",
    expectedHourBranch: "Tý",
    transitYear: 2026,
    tags: ["nhuan", "nua-dem"],
  },
  {
    id: "B13",
    label: "Nam 1999-10-10 21:10 Overseas",
    solarDate: "1999-10-10",
    solarTime: "21:10",
    birthplace: BIRTHPLACE.OVERSEAS,
    gender: "Nam",
    expectedHourBranch: "Hợi",
    transitYear: 2026,
    tags: ["overseas", "toi"],
  },
  {
    id: "B14",
    label: "Nữ 1972-06-18 09:55 Bắc",
    solarDate: "1972-06-18",
    solarTime: "09:55",
    birthplace: BIRTHPLACE.NORTH,
    gender: "Nữ",
    expectedHourBranch: "Tỵ",
    transitYear: 2025,
    tags: ["genX-early", "nam-xem-2025"],
  },
  {
    id: "B15",
    label: "Nam 2007-03-21 12:00 Trung QT vào",
    solarDate: "2007-03-21",
    solarTime: "12:00",
    birthplace: BIRTHPLACE.CENTRAL_SOUTH_OF_17,
    gender: "Nam",
    expectedHourBranch: "Ngọ",
    transitYear: 2026,
    tags: ["teen", "dung-trua"],
  },
  {
    id: "B16",
    label: "Nữ 2015-11-11 06:06 Nam",
    solarDate: "2015-11-11",
    solarTime: "06:06",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nữ",
    expectedHourBranch: "Mão",
    transitYear: 2026,
    tags: ["tre-em", "sang"],
  },
  {
    id: "B17",
    label: "Nam 1968-01-30 20:20 Bắc",
    solarDate: "1968-01-30",
    solarTime: "20:20",
    birthplace: BIRTHPLACE.NORTH,
    gender: "Nam",
    expectedHourBranch: "Tuất",
    transitYear: 2026,
    tags: ["boomer", "toi"],
  },
  {
    id: "B18",
    label: "Nữ 1993-08-08 15:30 Trung QT ra",
    solarDate: "1993-08-08",
    solarTime: "15:30",
    birthplace: BIRTHPLACE.CENTRAL_NORTH_OF_17,
    gender: "Nữ",
    expectedHourBranch: "Thân",
    transitYear: 2026,
    tags: ["millennial", "chieu"],
  },
  {
    id: "B19",
    label: "Nam 2002-04-04 03:33 Nam",
    solarDate: "2002-04-04",
    solarTime: "03:33",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nam",
    expectedHourBranch: "Dần",
    transitYear: 2028,
    tags: ["genZ", "nam-xem-2028"],
  },
  {
    id: "B20",
    label: "Nữ 1987-07-07 13:13 Overseas",
    solarDate: "1987-07-07",
    solarTime: "13:13",
    birthplace: BIRTHPLACE.OVERSEAS,
    gender: "Nữ",
    expectedHourBranch: "Mùi",
    transitYear: 2026,
    tags: ["genX", "overseas"],
  },
] as const;

export function assertBenchmark20Complete(): void {
  if (BENCHMARK_20_CHARTS.length !== 20) {
    throw new Error(`BENCHMARK_20_CHARTS must be 20, got ${BENCHMARK_20_CHARTS.length}`);
  }
  const ids = new Set(BENCHMARK_20_CHARTS.map((c) => c.id));
  if (ids.size !== 20) throw new Error("Duplicate benchmark chart ids");
}
