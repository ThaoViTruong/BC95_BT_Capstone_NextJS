import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SetupPanel } from "@/components/shared/setup-panel";
import { ApiError } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { commentsService } from "@/services/comments.service";
import { roomsService } from "@/services/rooms.service";
import type { Comment } from "@/types/comment";
import type { Room } from "@/types/room";

type RoomDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

type RoomDetailData =
  | { ok: true; room: Room; comments: Comment[] }
  | { ok: false; message: string; status?: number };

async function getRoomDetailData(roomId: number): Promise<RoomDetailData> {
  try {
    const room = await roomsService.getById(roomId);
    const comments = await commentsService.getByRoom(roomId).catch(() => []);

    return {
      ok: true,
      room,
      comments,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        message: error.message,
        status: error.status,
      };
    }

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Không thể tải chi tiết phòng.",
    };
  }
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { slug } = await params;
  const roomId = Number(slug);

  if (!Number.isInteger(roomId) || roomId <= 0) {
    notFound();
  }

  const data = await getRoomDetailData(roomId);

  if (!data.ok && data.status === 404) {
    notFound();
  }

  if (!data.ok) {
    const message = data.message;

    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <SetupPanel
          title="Chưa tải được chi tiết phòng"
          desc="Lớp kết nối API đã sẵn, nhưng hiện tại thiếu cấu hình môi trường hoặc token chưa hợp lệ."
          lines={[
            "Kiểm tra NEXT_PUBLIC_API_URL trong .env.local",
            "Kiểm tra NEXT_PUBLIC_CYBERSOFT_TOKEN còn hạn và đúng giá trị",
            `Chi tiết lỗi hiện tại: ${message}`,
          ]}
        />
      </main>
    );
  }

  const { room, comments } = data;
  const amenityList = [
    room.mayGiat ? "Máy giặt" : null,
    room.banLa ? "Bàn là" : null,
    room.tivi ? "Tivi" : null,
    room.dieuHoa ? "Điều hòa" : null,
    room.wifi ? "Wifi" : null,
    room.bep ? "Bếp" : null,
    room.doXe ? "Đỗ xe" : null,
    room.hoBoi ? "Hồ bơi" : null,
    room.banUi ? "Bàn ủi" : null,
  ].filter(Boolean) as string[];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
          <div className="relative aspect-[16/10]">
            <Image
              src={room.hinhAnh || "/file.svg"}
              alt={room.tenPhong}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
        </div>

        <article className="rounded-3xl border border-line bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Chi tiết phòng
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{room.tenPhong}</h1>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {formatCurrency(room.giaTien)} / đêm
          </p>
          <p className="mt-4 text-base leading-7 text-slate-600">{room.moTa}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">{room.khach} khách</div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              {room.phongNgu} phòng ngủ
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">{room.giuong} giường</div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              {room.phongTam} phòng tắm
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dat-phong"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Đi tới luồng đặt phòng
            </Link>
            <Link
              href="/phong"
              className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              Quay lại danh sách
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-line bg-card p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Thông tin cơ bản</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Mã phòng: {room.id}
            <br />
            Mã vị trí: {room.maViTri}
          </p>
        </article>

        <article className="rounded-3xl border border-line bg-card p-5 shadow-sm md:col-span-2">
          <h2 className="text-lg font-bold text-slate-950">Tiện nghi</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {amenityList.length > 0 ? (
              amenityList.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-line px-3 py-2 text-sm text-slate-700"
                >
                  {item}
                </span>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600">Chưa có tiện nghi nào.</p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Bình luận
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Đánh giá từ người dùng</h2>
          </div>
          <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            {comments.length} bình luận
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {comments.length > 0 ? (
            comments.map((item) => (
              <article key={item.id} className="rounded-3xl border border-line bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {item.tenNguoiBinhLuan || `Người dùng #${item.maNguoiBinhLuan}`}
                    </p>
                    <p className="text-sm text-slate-500">{formatDate(item.ngayBinhLuan)}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                    {item.saoBinhLuan}/5
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.noiDung}</p>
              </article>
            ))
          ) : (
            <p className="text-sm leading-6 text-slate-600">
              Chưa có bình luận nào cho phòng này.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
