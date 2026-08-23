import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import type { UrlObject } from "url";

import { cn } from "@/lib/utils";

type PaginationNavProps = {
  pathname: string;
  query?: Record<string, string | number | undefined>;
  currentPage: number;
  totalPages: number;
  className?: string;
};

function buildPageHref(
  pathname: string,
  query: Record<string, string | number | undefined>,
  page: number,
): UrlObject {
  const nextQuery: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    const normalizedValue = String(value).trim();

    if (!normalizedValue) {
      continue;
    }

    nextQuery[key] = normalizedValue;
  }

  if (page > 1) {
    nextQuery.page = String(page);
  } else {
    delete nextQuery.page;
  }

  return {
    pathname,
    query: nextQuery,
  };
}

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

export function PaginationNav({
  pathname,
  query = {},
  currentPage,
  totalPages,
  className,
}: PaginationNavProps) {
  if (totalPages <= 1) {
    return null;
  }

  const items = getPaginationItems(currentPage, totalPages);
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav
      aria-label="Phân trang danh sách phòng"
      className={cn("flex flex-wrap items-center justify-center gap-3", className)}
    >
      {currentPage > 1 ? (
        <Link
          href={buildPageHref(pathname, query, previousPage)}
          className="inline-flex h-12 items-center gap-2 rounded-2xl border border-line bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-[#0f2f8e] hover:bg-[#0f2f8e] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </Link>
      ) : (
        <span className="inline-flex h-12 cursor-not-allowed items-center gap-2 rounded-2xl border border-line bg-slate-100 px-5 text-sm font-semibold text-slate-400">
          <ChevronLeft className="h-4 w-4" />
          Trước
        </span>
      )}

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
            <Link
              key={item}
              href={buildPageHref(pathname, query, item)}
              className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl border border-line bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-[#0f2f8e] hover:bg-[#0f2f8e] hover:text-white"
            >
              {item}
            </Link>
          ),
        )}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={buildPageHref(pathname, query, nextPage)}
          className="inline-flex h-12 items-center gap-2 rounded-2xl border border-line bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-[#0f2f8e] hover:bg-[#0f2f8e] hover:text-white"
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-12 cursor-not-allowed items-center gap-2 rounded-2xl border border-line bg-slate-100 px-5 text-sm font-semibold text-slate-400">
          Sau
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
