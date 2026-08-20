import { SetupPanel } from "@/components/shared/setup-panel";
import { roomsService } from "@/services/rooms.service";
import type { Room } from "@/types/room";

import { RoomCard } from "./_components/room-card";

export const dynamic = "force-dynamic";

type RoomPageData =
  | { ok: true; roomList: Room[] }
  | { ok: false; message: string };

async function getRoomPageData(): Promise<RoomPageData> {
  try {
    return { ok: true, roomList: await roomsService.getAll() };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Không thể tải danh sách phòng.",
    };
  }
}

export default async function RoomPage() {
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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Khách ghé qua
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Danh sách phòng</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Trang này đã nối trực tiếp với API phòng thuê. Bạn có thể dùng tiếp
          `roomsService.getPaging()` hoặc `roomsService.getByLocation()` để làm bộ lọc.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {data.roomList.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </section>
    </main>
  );
}
