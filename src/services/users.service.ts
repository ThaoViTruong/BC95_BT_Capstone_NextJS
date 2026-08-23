import { apiRequest } from "@/lib/api-client";
import type { PagingQuery, PagingResult } from "@/types/api";
import type { CreateUserPayload, UpdateUserPayload, User } from "@/types/user";

export const usersService = {
  getAll(token?: string) {
    return apiRequest<User[]>("/api/users", {
      token,
    });
  },

  getById(id: number, token?: string) {
    return apiRequest<User>(`/api/users/${id}`, {
      token,
    });
  },

  getPaging(query: PagingQuery, token?: string) {
    return apiRequest<PagingResult<User>>("/api/users/phan-trang-tim-kiem", {
      searchParams: query,
      token,
    });
  },

  searchByName(name: string, token?: string) {
    return apiRequest<User[]>(`/api/users/search/${name}`, {
      token,
    });
  },

  create(payload: CreateUserPayload, token?: string) {
    return apiRequest<User>("/api/users", {
      method: "POST",
      body: payload,
      token,
    });
  },

  update(id: number, payload: UpdateUserPayload, token?: string) {
    return apiRequest<User>(`/api/users/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },

  remove(id: number, token?: string) {
    return apiRequest<boolean>("/api/users", {
      method: "DELETE",
      searchParams: { id },
      token,
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
