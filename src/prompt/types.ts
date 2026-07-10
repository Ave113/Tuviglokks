import type { ChartIndex } from "../utils/chartRelations";

/** Shared prompt context built once per chart — used by interpret and chat routes. */
export interface ChartPromptContext {
  idx: ChartIndex;
  palacesArr: any[];
  genderStr: string;
  transitYearNum: number;
  luuNienStem: string;
  decadalStem: string | undefined;
  natalTuHoaResolved: boolean;
  stemKey: string | undefined;
  bodyPalaceStr: string;
  schoolMetaStr: string;
  decorativeRingsStr: string;
  natalTuHoaStr: string;
  stressReportStr: string;
  /** Tuần/Triệt/Không Vong — quét sao engine, cheat sheet chống bịa. */
  tuanTrietReportStr: string;
  luuNienReportStr: string;
  decadalFlyingStr: string;
  luuNienFlyingStr: string;
  tuHoaReportStr: string;
  cachCucReportStr: string;
  laiNhanReportStr: string;
  haiTrucTaiLocStr: string;
  phucDucReportStr: string;
  luuNguyetReportStr: string;
  truongSinhReportStr: string;
  phucLocReportStr: string;
  damTinhStr: string;
  damTinhAuxStr: string;
  damTinhTuHoaGeneralStr: string;
  damTinhTuHoaDetailStr: string;
  baZiStr: string;
  chineseKnowledgeStr: string;
  tuBinhKnowledgeStr: string;
  /** Lớp B — kinh nghiệm ứng dụng (Sổ TVKN), RAG theo lá. */
  kinhNghiemKnowledgeStr: string;
  shiShenList: string[];
  dominantElements: string[];
  allMajorStarNames: string[];
}