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
      className="group block overflow-hidden rounded-[28px] border border-line bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <article>
        <div className="relative aspect-[4/3] bg-slate-100">
          <Image
            src={roomImageSrc}
            alt={room.tenPhong}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
          <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
            {room.khach} khách
          </div>
        </div>

        <div className="p-6">
          <h2 className="line-clamp-2 text-xl font-bold text-slate-950">{room.tenPhong}</h2>

          <p className="mt-3 text-sm font-semibold text-[#0f2f8e]">
            {formatCurrency(room.giaTien)} / đêm
          </p>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{room.moTa}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-line px-3 py-1">
              {room.phongNgu} phòng ngủ
            </span>
            <span className="rounded-full border border-line px-3 py-1">
              {room.giuong} giường
            </span>
            <span className="rounded-full border border-line px-3 py-1">
              {room.phongTam} phòng tắm
            </span>
          </div>

          <span className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[#0f2f8e]">
            Xem chi tiết
          </span>
        </div>
      </article>
    </Link>
  );
}
