import { ApiError } from "@/lib/api-error";
import {
  hasMinimumOneNightStay,
  normalizeBookingDate,
  toBookingDateTime,
} from "@/lib/booking-date";
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
  return normalizeBookingDate(value) !== null;
}

function isOverlappingRange(
  checkIn: string,
  checkOut: string,
  existingCheckIn?: string,
  existingCheckOut?: string,
) {
  if (!existingCheckIn || !existingCheckOut) {
    return false;
  }

  const startA = toBookingDateTime(checkIn);
  const endA = toBookingDateTime(checkOut);
  const startB = toBookingDateTime(existingCheckIn);
  const endB = toBookingDateTime(existingCheckOut);

  if (startA === null || endA === null || startB === null || endB === null) {
    return false;
  }

  // Rule mới: ngày trả phòng cũng bị chặn cho booking khác (inclusive).
  // Hai khoảng bị trùng khi:
  // startA <= endB && endA >= startB
  return startA <= endB && endA >= startB;
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

    const normalizedCheckIn = normalizeBookingDate(checkIn);
    const normalizedCheckOut = normalizeBookingDate(checkOut);

    if (!normalizedCheckIn || !normalizedCheckOut) {
      return Response.json(
        { message: "Ngày nhận phòng hoặc trả phòng chưa hợp lệ." },
        { status: 400 },
      );
    }

    if (!hasMinimumOneNightStay(normalizedCheckIn, normalizedCheckOut)) {
      return Response.json(
        { message: "Thời gian lưu trú phải tối thiểu 1 đêm." },
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

    // Validate không cho đặt trùng lịch cùng một phòng (kể cả khác tài khoản).
    // Rule mới chặn cả ngày check-out, nên khoảng ngày được xét là inclusive [checkIn, checkOut].
    const allBookings = await bookingsService.getAll(authSession.token);
    const hasOverlappingBooking = allBookings
      .filter((booking) => booking.maPhong === payload.maPhong)
      .some((booking) =>
        isOverlappingRange(
          normalizedCheckIn,
          normalizedCheckOut,
          normalizeBookingDate(booking.ngayDen) ?? undefined,
          normalizeBookingDate(booking.ngayDi) ?? undefined,
        ),
      );

    if (hasOverlappingBooking) {
      return Response.json(
        {
          message:
            "Phòng đã được đặt trong khoảng thời gian này. Vui lòng chọn ngày khác để đặt phòng.",
        },
        { status: 409 },
      );
    }

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
