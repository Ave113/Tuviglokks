import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { splitAstroTerms } from "../utils/astroTerms";
import { splitSectionLabels } from "../utils/sectionLabels";

const ASTRO_TERM_CLASS = "astro-term text-emerald-700 dark:text-emerald-400";
const SECTION_LABEL_CLASS = "text-red-600 dark:text-red-400";

const isAstroSpan = (node: React.ReactElement): boolean => {
  const props = node.props as { className?: unknown };
  return typeof props.className === "string" && props.className.includes("astro-term");
};

/** Tô xanh tên sao/cung trong một chuỗi đã tách khỏi nhãn đỏ. */
function highlightAstroText(text: string, keyPrefix: string): React.ReactNode {
  const parts = splitAstroTerms(text);
  if (!parts.some((part) => part.astro)) return text;
  return parts.map((part, partIndex) =>
    part.astro ? (
      <span key={`${keyPrefix}-a${partIndex}`} className={ASTRO_TERM_CLASS}>
        {part.text}
      </span>
    ) : (
      part.text
    ),
  );
}

/**
 * Tô đỏ nhãn mục ưu tiên (Cấu trúc Sát Tinh, Độ sâu Tứ Hóa, …) và tô xanh
 * tên sao/cung còn lại. Nhãn đỏ được tách trước để cụm như "Sát Tinh" không
 * bị tô xanh lẻ bên trong.
 */
function highlightAstroNode(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child, index) => {
    if (typeof child === "string") {
      const labelParts = splitSectionLabels(child);
      if (!labelParts.some((part) => part.label)) {
        return highlightAstroText(child, String(index));
      }
      return labelParts.map((part, partIndex) =>
        part.label ? (
          <span key={`${index}-r${partIndex}`} className={SECTION_LABEL_CLASS}>
            {part.text}
          </span>
        ) : (
          <React.Fragment key={`${index}-n${partIndex}`}>
            {highlightAstroText(part.text, `${index}-${partIndex}`)}
          </React.Fragment>
        ),
      );
    }

    if (React.isValidElement(child)) {
      if (
        isAstroSpan(child) ||
        child.type === "code" ||
        child.type === "pre" ||
        child.type === "a"
      ) {
        return child;
      }
      const props = child.props as { children?: React.ReactNode };
      if (props.children === undefined || props.children === null) return child;
      return React.cloneElement(
        child as React.ReactElement<{ children?: React.ReactNode }>,
        {},
        highlightAstroNode(props.children),
      );
    }

    return child;
  });
}

/** Heading chỉ cần tô đỏ nhãn mục; không đổi màu các chữ còn lại. */
function highlightSectionLabelsNode(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child, index) => {
    if (typeof child === "string") {
      const parts = splitSectionLabels(child, "heading");
      if (!parts.some((part) => part.label)) return child;
      return parts.map((part, partIndex) =>
        part.label ? (
          <span key={`${index}-hr${partIndex}`} className={SECTION_LABEL_CLASS}>
            {part.text}
          </span>
        ) : (
          part.text
        ),
      );
    }

    if (React.isValidElement(child)) {
      if (child.type === "code" || child.type === "pre" || child.type === "a") return child;
      const props = child.props as { children?: React.ReactNode };
      if (props.children === undefined || props.children === null) return child;
      return React.cloneElement(
        child as React.ReactElement<{ children?: React.ReactNode }>,
        {},
        highlightSectionLabelsNode(props.children),
      );
    }

    return child;
  });
}

const astroComponents: Components = {
  p: ({ node: _node, children, ...props }) => <p {...props}>{highlightAstroNode(children)}</p>,
  li: ({ node: _node, children, ...props }) => <li {...props}>{highlightAstroNode(children)}</li>,
  td: ({ node: _node, children, ...props }) => <td {...props}>{highlightAstroNode(children)}</td>,
  th: ({ node: _node, children, ...props }) => <th {...props}>{highlightAstroNode(children)}</th>,
  h1: ({ node: _node, children, ...props }) => (
    <h1 {...props}>{highlightSectionLabelsNode(children)}</h1>
  ),
  h2: ({ node: _node, children, ...props }) => (
    <h2 {...props}>{highlightSectionLabelsNode(children)}</h2>
  ),
  h3: ({ node: _node, children, ...props }) => (
    <h3 {...props}>{highlightSectionLabelsNode(children)}</h3>
  ),
  h4: ({ node: _node, children, ...props }) => (
    <h4 {...props}>{highlightSectionLabelsNode(children)}</h4>
  ),
  h5: ({ node: _node, children, ...props }) => (
    <h5 {...props}>{highlightSectionLabelsNode(children)}</h5>
  ),
  h6: ({ node: _node, children, ...props }) => (
    <h6 {...props}>{highlightSectionLabelsNode(children)}</h6>
  ),
};

interface SafeMarkdownProps {
  children: string;
  /** Tô xanh tên sao/cung ở lớp hiển thị (dùng cho bài luận giải). */
  highlightAstroTerms?: boolean;
}

/**
 * Markdown an toàn cho nội dung AI / user — strip raw HTML, script, event handlers.
 * Dùng thay ReactMarkdown trực tiếp để giảm rủi ro XSS khi BYOK key nằm localStorage.
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({
  children,
  highlightAstroTerms = false,
}) => (
  <ReactMarkdown
    rehypePlugins={[rehypeSanitize]}
    components={highlightAstroTerms ? astroComponents : undefined}
  >
    {children}
  </ReactMarkdown>
);
