import { apiRequest } from "@/lib/api-client";
import type { PagingQuery, PagingResult } from "@/types/api";
import type { CreateUserPayload, UpdateUserPayload, User } from "@/types/user";

export const usersService = {
  getAll() {
    return apiRequest<User[]>("/api/users");
  },

  getById(id: number) {
    return apiRequest<User>(`/api/users/${id}`);
  },

  getPaging(query: PagingQuery) {
    return apiRequest<PagingResult<User>>("/api/users/phan-trang-tim-kiem", {
      searchParams: query,
    });
  },

  searchByName(name: string) {
    return apiRequest<User[]>(`/api/users/search/${name}`);
  },

  create(payload: CreateUserPayload) {
    return apiRequest<User>("/api/users", {
      method: "POST",
      body: payload,
    });
  },

  update(id: number, payload: UpdateUserPayload) {
    return apiRequest<User>(`/api/users/${id}`, {
      method: "PUT",
      body: payload,
    });
  },

  remove(id: number) {
    return apiRequest<boolean>("/api/users", {
      method: "DELETE",
      searchParams: { id },
    });
  },

  uploadAvatar(file: File | Blob, token?: string) {
    const formData = new FormData();
    formData.set("formFile", file);

    return apiRequest<string>("/api/users/upload-avatar", {
      method: "POST",
      body: formData,
      token,
    });
  },
};
