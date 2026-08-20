import { apiRequest } from "@/lib/api-client";
import type { PagingQuery, PagingResult } from "@/types/api";
import type { Location, LocationPayload } from "@/types/location";

export const locationsService = {
  getAll() {
    return apiRequest<Location[]>("/api/vi-tri");
  },

  getById(id: number) {
    return apiRequest<Location>(`/api/vi-tri/${id}`);
  },

  getPaging(query: PagingQuery) {
    return apiRequest<PagingResult<Location>>("/api/vi-tri/phan-trang-tim-kiem", {
      searchParams: query,
    });
  },

  create(payload: LocationPayload, token?: string) {
    return apiRequest<Location>("/api/vi-tri", {
      method: "POST",
      body: payload,
      token,
    });
  },

  update(id: number, payload: LocationPayload, token?: string) {
    return apiRequest<Location>(`/api/vi-tri/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },

  remove(id: number, token?: string) {
    return apiRequest<boolean>(`/api/vi-tri/${id}`, {
      method: "DELETE",
      token,
    });
  },

  uploadImage(maViTri: number, file: File | Blob, token?: string) {
    const formData = new FormData();
    formData.set("formFile", file);

    return apiRequest<string>("/api/vi-tri/upload-hinh-vitri", {
      method: "POST",
      body: formData,
      token,
      searchParams: { maViTri },
    });
  },
};
