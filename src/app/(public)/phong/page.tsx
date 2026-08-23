import Link from "next/link";
import type { Route } from "next";
import { CircleX } from "lucide-react";

import { RoomSearchForm } from "@/components/shared/room-search-form";
import { SetupPanel } from "@/components/shared/setup-panel";
import { buildLocationOptions, buildSearchHref, filterRooms, getLocationLabel, getSearchableLocations, normalizeSearchText, parseGuestCount } from "@/lib/room-search";
import { cn } from "@/lib/utils";
import { locationsService } from "@/services/locations.service";
import { roomsService } from "@/services/rooms.service";
import type { Location } from "@/types/location";
import type { Room } from "@/types/room";

import { RoomCard } from "./_components/room-card";

export const dynamic = "force-dynamic";

type RoomPageProps = {
  searchParams: Promise<{
    diemDen?: string;
    tuKhoa?: string;
    khach?: string;
  }>;
};

type RoomPageData =
  | { ok: true; roomList: Room[]; locationList: Location[] }
  | { ok: false; message: string };

async function getRoomPageData(): Promise<RoomPageData> {
  try {
    const [roomList, locationList] = await Promise.all([
      roomsService.getAll(),
      locationsService.getAll(),
    ]);

    return { ok: true, roomList, locationList };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Không thể tải danh sách phòng.",
    };
  }
}

function getActiveSearchItems(query: { diemDen?: string; tuKhoa?: string; khach?: string }) {
  const items: string[] = [];

  if (query.diemDen?.trim()) {
    items.push(`Điểm đến: ${query.diemDen.trim()}`);
  }

  if (query.tuKhoa?.trim()) {
    items.push(`Từ khóa: ${query.tuKhoa.trim()}`);
  }

  if (parseGuestCount(query.khach) > 0) {
    items.push(`Số khách: ${parseGuestCount(query.khach)} người`);
  }

  return items;
}

export default async function RoomPage({ searchParams }: RoomPageProps) {
  const query = await searchParams;
  const data = await getRoomPageData();

  if (!data.ok) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SetupPanel
          title="Chưa gọi được API phòng"
          desc="Repo đã có lớp kết nối, nhưng hiện tại thiếu biến môi trường hoặc token chưa hợp lệ nên chưa thể lấy dữ liệu thật."
          lines={[
            "Tạo file .env.local từ .env.example",
            "Điền NEXT_PUBLIC_API_URL=https://airbnbnew.cybersoft.edu.vn",
            "Điền NEXT_PUBLIC_CYBERSOFT_TOKEN bằng token course còn hạn",
            `Chi tiết lỗi hiện tại: ${data.message}`,
          ]}
        />
      </main>
    );
  }

  const { filteredRooms, hasFilter } = filterRooms({
    roomList: data.roomList,
    locationList: data.locationList,
    query,
  });
  const activeSearchItems = getActiveSearchItems(query);
  const locationOptions = buildLocationOptions(data.roomList, data.locationList);
  const searchableLocations = getSearchableLocations(data.roomList, data.locationList);
  const activeDestination = normalizeSearchText(query.diemDen ?? "");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[32px] border border-line bg-[linear-gradient(135deg,#eef4ff_0%,#ffffff_100%)] shadow-sm">
        <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f2f8e]">
              Tìm kiếm phòng
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
              {hasFilter ? "Kết quả phù hợp với nhu cầu của bạn" : "Khám phá toàn bộ phòng lưu trú"}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Tìm theo điểm đến, từ khóa phòng và số lượng khách để lọc ra lựa chọn phù hợp
              nhanh hơn.
            </p>

            <div className="mt-6">
              <RoomSearchForm
                action="/phong"
                destination={query.diemDen ?? ""}
                keyword={query.tuKhoa ?? ""}
                guest={query.khach ?? ""}
                locationOptions={locationOptions}
                className="lg:grid-cols-[1.15fr_1fr_0.75fr_auto]"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-[#dbe4ff] bg-white/90 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Tóm tắt tìm kiếm
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{filteredRooms.length} phòng</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasFilter
                ? "Danh sách đã được lọc theo thông tin bạn vừa nhập."
                : "Hiện đang hiển thị toàn bộ phòng lấy từ API thật."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {activeSearchItems.length > 0 ? (
                activeSearchItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#0f2f8e] bg-[#0f2f8e] px-4 py-2 text-sm font-medium text-white"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-dashed border-line px-4 py-2 text-sm text-slate-500">
                  Chưa áp dụng bộ lọc nào
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
              >
                Về trang chủ
              </Link>

              {hasFilter ? (
                <Link
                  href="/phong"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0f2f8e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b246d]"
                >
                  <CircleX className="h-4 w-4" />
                  Xóa bộ lọc
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Khu vực nổi bật
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Gợi ý tìm nhanh theo điểm đến</h2>
          </div>

          <Link
            href="/phong"
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
          >
            Xem tất cả phòng
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {searchableLocations.slice(0, 10).map((location) => (
            (() => {
              const locationLabel = getLocationLabel(location);
              const isActive = activeDestination === normalizeSearchText(locationLabel);

              return (
                <Link
                  key={location.id}
                  href={
                    buildSearchHref("/phong", {
                      diemDen: locationLabel,
                    }) as Route
                  }
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
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Danh sách kết quả
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              {hasFilter ? "Các phòng phù hợp với tìm kiếm" : "Toàn bộ phòng hiện có"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hiển thị {filteredRooms.length} phòng từ dữ liệu phòng thuê thực tế.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => <RoomCard key={room.id} room={room} />)
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <div className="rounded-[28px] border border-dashed border-line bg-white px-6 py-12 text-center shadow-sm">
              <h3 className="text-2xl font-bold text-slate-950">Không tìm thấy phòng phù hợp</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Hãy thử đổi điểm đến, rút gọn từ khóa hoặc giảm số khách để xem thêm lựa chọn.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/phong"
                  className="inline-flex items-center rounded-full bg-[#0f2f8e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b246d]"
                >
                  Làm mới bộ lọc
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
