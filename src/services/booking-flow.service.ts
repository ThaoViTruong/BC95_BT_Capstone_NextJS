import { ApiError } from "@/lib/api-error";
import type { Booking } from "@/types/booking";

type CreateBookingPayload = {
  maPhong: number;
  ngayDen: string;
  ngayDi: string;
  soLuongKhach: number;
};

async function parseResponseData(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export const bookingFlowService = {
  async create(payload: CreateBookingPayload) {
    const response = await fetch("/api/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await parseResponseData(response);

    if (!response.ok) {
      const message =
        data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : "Không thể đặt phòng lúc này.";

      throw new ApiError(message, response.status);
    }

    return data as Booking;
  },
};
