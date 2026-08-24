import { ApiError } from "@/lib/api-error";
import { locationsService } from "@/services/locations.service";
import { roomsService } from "@/services/rooms.service";

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
    const room = await roomsService.getById(roomId);
    const location = await locationsService.getById(room.maViTri).catch(() => null);
    const locationText = location
      ? `${location.tenViTri}, ${location.tinhThanh}`
      : "Địa điểm đang cập nhật";

    return Response.json({
      room,
      locationText,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ message: error.message }, { status: error.status });
    }

    return Response.json(
      { message: "Không thể tải thông tin phòng." },
      { status: 500 },
    );
  }
}

