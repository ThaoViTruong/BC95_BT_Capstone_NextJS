"use client";

import { useMemo, useState } from "react";

import { normalizeCommentContent } from "@/lib/comment-validation";

type ExpandableCommentProps = {
  content: string;
  previewLength?: number;
};

export function ExpandableComment({
  content,
  previewLength = 320,
}: ExpandableCommentProps) {
  const [expanded, setExpanded] = useState(false);

  const normalizedContent = useMemo(() => normalizeCommentContent(content), [content]);
  const shouldTruncate = normalizedContent.length > previewLength;
  const previewContent = shouldTruncate
    ? `${normalizedContent.slice(0, previewLength).trimEnd()}...`
    : normalizedContent;

  return (
    <div className="mt-3 min-w-0">
      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 [overflow-wrap:anywhere]">
        {expanded ? normalizedContent : previewContent}
      </p>

      {shouldTruncate ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 text-sm font-semibold text-[#0f2f8e] transition hover:text-[#0b246d]"
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      ) : null}
    </div>
  );
}
