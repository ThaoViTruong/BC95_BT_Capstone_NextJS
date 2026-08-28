import { ApiError } from "@/lib/api-error";
import { getAdminSession } from "@/lib/admin-session";
import { bookingsService } from "@/services/bookings.service";
import { commentsService } from "@/services/comments.service";
import { locationsService } from "@/services/locations.service";
import { roomsService } from "@/services/rooms.service";
import { usersService } from "@/services/users.service";

export async function GET() {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    return Response.json(
      { message: "Bạn không có quyền truy cập dữ liệu quản trị." },
      { status: 401 },
    );
  }

  try {
    const [users, rooms, locations, bookings, comments] = await Promise.all([
      usersService.getAll(adminSession.token),
      roomsService.getAll(),
      locationsService.getAll(),
      bookingsService.getAll(adminSession.token),
      commentsService.getAll(),
    ]);

    return Response.json({
      users: users.length,
      rooms: rooms.length,
      locations: locations.length,
      bookings: bookings.length,
      comments: comments.length,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    return Response.json(
      { message: "Không thể tải dữ liệu dashboard." },
      { status: 500 },
    );
  }
}
