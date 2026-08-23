import { ApiError } from "@/lib/api-error";
import { getAuthSession } from "@/lib/auth-session";
import { resolveSessionUser } from "@/lib/auth-session-user";
import { bookingsService } from "@/services/bookings.service";
import type { BookingPayload } from "@/types/booking";

type BookingRequestPayload = {
  maPhong?: number;
  ngayDen?: string;
  ngayDi?: string;
  soLuongKhach?: number;
};

function createUnauthorizedResponse() {
  return Response.json(
    { message: "Vui lòng đăng nhập để đặt phòng." },
    { status: 401 },
  );
}

function isValidDateString(value?: string) {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

export async function POST(request: Request) {
  const authSession = await getAuthSession();
  const resolvedUser = authSession ? await resolveSessionUser(authSession) : null;

  if (!authSession?.token || !resolvedUser?.id) {
    return createUnauthorizedResponse();
  }

  try {
    const payload = (await request.json()) as BookingRequestPayload;
    const checkIn = payload.ngayDen;
    const checkOut = payload.ngayDi;

    if (!payload.maPhong || payload.maPhong <= 0) {
      return Response.json(
        { message: "Không tìm thấy phòng cần đặt." },
        { status: 400 },
      );
    }

    if (
      typeof checkIn !== "string" ||
      typeof checkOut !== "string" ||
      !isValidDateString(checkIn) ||
      !isValidDateString(checkOut)
    ) {
      return Response.json(
        { message: "Ngày nhận phòng hoặc trả phòng chưa hợp lệ." },
        { status: 400 },
      );
    }

    const normalizedCheckIn = checkIn;
    const normalizedCheckOut = checkOut;

    if (normalizedCheckOut <= normalizedCheckIn) {
      return Response.json(
        { message: "Ngày trả phòng phải sau ngày nhận phòng." },
        { status: 400 },
      );
    }

    if (!payload.soLuongKhach || payload.soLuongKhach <= 0) {
      return Response.json(
        { message: "Số lượng khách chưa hợp lệ." },
        { status: 400 },
      );
    }

    const bookingPayload: BookingPayload = {
      maPhong: payload.maPhong,
      ngayDen: normalizedCheckIn,
      ngayDi: normalizedCheckOut,
      soLuongKhach: payload.soLuongKhach,
      maNguoiDung: resolvedUser.id,
    };

    const booking = await bookingsService.create(bookingPayload, authSession.token);

    return Response.json(booking);
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    return Response.json(
      { message: "Không thể tạo đơn đặt phòng." },
      { status: 500 },
    );
  }
}
