import { ApiError } from "@/lib/api-error";
import { getAdminSession } from "@/lib/admin-session";
import { bookingsService } from "@/services/bookings.service";
import { locationsService } from "@/services/locations.service";
import { roomsService } from "@/services/rooms.service";

export async function GET() {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    return Response.json(
      { message: "Bạn không có quyền truy cập dữ liệu quản trị." },
      { status: 401 },
    );
  }

  try {
    const [bookings, rooms, locations] = await Promise.all([
      bookingsService.getAll(adminSession.token),
      roomsService.getAll(),
      locationsService.getAll(),
    ]);

    return Response.json({
      bookings,
      rooms,
      locations,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    return Response.json(
      { message: "Không thể tải dữ liệu báo cáo." },
      { status: 500 },
    );
  }
}
