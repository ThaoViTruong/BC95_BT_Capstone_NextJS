"use client";

import { useEffect, useMemo, useState } from "react";
import type { Booking } from "@/types/booking";
import type { Location } from "@/types/location";
import type { Room } from "@/types/room";

type Range = "7d" | "30d" | "month" | "all";

export default function AdminReportPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/admin/report", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json()) as {
          bookings?: Booking[];
          rooms?: Room[];
          locations?: Location[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải dữ liệu báo cáo.");
        }

        setBookings(data.bookings ?? []);
        setRooms(data.rooms ?? []);
        setLocations(data.locations ?? []);
      } catch (error) {
        console.error("Lỗi tải báo cáo:", error);
        setError("Không thể tải dữ liệu báo cáo.");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, []);

  function getNights(booking: Booking) {
    const checkIn = new Date(booking.ngayDen);
    const checkOut = new Date(booking.ngayDi);
    const milliseconds = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(milliseconds / (1000 * 60 * 60 * 24));

    return Math.max(nights, 0);
  }

  const filteredBookings = useMemo(() => {
    const now = new Date();

    return bookings.filter((booking) => {
      if (range === "all") {
        return true;
      }

      const bookingDate = new Date(booking.ngayDen);

      if (Number.isNaN(bookingDate.getTime())) {
        return false;
      }

      if (range === "7d") {
        const from = new Date();
        from.setHours(0, 0, 0, 0);
        from.setDate(from.getDate() - 7);

        return bookingDate >= from && bookingDate <= now;
      }

      if (range === "30d") {
        const from = new Date();
        from.setHours(0, 0, 0, 0);
        from.setDate(from.getDate() - 30);

        return bookingDate >= from && bookingDate <= now;
      }

      if (range === "month") {
        return (
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear()
        );
      }

      return true;
    });
  }, [bookings, range]);

  const roomMap = useMemo(() => {
    return new Map(rooms.map((room) => [room.id, room]));
  }, [rooms]);

  const locationMap = useMemo(() => {
    return new Map(locations.map((location) => [location.id, location]));
  }, [locations]);

  const totalRevenue = useMemo(() => {
    return filteredBookings.reduce((total, booking) => {
      const room = roomMap.get(booking.maPhong);

      if (!room) {
        return total;
      }

      const nights = getNights(booking);

      return total + nights * room.giaTien;
    }, 0);
  }, [filteredBookings, roomMap]);

  const totalNights = useMemo(() => {
    return filteredBookings.reduce((total, booking) => {
      return total + getNights(booking);
    }, 0);
  }, [filteredBookings]);

  const averageBookingValue =
    filteredBookings.length > 0 ? totalRevenue / filteredBookings.length : 0;

  const topRooms = useMemo(() => {
    const countMap: Record<number, number> = {};

    filteredBookings.forEach((booking) => {
      countMap[booking.maPhong] = (countMap[booking.maPhong] ?? 0) + 1;
    });

    return Object.entries(countMap)
      .map(([roomId, count]) => {
        const id = Number(roomId);
        const room = roomMap.get(id);

        return {
          id,
          name: room?.tenPhong ?? `Phòng #${id}`,
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredBookings, roomMap]);

  const topLocations = useMemo(() => {
    const countMap: Record<number, number> = {};

    filteredBookings.forEach((booking) => {
      const room = roomMap.get(booking.maPhong);

      if (!room) {
        return;
      }

      const locationId = room.maViTri;

      countMap[locationId] = (countMap[locationId] ?? 0) + 1;
    });

    return Object.entries(countMap)
      .map(([locationId, count]) => {
        const id = Number(locationId);
        const location = locationMap.get(id);

        return {
          id,
          name: location?.tenViTri ?? `Địa điểm #${id}`,
          city: location?.tinhThanh ?? "",
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredBookings, roomMap, locationMap]);

  const maxRoomCount = Math.max(...topRooms.map((room) => room.count), 1);

  const maxLocationCount = Math.max(
    ...topLocations.map((location) => location.count),
    1,
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-80 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-3xl bg-slate-100"
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />

          <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-bold text-red-700">Không thể tải báo cáo</h2>

        <p className="mt-2 text-sm text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Báo cáo & thống kê</h1>

          <p className="mt-1 text-sm text-white/80">
            Theo dõi hiệu suất đặt phòng và doanh thu
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-card p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            {
              value: "7d" as const,
              label: "7 ngày",
            },
            {
              value: "30d" as const,
              label: "30 ngày",
            },
            {
              value: "month" as const,
              label: "Tháng này",
            },
            {
              value: "all" as const,
              label: "Tất cả",
            },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRange(item.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                range === item.value
                  ? "bg-[#0B246D] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Doanh thu ước tính"
          value={`${totalRevenue.toLocaleString("vi-VN")} ₫`}
          icon="₫"
          color="green"
        />

        <KpiCard
          title="Tổng đơn đặt"
          value={`${filteredBookings.length.toLocaleString("vi-VN")} đơn`}
          icon="✓"
          color="blue"
        />

        <KpiCard
          title="Thời gian lưu trú"
          value={`${totalNights.toLocaleString("vi-VN")} đêm`}
          icon="☾"
          color="purple"
        />

        <KpiCard
          title="Trung bình / đơn"
          value={`${Math.round(averageBookingValue).toLocaleString("vi-VN")} ₫`}
          icon="↗"
          color="orange"
        />
      </section>

      {filteredBookings.length === 0 && (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-xl">
            📊
          </div>

          <h3 className="mt-4 font-bold text-slate-900">Không có dữ liệu</h3>

          <p className="mt-1 text-sm text-slate-500">
            Không có booking trong khoảng thời gian này.
          </p>
        </section>
      )}

      {filteredBookings.length > 0 && (
        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-3xl border border-line bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Top phòng được đặt nhiều nhất
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Xếp hạng dựa trên số lượt đặt
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {topRooms.map((room, index) => {
                const percentage = (room.count / maxRoomCount) * 100;

                return (
                  <div
                    key={room.id}
                    className="group rounded-2xl border border-line p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <RankingNumber index={index} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-semibold text-slate-950">
                            {room.name}
                          </p>

                          <p className="shrink-0 font-bold text-slate-950">
                            {room.count}
                            <span className="ml-1 text-xs font-normal text-slate-500">
                              lượt
                            </span>
                          </p>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          ID phòng: {room.id}
                        </p>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#0B246D] transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-3xl border border-line bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Top địa điểm được đặt nhiều nhất
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Địa điểm được khách lựa chọn nhiều nhất
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {topLocations.map((location, index) => {
                const percentage = (location.count / maxLocationCount) * 100;

                return (
                  <div
                    key={location.id}
                    className="group rounded-2xl border border-line p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <RankingNumber index={index} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-semibold text-slate-950">
                            {location.name}
                          </p>

                          <p className="shrink-0 font-bold text-slate-950">
                            {location.count}
                            <span className="ml-1 text-xs font-normal text-slate-500">
                              lượt
                            </span>
                          </p>
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {location.city || `ID địa điểm: ${location.id}`}
                        </p>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

function RankingNumber({ index }: { index: number }) {
  const colors = [
    "bg-amber-400 text-amber-950",
    "bg-slate-300 text-slate-700",
    "bg-orange-300 text-orange-900",
  ];

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
        colors[index] ?? "bg-[#0B246D] text-white"
      }`}
    >
      {index + 1}
    </div>
  );
}

type KpiCardProps = {
  title: string;
  value: string;
  icon: string;
  color: "green" | "blue" | "purple" | "orange";
};

function KpiCard({ title, value, icon, color }: KpiCardProps) {
  const colorClasses = {
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <article className="group flex min-h-[152px] flex-col rounded-3xl border border-line bg-card px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:min-h-[160px]">
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[78%] text-sm font-semibold leading-5 text-slate-500 sm:max-w-[72%]">
          {title}
        </p>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-xl text-sm font-bold ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-slate-50/70 px-2.5 py-3">
        <p className="min-w-0 whitespace-nowrap text-[clamp(1rem,3.8vw,1.34rem)] leading-none font-extrabold tracking-[-0.01em] text-slate-950 sm:text-[clamp(1.08rem,1.42vw,1.34rem)]">
          {value}
        </p>
      </div>
    </article>
  );
}
