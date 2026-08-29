import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { formatCurrency } from "@/lib/format";
import { getRoomImageSrc } from "@/lib/room-image";
import type { Room } from "@/types/room";

type RoomCardProps = {
  room: Room;
};

export function RoomCard({ room }: RoomCardProps) {
  const roomImageSrc = getRoomImageSrc(room.hinhAnh);

  return (
    <Link
      href={`/phong/${room.id}` as Route}
      className="group block h-full overflow-hidden rounded-[24px] border border-line bg-card shadow-sm transition duration-300 active:scale-[0.99] hover:-translate-y-1 hover:shadow-xl sm:rounded-[28px]"
    >
      <article className="flex h-full flex-col">
        <div className="relative aspect-[5/6] bg-slate-100 sm:aspect-[4/3]">
          <Image
            src={roomImageSrc}
            alt={room.tenPhong}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 639px) 50vw, (max-width: 1024px) 100vw, 33vw"
          />
          <div className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
            {room.khach} khách
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3.5 sm:p-6">
          <h2 className="line-clamp-2 text-sm font-bold text-slate-950 sm:text-xl">{room.tenPhong}</h2>

          <p className="mt-2 text-xs font-semibold text-[#0f2f8e] sm:mt-3 sm:text-sm">
            {formatCurrency(room.giaTien)} / đêm
          </p>

          <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600 sm:mt-3 sm:text-sm sm:leading-6">{room.moTa}</p>

          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-500 sm:mt-4 sm:gap-2 sm:text-xs">
            <span className="rounded-full border border-line px-2 py-1 sm:px-3">
              {room.phongNgu} phòng ngủ
            </span>
            <span className="rounded-full border border-line px-2 py-1 sm:px-3">
              {room.giuong} giường
            </span>
            <span className="rounded-full border border-line px-2 py-1 sm:px-3">
              {room.phongTam} phòng tắm
            </span>
          </div>

          <span className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition group-hover:bg-[#0f2f8e] sm:mt-5 sm:w-auto sm:px-4 sm:text-sm">
            Xem chi tiết
          </span>
        </div>
      </article>
    </Link>
  );
}
