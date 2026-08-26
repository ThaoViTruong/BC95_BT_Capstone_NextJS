"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

import { getCurrentUser } from "@/lib/auth-storage";
import {
  FAVORITE_ROOMS_EVENT,
  isFavoriteRoom,
  toggleFavoriteRoom,
} from "@/lib/favorite-rooms-storage";

type RoomActionsProps = {
  roomId: number;
};

function useUserId() {
  return useMemo(() => {
    const rawId = getCurrentUser()?.id;
    const value = typeof rawId === "number" ? rawId : Number(rawId);
    return Number.isInteger(value) && value > 0 ? value : undefined;
  }, []);
}

async function copyToClipboard(text: string) {
  if (!text) {
    throw new Error("Thiếu liên kết để sao chép.");
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function RoomActions({ roomId }: RoomActionsProps) {
  const pathname = usePathname();
  const userId = useUserId();
  const [isFavorite, setIsFavorite] = useState(() => isFavoriteRoom(roomId, userId));

  useEffect(() => {
    const sync = () => {
      setIsFavorite(isFavoriteRoom(roomId, userId));
    };

    window.addEventListener("storage", sync);
    window.addEventListener(FAVORITE_ROOMS_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FAVORITE_ROOMS_EVENT, sync);
    };
  }, [roomId, userId]);

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}${pathname}`;
      await copyToClipboard(url);
      toast.success("Đã sao chép liên kết thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể sao chép liên kết.");
    }
  };

  const handleToggleFavorite = () => {
    const next = toggleFavoriteRoom(roomId, userId);
    setIsFavorite(next.isFavorite);
    toast.success(next.isFavorite ? "Đã thêm vào danh sách yêu thích." : "Đã bỏ khỏi yêu thích.");
  };

  return (
    <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 transition hover:border-slate-300 hover:text-slate-900"
      >
        <Share2 className="h-4 w-4" />
        Chia sẻ
      </button>
      <button
        type="button"
        onClick={handleToggleFavorite}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${
          isFavorite
            ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300"
            : "border-line bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
        }`}
        aria-pressed={isFavorite}
      >
        <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-600 text-rose-600" : ""}`} />
        Yêu thích
      </button>
    </div>
  );
}
