import React from "react";
import { ChevronDown } from "lucide-react";
import { splitChatAnswer } from "../utils/splitChatAnswer";
import { SafeMarkdown } from "./SafeMarkdown";

interface ChatAnswerProps {
  content: string;
  /** prose-sm cho bubble chat, prose cho vùng rộng hơn */
  size?: "sm" | "base";
}

const proseSizeClass = {
  sm: "prose-sm",
  base: "prose",
};

export const ChatAnswer: React.FC<ChatAnswerProps> = ({ content, size = "sm" }) => {
  const { lead, detail } = React.useMemo(() => splitChatAnswer(content), [content]);
  const prose = proseSizeClass[size];

  if (!detail) {
    return (
      <div className={`markdown-body chat-markdown ${prose} prose-stone dark:prose-invert max-w-none`}>
        <SafeMarkdown>{lead}</SafeMarkdown>
      </div>
    );
  }

  return (
    <div className="chat-answer space-y-2.5">
      <div className="chat-answer-lead">
        <span className="chat-answer-lead-label">Kết luận</span>
        <div className={`markdown-body chat-markdown ${prose} prose-stone dark:prose-invert max-w-none`}>
          <SafeMarkdown>{lead}</SafeMarkdown>
        </div>
      </div>

      <details className="chat-answer-details group">
        <summary className="chat-answer-details-summary">
          <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-180" />
          Xem căn cứ chi tiết
        </summary>
        <div className={`markdown-body chat-markdown chat-answer-details-body ${prose} prose-stone dark:prose-invert max-w-none`}>
          <SafeMarkdown>{detail}</SafeMarkdown>
        </div>
      </details>
    </div>
  );
};