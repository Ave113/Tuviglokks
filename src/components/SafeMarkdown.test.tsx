import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SafeMarkdown } from "./SafeMarkdown";

describe("SafeMarkdown — tô màu nhãn mục và tên sao", () => {
  it("nhãn mục trong heading được tô đỏ, không bị tách xanh", () => {
    const html = renderToStaticMarkup(
      <SafeMarkdown highlightAstroTerms>
        {"### Cấu trúc Sát Tinh\n\nĐoạn văn bình thường."}
      </SafeMarkdown>,
    );
    expect(html).toContain('<span class="text-red-600 dark:text-red-400">Cấu trúc Sát Tinh</span>');
    expect(html).not.toContain('astro-term text-emerald-700 dark:text-emerald-400">Sát Tinh');
  });

  it("tên sao trong đoạn văn vẫn xanh, nhãn mục đỏ", () => {
    const html = renderToStaticMarkup(
      <SafeMarkdown highlightAstroTerms>
        {"Mệnh có Tử Vi. Mục Sự nghiệp & Tài lộc nói về tiền."}
      </SafeMarkdown>,
    );
    expect(html).toContain('class="astro-term text-emerald-700 dark:text-emerald-400">Tử Vi</span>');
    expect(html).toContain('class="text-red-600 dark:text-red-400">Sự nghiệp &amp; Tài lộc</span>');
  });

  it("heading một từ như Sự nghiệp / Phúc Đức cũng đỏ, nhưng câu văn thường thì không", () => {
    const html = renderToStaticMarkup(
      <SafeMarkdown highlightAstroTerms>
        {"### Sự nghiệp\n\nSự nghiệp của bạn đi qua Phúc Đức."}
      </SafeMarkdown>,
    );
    expect(html).toContain('<span class="text-red-600 dark:text-red-400">Sự nghiệp</span>');
    expect(html).toContain("Sự nghiệp của bạn đi qua");
    expect(html).not.toContain('text-red-600 dark:text-red-400">Sự nghiệp</span> của');
  });
});
