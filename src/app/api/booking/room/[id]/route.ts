import { ApiError } from "@/lib/api-error";
import { bookingsService } from "@/services/bookings.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const roomId = Number(id);

  if (!Number.isInteger(roomId) || roomId <= 0) {
    return Response.json({ message: "Mã phòng không hợp lệ." }, { status: 400 });
  }

  try {
    const bookings = await bookingsService.getAll();
    const roomBookings = bookings.filter((booking) => booking.maPhong === roomId);

    return Response.json(roomBookings);
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    return Response.json(
      { message: "Không thể tải lịch đặt phòng." },
      { status: 500 },
    );
  }
}
