import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  CarFront,
  Clock3,
  CookingPot,
  Heart,
  House,
  MapPin,
  Monitor,
  Sparkles,
  Share2,
  Shirt,
  Star,
  Users,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { SetupPanel } from "@/components/shared/setup-panel";
import { ApiError } from "@/lib/api-error";
import { getAuthSession } from "@/lib/auth-session";
import { resolveSessionUser } from "@/lib/auth-session-user";
import { isRenderableCommentContent } from "@/lib/comment-validation";
import { getRoomImageSrc } from "@/lib/room-image";
import { bookingsService } from "@/services/bookings.service";
import { commentsService } from "@/services/comments.service";
import { locationsService } from "@/services/locations.service";
import { roomsService } from "@/services/rooms.service";
import type { Comment } from "@/types/comment";
import type { Location } from "@/types/location";
import type { Room } from "@/types/room";

import { BookingCard } from "./_components/booking-card";
import { CommentForm } from "./_components/comment-form";
import { RoomComments } from "./_components/room-comments";

type RoomDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

type RoomDetailData =
  | { ok: true; room: Room; comments: Comment[]; location: Location | null }
  | { ok: false; message: string; status?: number };

async function getRoomDetailData(roomId: number): Promise<RoomDetailData> {
  try {
    const room = await roomsService.getById(roomId);
    const [comments, location] = await Promise.all([
      commentsService.getByRoom(roomId).catch(() => []),
      locationsService.getById(room.maViTri).catch(() => null),
    ]);

    return {
      ok: true,
      room,
      comments,
      location,
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

type AmenityItem = {
  key: string;
  label: string;
  icon: LucideIcon;
};

type HighlightItem = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

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

  const { room, comments, location } = data;
  const visibleComments = comments.filter((comment) =>
    isRenderableCommentContent(comment.noiDung),
  );
  const authSession = await getAuthSession();
  const resolvedUser = authSession ? await resolveSessionUser(authSession) : null;
  const userBookings =
    authSession?.token && resolvedUser?.id
      ? await bookingsService.getByUser(resolvedUser.id, authSession.token).catch(() => [])
      : [];
  const canComment =
    authSession?.roleKey === "customer" &&
    userBookings.some((booking) => booking.maPhong === room.id);
  const isAuthenticated = Boolean(authSession?.token && resolvedUser?.id);
  const roomImageSrc = getRoomImageSrc(room.hinhAnh);
  const amenityList: AmenityItem[] = [
    room.mayGiat ? { key: "mayGiat", label: "Máy giặt", icon: Shirt } : null,
    room.banLa ? { key: "banLa", label: "Bàn là", icon: Shirt } : null,
    room.tivi ? { key: "tivi", label: "Tivi", icon: Monitor } : null,
    room.dieuHoa ? { key: "dieuHoa", label: "Điều hòa", icon: Wind } : null,
    room.wifi ? { key: "wifi", label: "Wifi", icon: Wifi } : null,
    room.bep ? { key: "bep", label: "Bếp", icon: CookingPot } : null,
    room.doXe ? { key: "doXe", label: "Đỗ xe", icon: CarFront } : null,
    room.hoBoi ? { key: "hoBoi", label: "Hồ bơi", icon: Waves } : null,
    room.banUi ? { key: "banUi", label: "Bàn ủi", icon: Shirt } : null,
  ].filter((item): item is AmenityItem => Boolean(item));
  const averageRating =
    visibleComments.length > 0
      ? visibleComments.reduce((total, item) => total + item.saoBinhLuan, 0) /
        visibleComments.length
      : 5;
  const ratingText = new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(averageRating);
  const locationText = location
    ? `${location.tenViTri}, ${location.tinhThanh}, ${location.quocGia}`
    : `Khu vực #${room.maViTri}`;
  const reviewCountText = `${visibleComments.length} đánh giá`;
  const highlightList: HighlightItem[] = [
    {
      key: "private-space",
      title: "Toàn bộ nơi ở riêng",
      description: `Bạn có toàn bộ không gian với sức chứa tối đa ${room.khach} khách.`,
      icon: House,
    },
    {
      key: "cleaning",
      title: "Không gian gọn gàng, đủ tiện nghi",
      description: `Có ${amenityList.length} tiện nghi nổi bật để bạn sử dụng ngay khi nhận phòng.`,
      icon: Sparkles,
    },
    {
      key: "rating",
      title: "Được khách trước đây đánh giá",
      description: `${ratingText}/5 sao từ ${reviewCountText.toLowerCase()}.`,
      icon: BadgeCheck,
    },
    {
      key: "stay",
      title: "Linh hoạt cho chuyến đi ngắn ngày",
      description: "Bạn có thể chủ động chọn ngày nhận, ngày trả và số lượng khách ngay trên thẻ đặt phòng.",
      icon: Clock3,
    },
  ];
  const hostBadgeText = location?.tenViTri?.slice(0, 1).toUpperCase() || room.tenPhong.slice(0, 1).toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ
          </Link>

          <h1 className="mt-3 text-3xl font-extrabold text-slate-950 sm:text-4xl">
            {room.tenPhong}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
              <Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
              {ratingText}
            </span>
            <span>({visibleComments.length} đánh giá)</span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {locationText}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2">
            <Share2 className="h-4 w-4" />
            Chia sẻ
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2">
            <Heart className="h-4 w-4" />
            Lưu
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-line bg-card shadow-sm">
        <div className="relative aspect-[16/10] md:aspect-[16/8]">
          <Image
            src={roomImageSrc}
            alt={room.tenPhong}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-8">
          <article className="rounded-[28px] border border-line bg-white p-6 text-slate-950 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-line pb-6">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Toàn bộ căn hộ. {room.tenPhong}
                </h2>
                <p className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {room.khach} khách
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BedDouble className="h-4 w-4" />
                    {room.phongNgu} phòng ngủ
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BedDouble className="h-4 w-4" />
                    {room.giuong} giường
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Bath className="h-4 w-4" />
                    {room.phongTam} phòng tắm
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-full border border-line bg-slate-50 px-4 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f2f8e] font-bold text-white">
                  {hostBadgeText}
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Mã phòng</p>
                  <p className="text-sm font-semibold text-slate-950">#{room.id}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="space-y-4">
                {highlightList.map((item) => (
                  <div
                    key={item.key}
                    className="flex gap-4 border-b border-line pb-4 last:border-b-0 last:pb-0"
                  >
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f2f8e] text-white">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-7 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-line bg-slate-50 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-950">Khu vực lưu trú</p>
                  <span className="inline-flex items-center gap-2 text-sm text-[#0f2f8e]">
                    <MapPin className="h-4 w-4 text-[#0f2f8e]" />
                    {location?.tinhThanh || "Đang cập nhật"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{locationText}</p>
              </div>

              <div className="space-y-3 border-t border-line pt-5">
                <p className="text-base font-semibold text-slate-950">Mô tả nơi ở</p>
                <p className="text-sm leading-8 text-slate-600">{room.moTa}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-line bg-white p-6 text-slate-950 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Các tiện ích đi kèm</h2>
            {amenityList.length > 0 ? (
              <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                {amenityList.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50 px-4 py-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f2f8e] text-white">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium text-slate-900">{item.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600">Chưa có tiện nghi nào.</p>
            )}
          </article>

          <article className="min-w-0 rounded-[28px] border border-line bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Bình luận
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Đánh giá từ khách đã ở</h2>
              </div>
              <span className="rounded-full bg-[#0f2f8e] px-4 py-2 text-sm font-semibold text-white">
                {visibleComments.length} bình luận
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <CommentForm
                roomId={room.id}
                isAuthenticated={isAuthenticated}
                canComment={canComment}
              />
              <RoomComments comments={visibleComments} />
            </div>
          </article>
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <BookingCard
            roomId={room.id}
            roomName={room.tenPhong}
            pricePerNight={room.giaTien}
            ratingText={ratingText}
            reviewCountText={reviewCountText}
            maxGuests={room.khach}
          />
        </aside>
      </section>
    </main>
  );
}
