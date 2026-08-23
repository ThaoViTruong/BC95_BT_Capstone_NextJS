import Link from "next/link";
import type { Route } from "next";
import { CircleX } from "lucide-react";

import { HomeHero } from "@/app/(public)/_components/home-hero";
import { RoomCard } from "@/app/(public)/phong/_components/room-card";
import { SetupPanel } from "@/components/shared/setup-panel";
import { buildLocationOptions, buildSearchHref, filterRooms, getLocationLabel, getSearchableLocations, normalizeSearchText } from "@/lib/room-search";
import { cn } from "@/lib/utils";
import { locationsService } from "@/services/locations.service";
import { roomsService } from "@/services/rooms.service";
import type { Location } from "@/types/location";
import type { Room } from "@/types/room";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    diemDen?: string;
    tuKhoa?: string;
    khach?: string;
  }>;
};

type HomePageData =
  | { ok: true; roomList: Room[]; locationList: Location[] }
  | { ok: false; message: string };

async function getHomePageData(): Promise<HomePageData> {
  try {
    const [roomList, locationList] = await Promise.all([
      roomsService.getAll(),
      locationsService.getAll(),
    ]);

    return { ok: true, roomList, locationList };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Không thể tải dữ liệu trang chủ.",
    };
  }
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
            "Kiểm tra NEXT_PUBLIC_API_URL trong file .env.local",
            "Kiểm tra NEXT_PUBLIC_CYBERSOFT_TOKEN còn hạn sử dụng",
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

  const roomsToShow = filteredRooms.slice(0, 8);
  const locationOptions = buildLocationOptions(data.roomList, data.locationList);
  const searchableLocations = getSearchableLocations(data.roomList, data.locationList);
  const activeDestination = normalizeSearchText(query.diemDen ?? "");

  return (
    <main className="pb-12">
      <HomeHero
        destination={query.diemDen ?? ""}
        keyword={query.tuKhoa ?? ""}
        guest={query.khach ?? ""}
        locationOptions={locationOptions}
      />

      <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-line/70 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Điểm đến gợi ý
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Tìm nhanh theo khu vực nổi bật
              </h2>
            </div>

            <Link
              href="/phong"
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              Xem tất cả phòng
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {searchableLocations.slice(0, 8).map((location) => (
              (() => {
                const locationLabel = getLocationLabel(location);
                const isActive = activeDestination === normalizeSearchText(locationLabel);

                return (
                  <Link
                    key={location.id}
                    href={buildSearchHref("/phong", { diemDen: locationLabel }) as Route}
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Danh sách phòng
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              {hasFilter ? "Kết quả phù hợp với tìm kiếm" : "Phòng được quan tâm nhiều"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hiển thị {roomsToShow.length} trên tổng {filteredRooms.length} phòng.
            </p>
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
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {roomsToShow.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>

            {filteredRooms.length > roomsToShow.length ? (
              <div className="mt-6 flex justify-center">
                <Link
                  href={buildSearchHref("/phong", query) as Route}
                  className="inline-flex items-center rounded-full bg-[#0f2f8e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b246d]"
                >
                  Xem thêm {filteredRooms.length - roomsToShow.length} phòng phù hợp
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-line bg-white p-8 text-center">
            <h3 className="text-xl font-semibold text-slate-900">Chưa có phòng phù hợp</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hãy thử lại với điểm đến hoặc từ khóa khác để xem thêm lựa chọn.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
