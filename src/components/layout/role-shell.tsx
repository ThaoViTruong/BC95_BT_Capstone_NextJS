"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

type RoleShellProps = {
  title: string;
  desc: string;
  items: NavItem[];
  children: React.ReactNode;
};

export function RoleShell({ title, desc, items, children }: RoleShellProps) {
  const path = usePathname();

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
      <aside className="rounded-3xl border border-line bg-card p-5 shadow-sm">
        <div className="space-y-2 border-b border-line pb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Vai trò
          </p>
          <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          <p className="text-sm leading-6 text-slate-600">{desc}</p>
        </div>

        <nav className="mt-4 space-y-2">
          {items.map((item, index) => {
            const active =
              index === 0
                ? path === item.href
                : path === item.href || path.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-2xl border px-4 py-3 transition",
                  active
                    ? "border-[#0B246D] bg-[#0B246D] text-white"
                    : "border-line bg-white text-slate-800 hover:bg-slate-400",
                )}
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p
                  className={cn(
                    "mt-1 text-xs leading-5",
                    active ? "text-slate-200" : "text-slate-500",
                  )}
                >
                  {item.note}
                </p>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="space-y-6">{children}</div>
    </section>
  );
}
