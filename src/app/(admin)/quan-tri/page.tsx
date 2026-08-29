"use client";

import { useEffect, useState } from "react";
import {
  BedDouble,
  CalendarCheck,
  MapPin,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";

type DashboardStats = {
  users: number;
  rooms: number;
  locations: number;
  bookings: number;
  comments: number;
};

const initialStats: DashboardStats = {
  users: 0,
  rooms: 0,
  locations: 0,
  bookings: 0,
  comments: 0,
};

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboard(isRefresh = false) {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = (await response.json()) as DashboardStats & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải dữ liệu dashboard.");
      }

      setStats({
        users: data.users,
        rooms: data.rooms,
        locations: data.locations,
        bookings: data.bookings,
        comments: data.comments,
      });
    } catch (error) {
      console.error("Lỗi tải dashboard:", error);

      setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const adminStats = [
    {
      label: "Người dùng",
      value: stats.users,
      icon: Users,
      iconClass: "text-blue-600",
      iconBg: "bg-blue-50",
      href: "/quan-tri/nguoi-dung",
    },
    {
      label: "Phòng",
      value: stats.rooms,
      icon: BedDouble,
      iconClass: "text-violet-600",
      iconBg: "bg-violet-50",
      href: "/quan-tri/phong",
    },
    {
      label: "Địa điểm",
      value: stats.locations,
      icon: MapPin,
      iconClass: "text-emerald-600",
      iconBg: "bg-emerald-50",
      href: "/quan-tri/dia-diem",
    },
    {
      label: "Đơn đặt phòng",
      value: stats.bookings,
      icon: CalendarCheck,
      iconClass: "text-orange-600",
      iconBg: "bg-orange-50",
      href: "/quan-tri/booking",
    },
    {
      label: "Bình luận",
      value: stats.comments,
      icon: MessageSquare,
      iconClass: "text-pink-600",
      iconBg: "bg-pink-50",
      href: "/quan-tri/danh-gia",
    },
  ];

  const currentDate = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-40 h-56 w-56 rounded-full bg-violet-100/60 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Tổng quan hệ thống
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-500 sm:mt-3 sm:max-w-2xl sm:text-base">
              Theo dõi số liệu và quản lý hoạt động của hệ thống đặt phòng
              tại một nơi.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Hôm nay
              </p>

              <p className="mt-1 text-xs font-semibold capitalize text-slate-700 sm:text-sm">
                {currentDate}
              </p>
            </div>

            
          </div>
        </div>
      </section>

      {error && (
        <section className="flex flex-col gap-4 rounded-3xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-red-700">
              Không thể tải dashboard
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Thử lại
          </button>
        </section>
      )}

      {loading && !error && (
        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={`h-[136px] animate-pulse rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm sm:h-[180px] sm:p-5 ${
                index === 4 ? "col-span-2 xl:col-span-4" : ""
              }`}
            >
              <div className="h-9 w-9 rounded-2xl bg-slate-100 sm:h-11 sm:w-11" />

              <div className="mt-4 h-7 w-16 rounded-lg bg-slate-100 sm:mt-6 sm:h-8 sm:w-20" />

              <div className="mt-2 h-3.5 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </section>
      )}

      {!loading && !error && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {adminStats.map((item, index) => {
              const Icon = item.icon;
              const shouldFullWidth = index === adminStats.length - 1 && adminStats.length % 2 === 1;

              return (
                <div
                  
                  key={item.label}
                  className={`group rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md sm:p-5 ${
                    shouldFullWidth ? "col-span-2 xl:col-span-4" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-2xl ${item.iconBg} sm:h-11 sm:w-11`}
                    >
                      <Icon
                        size={18}
                        className={item.iconClass}
                      />
                    </div>

                    
                  </div>

                  <p className="mt-3 whitespace-nowrap text-[30px] font-bold tracking-tight text-slate-950 sm:mt-5 sm:text-3xl">
                    {item.value.toLocaleString("vi-VN")}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-700 sm:text-sm">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </section>

          

          
        </>
      )}
    </div>
  );
}
