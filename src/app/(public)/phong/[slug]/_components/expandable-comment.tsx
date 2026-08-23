"use client";

import { useMemo, useState } from "react";

type ExpandableCommentProps = {
  content: string;
  previewLength?: number;
};

export function ExpandableComment({
  content,
  previewLength = 320,
}: ExpandableCommentProps) {
  const [expanded, setExpanded] = useState(false);

  const normalizedContent = useMemo(() => content.trim(), [content]);
  const shouldTruncate = normalizedContent.length > previewLength;
  const previewContent = shouldTruncate
    ? `${normalizedContent.slice(0, previewLength).trimEnd()}...`
    : normalizedContent;

  return (
    <div className="mt-3">
      <p className="text-sm leading-7 text-slate-700">
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
