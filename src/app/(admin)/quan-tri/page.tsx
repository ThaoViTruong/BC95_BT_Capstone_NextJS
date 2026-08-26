"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";

import { usersService } from "@/services/users.service";
import { roomsService } from "@/services/rooms.service";
import { locationsService } from "@/services/locations.service";
import { bookingsService } from "@/services/bookings.service";
import { commentsService } from "@/services/comments.service";

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function fetchDashboard(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [users, rooms, locations, bookings, comments] =
        await Promise.all([
          usersService.getAll(),
          roomsService.getAll(),
          locationsService.getAll(),
          bookingsService.getAll(),
          commentsService.getAll(),
        ]);

      setStats({
        users: users.length,
        rooms: rooms.length,
        locations: locations.length,
        bookings: bookings.length,
        comments: comments.length,
      });
    } catch (error) {
      console.error("Lỗi tải dashboard:", error);

      setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const adminStats = [
    {
      label: "Người dùng",
      value: stats.users,
      description: "Tài khoản hệ thống",
      icon: Users,
      iconClass: "text-blue-600",
      iconBg: "bg-blue-50",
      href: "/admin/users",
    },
    {
      label: "Phòng",
      value: stats.rooms,
      description: "Phòng đang quản lý",
      icon: BedDouble,
      iconClass: "text-violet-600",
      iconBg: "bg-violet-50",
      href: "/admin/rooms",
    },
    {
      label: "Địa điểm",
      value: stats.locations,
      description: "Địa điểm hiện có",
      icon: MapPin,
      iconClass: "text-emerald-600",
      iconBg: "bg-emerald-50",
      href: "/admin/locations",
    },
    {
      label: "Đơn đặt phòng",
      value: stats.bookings,
      description: "Tổng lượt đặt phòng",
      icon: CalendarCheck,
      iconClass: "text-orange-600",
      iconBg: "bg-orange-50",
      href: "/admin/bookings",
    },
    {
      label: "Bình luận",
      value: stats.comments,
      description: "Đánh giá từ khách hàng",
      icon: MessageSquare,
      iconClass: "text-pink-600",
      iconBg: "bg-pink-50",
      href: "/admin/comments",
    },
  ];

  const maxValue = Math.max(
    stats.users,
    stats.rooms,
    stats.locations,
    stats.bookings,
    stats.comments,
    1,
  );

  const overviewItems = [
    {
      label: "Người dùng",
      value: stats.users,
      color: "bg-blue-500",
    },
    {
      label: "Phòng",
      value: stats.rooms,
      color: "bg-violet-500",
    },
    {
      label: "Địa điểm",
      value: stats.locations,
      color: "bg-emerald-500",
    },
    {
      label: "Đặt phòng",
      value: stats.bookings,
      color: "bg-orange-500",
    },
    {
      label: "Bình luận",
      value: stats.comments,
      color: "bg-pink-500",
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
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-40 h-56 w-56 rounded-full bg-violet-100/60 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Tổng quan hệ thống
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Theo dõi số liệu và quản lý hoạt động của hệ thống đặt phòng
              tại một nơi.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Hôm nay
              </p>

              <p className="mt-1 text-sm font-semibold capitalize text-slate-700">
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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-[180px] animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-11 w-11 rounded-2xl bg-slate-100" />

              <div className="mt-6 h-8 w-20 rounded-lg bg-slate-100" />

              <div className="mt-3 h-4 w-28 rounded bg-slate-100" />

              <div className="mt-2 h-3 w-20 rounded bg-slate-50" />
            </div>
          ))}
        </section>
      )}

      {!loading && !error && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {adminStats.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  
                  key={item.label}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconBg}`}
                    >
                      <Icon
                        size={21}
                        className={item.iconClass}
                      />
                    </div>

                    
                  </div>

                  <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
                    {item.value.toLocaleString("vi-VN")}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {item.label}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {item.description}
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