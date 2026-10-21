import { makeChartPayload } from "../src/server/test/fixtures.ts";
import { buildChartPromptContext } from "../src/prompt/buildChartPromptContext.ts";
const c: any = makeChartPayload();
const ctx: any = buildChartPromptContext(c);
const kg = String(ctx.knowledgeGraphStr || "");
console.log("=== KNOWLEDGE GRAPH STR (trong context) ===");
console.log("Độ dài:", kg.length, "ký tự");
console.log(kg.slice(0, 1200));
