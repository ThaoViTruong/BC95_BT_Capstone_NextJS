import { apiRequest } from "@/lib/api-client";
import type { PagingQuery, PagingResult } from "@/types/api";
import type { Room, RoomPayload } from "@/types/room";

export const roomsService = {
  getAll() {
    return apiRequest<Room[]>("/api/phong-thue");
  },

  getById(id: number) {
    return apiRequest<Room>(`/api/phong-thue/${id}`);
  },

  getByLocation(maViTri: number) {
    return apiRequest<Room[]>("/api/phong-thue/lay-phong-theo-vi-tri", {
      searchParams: { maViTri },
    });
  },

  getPaging(query: PagingQuery) {
    return apiRequest<PagingResult<Room>>("/api/phong-thue/phan-trang-tim-kiem", {
      searchParams: query,
    });
  },

  create(payload: RoomPayload, token?: string) {
    return apiRequest<Room>("/api/phong-thue", {
      method: "POST",
      body: payload,
      token,
    });
  },

  update(id: number, payload: RoomPayload, token?: string) {
    return apiRequest<Room>(`/api/phong-thue/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },

  remove(id: number, token?: string) {
    return apiRequest<boolean>(`/api/phong-thue/${id}`, {
      method: "DELETE",
      token,
    });
  },

  uploadImage(maPhong: number, file: File | Blob, token?: string) {
    const formData = new FormData();
    formData.set("formFile", file);

    return apiRequest<string>("/api/phong-thue/upload-hinh-phong", {
      method: "POST",
      body: formData,
      token,
      searchParams: { maPhong },
    });
  },
};
