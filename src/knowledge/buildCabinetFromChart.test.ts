import { describe, expect, it } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildCabinetFromChart } from "./buildCabinetFromChart";
import { GIAI_HOA_KNOWLEDGE } from "./giaiHoaKnowledge";

describe("buildCabinetFromChart — shared interpret/chat", () => {
  const payload = () => {
    const r = generateTuviAstrolabe("2001-07-08", "05:15", BIRTHPLACE.SOUTH, "Nam");
    return buildInterpretPayload(r, 2026);
  };

  it("interpret mode có directive + tinh hoa", () => {
    const cab = buildCabinetFromChart(payload(), { mode: "interpret" });
    expect(cab.cabinetDirectiveStr).toMatch(/BẬC THẦY/i);
    expect(cab.combinedPromptBlock.length).toBeGreaterThan(100);
    expect(cab.stats.mode).toBe("interpret");
  });

  it("chat + query tiền: topic focus + có thể có blind gh", () => {
    const cab = buildCabinetFromChart(payload(), {
      mode: "chat",
      query: "Tôi có nên cho bạn vay tiền không? Điểm mù gì về tiền?",
      useTopicFocus: true,
    });
    expect(cab.focusStars.length).toBeGreaterThan(0);
    expect(cab.combinedPromptBlock).toMatch(/DIỄN ĐẠT|TỦ TINH HOA|GIẢI HÓA/i);
    // map điểm mù tiền / bạn
    expect(cab.blindGiaiHoa.length + (cab.giaiHoaKnowledgeStr ? 1 : 0)).toBeGreaterThan(0);
  });

  it("catalog giải hóa mở rộng ≥ 25 mẩu", () => {
    expect(GIAI_HOA_KNOWLEDGE.length).toBeGreaterThanOrEqual(25);
  });
});
