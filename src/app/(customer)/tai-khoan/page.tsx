import { getAuthSession } from "@/lib/auth-session";
import { resolveSessionUser } from "@/lib/auth-session-user";
import { bookingsService } from "@/services/bookings.service";
import { commentsService } from "@/services/comments.service";
import { locationsService } from "@/services/locations.service";
import { roomsService } from "@/services/rooms.service";

import { AccountOverview } from "./_components/account-overview";
import { AuthFormPanel } from "./_components/auth-form-panel";

type ProfileRoomItem = {
  bookingId: number;
  roomId: number;
  roomName: string;
  roomImage: string;
  roomPrice: number;
  guestCount: number;
  checkIn: string;
  checkOut: string;
  locationText: string;
  ratingValue: number;
  ratingCount: number;
};

export const dynamic = "force-dynamic";

export default async function CustomerPage() {
  const authSession = await getAuthSession();

  if (authSession?.user) {
    const fallbackUser = authSession.user;
    const resolvedUser = authSession ? await resolveSessionUser(authSession) : null;
    const currentUser = resolvedUser ?? fallbackUser;
    const bookingUserId =
      typeof resolvedUser?.id === "number" && resolvedUser.id > 0
        ? resolvedUser.id
        : typeof fallbackUser.id === "number" && fallbackUser.id > 0
          ? fallbackUser.id
          : 0;
    const bookings = bookingUserId
      ? await bookingsService.getByUser(bookingUserId, authSession.token).catch(() => [])
      : [];
    const roomIds = [...new Set(bookings.map((item) => item.maPhong))];
    const roomMap = new Map<number, Awaited<ReturnType<typeof roomsService.getById>>>();
    const locationMap = new Map<number, Awaited<ReturnType<typeof locationsService.getById>> | null>();
    const commentMap = new Map<number, Awaited<ReturnType<typeof commentsService.getByRoom>>>();

    await Promise.all(
      roomIds.map(async (roomId) => {
        try {
          const room = await roomsService.getById(roomId);
          roomMap.set(roomId, room);

          const [location, comments] = await Promise.all([
            locationsService.getById(room.maViTri).catch(() => null),
            commentsService.getByRoom(roomId).catch(() => []),
          ]);

          locationMap.set(roomId, location);
          commentMap.set(roomId, comments);
        } catch {
          locationMap.set(roomId, null);
          commentMap.set(roomId, []);
        }
      }),
    );

    const rentedRooms: ProfileRoomItem[] = bookings
      .slice()
      .sort(
        (left, right) =>
          new Date(right.ngayDen).getTime() - new Date(left.ngayDen).getTime(),
      )
      .map((booking) => {
        const room = roomMap.get(booking.maPhong);
        const location = locationMap.get(booking.maPhong);
        const comments = commentMap.get(booking.maPhong) || [];
        const ratingValue =
          comments.length > 0
            ? comments.reduce((total, item) => total + item.saoBinhLuan, 0) / comments.length
            : 5;

        return {
          bookingId: booking.id,
          roomId: booking.maPhong,
          roomName: room?.tenPhong || `Phòng #${booking.maPhong}`,
          roomImage: room?.hinhAnh || "",
          roomPrice: room?.giaTien || 0,
          guestCount: booking.soLuongKhach,
          checkIn: booking.ngayDen,
          checkOut: booking.ngayDi,
          locationText: location
            ? `${location.tenViTri}, ${location.tinhThanh}`
            : "Địa điểm đang cập nhật",
          ratingValue,
          ratingCount: comments.length,
        };
      });

    return <AccountOverview initialUser={currentUser} rentedRooms={rentedRooms} />;
  }

  return <AuthFormPanel />;
}
