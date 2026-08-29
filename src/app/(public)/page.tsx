import Link from "next/link";
import type { Route } from "next";
import { CircleX } from "lucide-react";

import { HomeHero } from "@/app/(public)/_components/home-hero";
import { RoomCard } from "@/app/(public)/phong/_components/room-card";
import { PaginationNav } from "@/components/shared/pagination-nav";
import { RoomSearchForm } from "@/components/shared/room-search-form";
import { SetupPanel } from "@/components/shared/setup-panel";
import {
  buildAmenityOptions,
  buildLocationOptions,
  buildSearchHref,
  filterRooms,
  getLocationLabel,
  getSearchableLocations,
  normalizeSearchText,
} from "@/lib/room-search";
import { cn } from "@/lib/utils";
import { bookingsService } from "@/services/bookings.service";
import { commentsService } from "@/services/comments.service";
import { locationsService } from "@/services/locations.service";
import { roomsService } from "@/services/rooms.service";
import type { Booking } from "@/types/booking";
import type { Comment } from "@/types/comment";
import type { Location } from "@/types/location";
import type { Room } from "@/types/room";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    diemDen?: string;
    tenPhong?: string;
    tienIch?: string;
    ngayNhan?: string;
    ngayTra?: string;
    tuKhoa?: string;
    khach?: string;
    page?: string;
  }>;
};

type HomePageData =
  | { ok: true; roomList: Room[]; locationList: Location[]; bookings: Booking[]; comments: Comment[] }
  | { ok: false; message: string };

async function getHomePageData(): Promise<HomePageData> {
  try {
    const [roomList, locationList, bookings, comments] = await Promise.all([
      roomsService.getAll(),
      locationsService.getAll(),
      bookingsService.getAll().catch(() => []),
      commentsService.getAll().catch(() => []),
    ]);

    return { ok: true, roomList, locationList, bookings, comments };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Không thể tải dữ liệu trang chủ.",
    };
  }
}

function buildRoomCountMap<T extends { maPhong: number }>(items: T[]) {
  const countMap = new Map<number, number>();

  for (const item of items) {
    countMap.set(item.maPhong, (countMap.get(item.maPhong) ?? 0) + 1);
  }

  return countMap;
}

function rankRoomsByPopularity(rooms: Room[], bookings: Booking[], comments: Comment[]) {
  const bookingCountMap = buildRoomCountMap(bookings);
  const commentCountMap = buildRoomCountMap(comments);

  return [...rooms].sort((roomA, roomB) => {
    const bookingCountA = bookingCountMap.get(roomA.id) ?? 0;
    const bookingCountB = bookingCountMap.get(roomB.id) ?? 0;

    if (bookingCountA !== bookingCountB) {
      return bookingCountB - bookingCountA;
    }

    const commentCountA = commentCountMap.get(roomA.id) ?? 0;
    const commentCountB = commentCountMap.get(roomB.id) ?? 0;

    if (commentCountA !== commentCountB) {
      return commentCountB - commentCountA;
    }

    return roomB.id - roomA.id;
  });
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const query = await searchParams;
  const data = await getHomePageData();

  if (!data.ok) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SetupPanel
          title="Chưa gọi được dữ liệu trang chủ"
          desc="Hệ thống đã có luồng gọi API thật, nhưng hiện tại chưa thể lấy danh sách phòng để hiển thị."
          lines={[
            "Kiểm tra NEXT_PUBLIC_API_URL trong Environment Variables trên Vercel hoặc file .env.local",
            "Kiểm tra NEXT_PUBLIC_CYBERSOFT_TOKEN trên Vercel hoặc local còn hạn sử dụng",
            `Chi tiết lỗi hiện tại: ${data.message}`,
          ]}
        />
      </main>
    );
  }

  const { filteredRooms, hasFilter } = filterRooms({
    bookings: data.bookings,
    roomList: data.roomList,
    locationList: data.locationList,
    query,
  });

  const rankedRooms = rankRoomsByPopularity(filteredRooms, data.bookings, data.comments);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(rankedRooms.length / pageSize));
  const rawPage = Number(query.page ?? 1);
  const currentPage = Number.isFinite(rawPage)
    ? Math.min(Math.max(Math.floor(rawPage), 1), totalPages)
    : 1;
  const startIndex = rankedRooms.length === 0 ? 0 : (currentPage - 1) * pageSize;
  const roomsToShow = rankedRooms.slice(startIndex, startIndex + pageSize);
  const locationOptions = buildLocationOptions(data.roomList, data.locationList);
  const amenityOptions = buildAmenityOptions(data.roomList);
  const searchableLocations = getSearchableLocations(data.roomList, data.locationList);
  const activeDestination = normalizeSearchText(query.diemDen ?? "");

  return (
    <main className="pb-12">
      <HomeHero />

      <section className="mx-auto mt-6 w-full max-w-7xl px-4 sm:mt-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-line/70 bg-white/90 p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Điểm đến gợi ý
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-[#dbe4ff] bg-[linear-gradient(135deg,#eef4ff_0%,#ffffff_100%)] p-3.5 sm:p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f2f8e]">
                Tìm nhanh phòng phù hợp
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                Chọn điểm đến, tên phòng, tiện ích, ngày ở và số khách để lọc nhanh
                các phòng còn trống phù hợp.
              </p>
            </div>

            <div className="rounded-[26px] border border-white bg-white p-2.5 shadow-sm sm:p-3">
              <RoomSearchForm
                key={[
                  query.diemDen ?? "",
                  query.tenPhong ?? query.tuKhoa ?? "",
                  query.tienIch ?? "",
                  query.ngayNhan ?? "",
                  query.ngayTra ?? "",
                  query.khach ?? "",
                ].join("|")}
                action="/"
                destination={query.diemDen ?? ""}
                roomName={query.tenPhong ?? query.tuKhoa ?? ""}
                amenity={normalizeSearchText(query.tienIch ?? "")}
                checkIn={query.ngayNhan ?? ""}
                checkOut={query.ngayTra ?? ""}
                guest={query.khach ?? ""}
                locationOptions={locationOptions}
                amenityOptions={amenityOptions}
                submitClassName="h-full"
                panelClassName="border-slate-200/90 bg-white"
              />
            </div>
          </div>
          <p className="mt-4 text-xl font-bold text-slate-950 sm:text-2xl">
            Tìm nhanh theo khu vực nổi bật
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {searchableLocations.slice(0, 8).map((location) => (
              (() => {
                const locationLabel = getLocationLabel(location);
                const isActive = activeDestination === normalizeSearchText(locationLabel);

                return (
                  <Link
                    key={location.id}
                    href={buildSearchHref("/", { diemDen: locationLabel }) as Route}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      isActive
                        ? "border-[#0f2f8e] bg-[#0f2f8e] text-white hover:bg-[#0b246d] hover:text-white"
                        : "border-line bg-slate-50 text-slate-700 hover:border-[#0f2f8e] hover:bg-[#0f2f8e] hover:text-white",
                    )}
                  >
                    {locationLabel}
                  </Link>
                );
              })()
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
              Danh sách phòng
            </h2>
          </div>

          {hasFilter ? (
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              <CircleX className="h-4 w-4" />
              Xóa bộ lọc
            </Link>
          ) : null}
        </div>

        {roomsToShow.length > 0 ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {roomsToShow.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>

            <PaginationNav
              className="mt-6"
              pathname="/"
              query={{
                diemDen: query.diemDen,
                tenPhong: query.tenPhong ?? query.tuKhoa,
                tienIch: query.tienIch,
                ngayNhan: query.ngayNhan,
                ngayTra: query.ngayTra,
                tuKhoa: query.tuKhoa,
                khach: query.khach,
              }}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-line bg-white p-8 text-center">
            <h3 className="text-xl font-semibold text-slate-900">Chưa có phòng phù hợp</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hãy thử lại với điểm đến, ngày ở hoặc tiêu chí khác để xem thêm lựa chọn.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
