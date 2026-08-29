"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Heart, MapPin } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/format";
import { getRoomImageSrc } from "@/lib/room-image";
import {
  FAVORITE_ROOMS_EVENT,
  getFavoriteRoomIds,
  toggleFavoriteRoom,
} from "@/lib/favorite-rooms-storage";
import { PaginationButtons } from "@/components/shared/pagination-buttons";
import type { Room } from "@/types/room";

type FavoriteRoomsSectionProps = {
  userId: number;
};

type FavoriteRoomView = Room & {
  locationText: string;
};

type RoomApiResponse = {
  room: Room;
  locationText: string;
};

async function getFavoriteRoomView(roomId: number): Promise<FavoriteRoomView | null> {
  const response = await fetch(`/api/rooms/${roomId}`, { cache: "no-store" });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as RoomApiResponse;
  if (!data?.room?.id) {
    return null;
  }

  return {
    ...data.room,
    locationText: data.locationText || "Địa điểm đang cập nhật",
  };
}

export function FavoriteRoomsSection({ userId }: FavoriteRoomsSectionProps) {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [rooms, setRooms] = useState<FavoriteRoomView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingRemoveRoomId, setPendingRemoveRoomId] = useState<number | null>(null);

  const normalizedUserId = useMemo(
    () => {
      const value = typeof userId === "number" ? userId : Number(userId);
      return Number.isInteger(value) && value > 0 ? value : undefined;
    },
    [userId],
  );

  useEffect(() => {
    const sync = () => {
      setFavoriteIds(getFavoriteRoomIds(normalizedUserId));
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(FAVORITE_ROOMS_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FAVORITE_ROOMS_EVENT, sync);
    };
  }, [normalizedUserId]);

  useEffect(() => {
    let isCancelled = false;

    const loadRooms = async () => {
      if (favoriteIds.length === 0) {
        setRooms([]);
        return;
      }

      try {
        setIsLoading(true);
        const roomResults = await Promise.all(
          favoriteIds.map((roomId) => getFavoriteRoomView(roomId)),
        );

        if (isCancelled) {
          return;
        }

        const validRooms = roomResults.filter((item): item is FavoriteRoomView => Boolean(item));
        const roomMap = new Map(validRooms.map((room) => [room.id, room]));
        const sortedRooms = favoriteIds
          .map((id) => roomMap.get(id))
          .filter((item): item is FavoriteRoomView => Boolean(item));

        setRooms(sortedRooms);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadRooms();

    return () => {
      isCancelled = true;
    };
  }, [favoriteIds]);

  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(rooms.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = rooms.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const roomsToShow = rooms.slice(startIndex, startIndex + pageSize);

  const handleRemoveFavorite = (roomId: number) => {
    const next = toggleFavoriteRoom(roomId, normalizedUserId);
    if (!next.isFavorite) {
      toast.success("Đã bỏ khỏi yêu thích.");
    }
  };

  const pendingRemoveRoom = rooms.find((room) => room.id === pendingRemoveRoomId) ?? null;

  return (
    <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#0f2f8e]">
          <Heart className="h-5 w-5 fill-rose-600 text-rose-600" />
          <h2 className="text-2xl font-extrabold text-slate-950">Phòng yêu thích</h2>
        </div>
        <p className="text-sm font-semibold text-slate-500">
          {favoriteIds.length > 0 ? `${favoriteIds.length} phòng` : "Chưa có phòng nào"}
        </p>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-2xl bg-slate-50 px-5 py-5 text-sm font-medium text-slate-600">
          Đang tải danh sách yêu thích...
        </div>
      ) : roomsToShow.length > 0 ? (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {roomsToShow.map((room) => (
              <article
                key={room.id}
                className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-sm"
              >
                <div className="relative h-48 bg-slate-100">
                  <Image
                    src={getRoomImageSrc(room.hinhAnh)}
                    alt={room.tenPhong}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingRemoveRoomId(room.id)}
                    className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-sm transition hover:bg-white"
                    aria-label="Bỏ khỏi yêu thích"
                  >
                    <Heart className="h-5 w-5 fill-rose-600 text-rose-600" />
                  </button>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-slate-950">
                        {room.tenPhong}
                      </h3>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                        <MapPin className="h-4 w-4 text-[#0f2f8e]" />
                        <span className="truncate">{room.locationText}</span>
                      </p>
                    </div>
                    <p className="text-right text-sm font-semibold text-slate-900">
                      {room.giaTien > 0
                        ? `${formatCurrency(room.giaTien)} / đêm`
                        : "Giá đang cập nhật"}
                    </p>
                  </div>

                  <Link
                    href={`/phong/${room.id}`}
                    className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-900 transition hover:bg-[#0f2f8e] hover:text-white"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <PaginationButtons
            className="mt-6"
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <div className="mt-5 rounded-[24px] border border-dashed border-line bg-white p-7 text-center">
          <p className="text-lg font-bold text-slate-950">Bạn chưa có phòng yêu thích</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Khi bấm nút Yêu thích ở trang chi tiết phòng, các phòng đó sẽ xuất hiện tại đây.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0f2f8e] px-5 text-sm font-bold text-white transition hover:bg-[#0b246d]"
          >
            Khám phá phòng ngay
          </Link>
        </div>
      )}

      {pendingRemoveRoom ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={() => setPendingRemoveRoomId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="favorite-remove-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
                !
              </div>

              <h3 id="favorite-remove-title" className="mt-4 text-xl font-bold text-slate-950">
                Xác nhận xóa khỏi yêu thích
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Bạn có chắc chắn muốn bỏ phòng &quot;{pendingRemoveRoom.tenPhong}&quot; khỏi danh
                sách yêu thích không?
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPendingRemoveRoomId(null)}
                className="flex-1 rounded-xl border border-line px-4 py-2.5 font-semibold transition hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={() => {
                  handleRemoveFavorite(pendingRemoveRoom.id);
                  setPendingRemoveRoomId(null);
                }}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
