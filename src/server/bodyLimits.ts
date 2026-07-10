import { createJsonBodyParser, JSON_BODY_LIMIT } from "./jsonBodyError";

export { JSON_BODY_LIMIT };

/** Lá số 12 cung + Bát Tự — tối đa 4MB. */
export const jsonChartPayload = createJsonBodyParser();

/** /chat kèm baseInterpretation + history — cùng giới hạn 4MB. */
export const jsonChatPayload = createJsonBodyParser();