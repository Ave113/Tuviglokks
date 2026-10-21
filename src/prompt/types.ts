import type {
  ChartIndex,
  NatalTuHoaObject,
  PalaceTuHoaFlight,
  SeparateTuHoaResult,
} from "../utils/chartRelations";

/** Shared prompt context built once per chart — used by interpret and chat routes. */
export interface ChartPromptContext {
  idx: ChartIndex;
  palacesArr: any[];
  genderStr: string;
  transitYearNum: number;
  luuNienStem: string;
  decadalStem: string | undefined;
  /** Can–chi / range / ages / block Tứ Hóa hạn — từ payload transit */
  decadalBranch?: string;
  decadalRangeStr?: string;
  tieuHanAgesStr?: string;
  natalTuHoaResolved: boolean;
  stemKey: string | undefined;
  /** Cấu trúc phân tách riêng rẽ: Tứ Hóa Bẩm Sinh */
  natalTuHoaObject: NatalTuHoaObject | null;
  /** Cấu trúc phân tách riêng rẽ: Tự / Phi Tứ Hóa 12 Cung */
  palaceTuHoaFlights: PalaceTuHoaFlight[];
  /** Đường bay tâm lý cốt lõi từ Mệnh và Phúc Đức */
  corePsychologicalFlights?: SeparateTuHoaResult["corePsychologicalFlights"];
  bodyPalaceStr: string;
  schoolMetaStr: string;
  natalTuHoaStr: string;
  stressReportStr: string;
  /** Tính va đập + mầm điểm mù — cheat sheet máy cho Phần 1. */
  tinhVaDapReportStr: string;
  /** Kích hoạt hạn × điểm mù / trục va — cheat sheet máy cho Phần 3. */
  temporalTriggerReportStr: string;
  /** Giao thoa 3 tầng Gốc×Vận×Lưu (máy ghim) — cheat sheet cho Phần 3. */
  trungPhungReportStr: string;
  /** Tuần/Triệt/Không Vong — quét sao engine, cheat sheet chống bịa. */
  tuanTrietReportStr: string;
  luuNienReportStr: string;
  /** Thẻ sự kiện Lưu niên (máy) — Tiểu hạn sắc. */
  luuNienEventCardsStr: string;
  /** Thẻ tin cậy BT↔TV theo trục (máy) — không rải lung tung. */
  baZiCrossTagsStr: string;
  decadalFlyingStr: string;
  luuNienFlyingStr: string;
  /** Phân tách cấu trúc riêng: Tứ Hóa bẩm sinh vs Tự / Phi Tứ Hóa */
  corePsychologicalFlightsStr?: string;
  palaceSelfFlyingBlockStr?: string;
  cachCucReportStr: string;
  /** Cách cục chạm cung Đại hạn / Tiểu hạn (máy quét — "cách đang sống" ở cung vận). */
  vanChamCungStr: string;
  /** Top 3 trục đời sống máy chấm — mở bài + phân bổ độ sâu. */
  trongTamStr: string;
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
  /** Block riêng "sao nhập hạn" (mạch A — Tân Biên 1956) — không cạnh tranh cách cục. */
  saoNhapHanStr: string;
  /** Mạch B — tổ hợp chính tinh nhập Mệnh (5 file sao nhập Mệnh) — block riêng, không cạnh tranh top chung. */
  nmMenhStr: string;
  /** Lớp giải hóa — mẩu NÊN/KHÔNG đã gate theo sao (không dump sách). */
  giaiHoaKnowledgeStr: string;
  /** Tủ tinh hoa sách (per-star cô đọng) — cấm full file; AI dùng toàn bộ kiến thức, chỉ câu chữ trùng nguyên văn tối đa 40%. */
  bookCorpusStr: string;
  /** Lệnh diễn đạt bậc thầy — đặt trước tủ tinh hoa. */
  tinhHoaCabinetDirectiveStr: string;
  shiShenList: string[];
  dominantElements: string[];
  allMajorStarNames: string[];
}
