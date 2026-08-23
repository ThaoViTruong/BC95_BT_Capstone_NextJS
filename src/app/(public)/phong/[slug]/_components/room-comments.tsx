"use client";

import { useMemo, useState } from "react";

import { formatDate } from "@/lib/format";
import type { Comment } from "@/types/comment";

import { ExpandableComment } from "./expandable-comment";

type RoomCommentsProps = {
  comments: Comment[];
  initialVisibleCount?: number;
  incrementCount?: number;
};

function getCommentTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function RoomComments({
  comments,
  initialVisibleCount = 10,
  incrementCount = 10,
}: RoomCommentsProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  const sortedComments = useMemo(
    () =>
      [...comments].sort((commentA, commentB) => {
        const timeA = getCommentTime(commentA.ngayBinhLuan);
        const timeB = getCommentTime(commentB.ngayBinhLuan);

        if (timeA !== timeB) {
          return timeB - timeA;
        }

        return commentB.id - commentA.id;
      }),
    [comments],
  );

  const visibleComments = sortedComments.slice(0, visibleCount);
  const hasMoreComments = visibleComments.length < sortedComments.length;

  if (sortedComments.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-slate-50 p-6 text-sm leading-7 text-slate-600">
        Chưa có bình luận nào cho phòng này. Đây là lựa chọn phù hợp nếu bạn muốn trải
        nghiệm một nơi ở mới trên Stayora.
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      {visibleComments.map((item) => (
        <article key={item.id} className="min-w-0 rounded-3xl border border-line bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex flex-1 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f2f8e] text-sm font-bold text-white">
                {(item.tenNguoiBinhLuan || "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">
                  {item.tenNguoiBinhLuan || `Người dùng #${item.maNguoiBinhLuan}`}
                </p>
                <p className="text-sm text-slate-500">{formatDate(item.ngayBinhLuan)}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
              {item.saoBinhLuan}/5
            </span>
          </div>
          <ExpandableComment content={item.noiDung} />
        </article>
      ))}

      {hasMoreComments ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((current) => Math.min(current + incrementCount, sortedComments.length))
            }
            className="inline-flex items-center rounded-full border border-[#0f2f8e] px-5 py-3 text-sm font-semibold text-[#0f2f8e] transition hover:bg-[#0f2f8e] hover:text-white"
          >
            Hiện thêm
          </button>
        </div>
      ) : null}
    </div>
  );
}
