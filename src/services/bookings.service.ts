import { apiRequest } from "@/lib/api-client";
import type { Booking, BookingPayload } from "@/types/booking";

export const bookingsService = {
  getAll(token?: string) {
    return apiRequest<Booking[]>("/api/dat-phong", {
      token,
    });
  },

  getById(id: number, token?: string) {
    return apiRequest<Booking>(`/api/dat-phong/${id}`, {
      token,
    });
  },

  getByUser(userId: number, token?: string) {
    return apiRequest<Booking[]>(`/api/dat-phong/lay-theo-nguoi-dung/${userId}`, {
      token,
    });
  },

  create(payload: BookingPayload, token?: string) {
    return apiRequest<Booking>("/api/dat-phong", {
      method: "POST",
      body: payload,
      token,
    });
  },

  update(id: number, payload: BookingPayload, token?: string) {
    return apiRequest<Booking>(`/api/dat-phong/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },

  remove(id: number, token?: string) {
    return apiRequest<boolean>(`/api/dat-phong/${id}`, {
      method: "DELETE",
      token,
    });
  },
};
