import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { formatCurrency } from "@/lib/format";
import type { Room } from "@/types/room";

type RoomCardProps = {
  room: Room;
};

export function RoomCard({ room }: RoomCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
      <div className="relative aspect-[4/3] bg-slate-100">
        <Image
          src={room.hinhAnh || "/file.svg"}
          alt={room.tenPhong}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-950">{room.tenPhong}</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {room.khach} khách
          </span>
        </div>

        <p className="mt-2 text-sm font-semibold text-slate-900">
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

        <Link
          href={`/phong/${room.id}` as Route}
          className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}
