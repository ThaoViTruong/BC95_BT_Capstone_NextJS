"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  CalendarCheck,
  ChartColumn,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  X,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ADMIN_SIDEBAR_OPEN_EVENT } from "@/components/layout/admin-sidebar-toggle-button";
import type { NavIconKey, NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

type RoleShellProps = {
  title: string;
  desc: string;
  items: NavItem[];
  children: React.ReactNode;
  compactSidebar?: boolean;
};

const navIconMap: Record<NavIconKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  report: ChartColumn,
  users: Users,
  rooms: BedDouble,
  locations: MapPin,
  bookings: CalendarCheck,
  reviews: MessageSquareText,
};

export function RoleShell({
  title,
  desc,
  items,
  children,
  compactSidebar = false,
}: RoleShellProps) {
  const path = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!compactSidebar) {
      return;
    }

    const handleOpenSidebar = () => setIsSidebarOpen(true);

    window.addEventListener(ADMIN_SIDEBAR_OPEN_EVENT, handleOpenSidebar);

    return () => {
      window.removeEventListener(ADMIN_SIDEBAR_OPEN_EVENT, handleOpenSidebar);
    };
  }, [compactSidebar]);

  return (
    <section
      className={cn(
        "mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        compactSidebar
          ? "grid-cols-1 xl:grid-cols-[250px_minmax(0,1fr)]"
          : "lg:grid-cols-[280px_minmax(0,1fr)]",
      )}
    >
      {compactSidebar ? (
        <>
          <div
            className={cn(
              "fixed inset-0 z-[80] bg-black/35 transition xl:hidden",
              isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
            )}
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-[90] w-[260px] max-w-[82vw] border-r border-[#d7e2ff] bg-white px-3 py-5 shadow-2xl transition-transform xl:static xl:inset-auto xl:z-auto xl:w-auto xl:max-w-none xl:self-start xl:rounded-3xl xl:border xl:bg-white xl:p-5 xl:shadow-sm",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full",
              "xl:translate-x-0 xl:sticky xl:top-24",
            )}
          >
            <div className="mb-4 flex items-center justify-between xl:hidden">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B246D]">
                Quản trị
              </p>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#0B246D]"
                aria-label="Đóng menu quản trị"
              >
                <X size={18} />
              </button>
            </div>

            <div className="hidden space-y-2 border-b border-[#d7e2ff] pb-4 xl:block">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0B246D]">
                Vai trò
              </p>
              <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
              <p className="text-sm leading-6 text-slate-600">{desc}</p>
            </div>

            <nav className="grid gap-2 xl:mt-4">
              {items.map((item, index) => {
                const active =
                  index === 0
                    ? path === item.href
                    : path === item.href || path.startsWith(`${item.href}/`);
                const Icon = item.icon ? navIconMap[item.icon] : null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl border px-2.5 py-2.5 text-left transition xl:gap-3 xl:px-3 xl:py-3",
                      active
                        ? "border-[#0B246D] bg-[#0B246D] text-white"
                        : "border-transparent bg-white text-slate-800 hover:bg-[#EEF4FF]",
                    )}
                  >
                    {Icon ? (
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl xl:h-9 xl:w-9",
                          active
                            ? "bg-white/15 text-white"
                            : "bg-[#EEF4FF] text-[#0B246D]",
                        )}
                      >
                        <Icon size={16} />
                      </span>
                    ) : null}

                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-4 xl:text-sm">
                        {item.label}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      ) : (
        <aside className="rounded-3xl border border-line bg-card p-4 shadow-sm sm:p-5 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-2 border-b border-line pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Vai trò
            </p>
            <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
            <p className="text-sm leading-6 text-slate-600">{desc}</p>
          </div>

          <nav className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
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
                      : "border-line bg-white text-slate-800 hover:bg-slate-100",
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
      )}

      <div className="space-y-6 xl:col-start-2">{children}</div>
    </section>
  );
}
