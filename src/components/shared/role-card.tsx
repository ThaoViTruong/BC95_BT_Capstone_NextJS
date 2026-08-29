import Link from "next/link";

import type { RoleInfo } from "@/config/navigation";

type RoleCardProps = {
  item: RoleInfo;
};

export function RoleCard({ item }: RoleCardProps) {
  return (
    <article className="rounded-3xl border border-line bg-card p-5 shadow-sm transition active:scale-[0.99] hover:-translate-y-1 hover:shadow-md sm:p-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          {item.title}
        </p>
        <p className="text-base leading-7 text-slate-700">{item.desc}</p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="text-sm text-slate-500">{item.items.length} khu chức năng</span>

        <Link
          href={item.href}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Mở khu vực
        </Link>
      </div>
    </article>
  );
}
