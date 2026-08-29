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
      className={cn("flex flex-wrap items-center justify-center gap-2 sm:gap-3", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-2xl border px-3 text-sm font-semibold transition sm:h-12 sm:gap-2 sm:px-5",
          currentPage <= 1
            ? "cursor-not-allowed border-line bg-slate-100 text-slate-400"
            : "border-line bg-white text-slate-800 hover:border-[#0f2f8e] hover:bg-[#0f2f8e] hover:text-white",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Trước</span>
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${currentPage}-${index}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-white text-slate-500 sm:h-12 sm:w-12"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : item === currentPage ? (
            <span
              key={item}
              aria-current="page"
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-[#0f2f8e] px-3 text-sm font-bold text-white shadow-sm sm:h-12 sm:min-w-12 sm:px-4"
            >
              {item}
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl border border-line bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-[#0f2f8e] hover:bg-[#0f2f8e] hover:text-white sm:h-12 sm:min-w-12 sm:px-4"
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
          "inline-flex h-10 items-center gap-1.5 rounded-2xl border px-3 text-sm font-semibold transition sm:h-12 sm:gap-2 sm:px-5",
          currentPage >= totalPages
            ? "cursor-not-allowed border-line bg-slate-100 text-slate-400"
            : "border-line bg-white text-slate-800 hover:border-[#0f2f8e] hover:bg-[#0f2f8e] hover:text-white",
        )}
      >
        <span className="sr-only sm:not-sr-only">Sau</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

