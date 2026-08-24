"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationButtonsProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function getPaginationItems(currentPage: number, totalPages: number) {
  const visiblePages = Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]),
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((pageA, pageB) => pageA - pageB);

  const items: Array<number | "ellipsis"> = [];

  visiblePages.forEach((page, index) => {
    const previousPage = visiblePages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  });

  return items;
}

export function PaginationButtons({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationButtonsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const items = getPaginationItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Phân trang danh sách"
      className={cn("flex flex-wrap items-center justify-center gap-3", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-2xl border px-5 text-sm font-semibold transition",
          currentPage <= 1
            ? "cursor-not-allowed border-line bg-slate-100 text-slate-400"
            : "border-line bg-white text-slate-800 hover:border-[#0f2f8e] hover:bg-[#0f2f8e] hover:text-white",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Trước
      </button>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${currentPage}-${index}`}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-white text-slate-500"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : item === currentPage ? (
            <span
              key={item}
              aria-current="page"
              className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl bg-[#0f2f8e] px-4 text-sm font-bold text-white shadow-sm"
            >
              {item}
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl border border-line bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0f2f8e] hover:bg-[#0f2f8e] hover:text-white"
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-2xl border px-5 text-sm font-semibold transition",
          currentPage >= totalPages
            ? "cursor-not-allowed border-line bg-slate-100 text-slate-400"
            : "border-line bg-white text-slate-800 hover:border-[#0f2f8e] hover:bg-[#0f2f8e] hover:text-white",
        )}
      >
        Sau
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

