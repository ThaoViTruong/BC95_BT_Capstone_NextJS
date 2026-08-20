"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            {siteConfig.shortName}
          </span>
          <span className="text-lg font-bold text-slate-950">{siteConfig.name}</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2">
          {mainNav.map((item) => {
            const active =
              item.href === "/"
                ? path === item.href
                : path === item.href || path.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-line bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
