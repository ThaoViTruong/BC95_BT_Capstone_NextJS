import { apiRequest } from "@/lib/api-client";
import type { Comment, CommentPayload } from "@/types/comment";

export const commentsService = {
  getAll() {
    return apiRequest<Comment[]>("/api/binh-luan");
  },

  getByRoom(roomId: number) {
    return apiRequest<Comment[]>(`/api/binh-luan/lay-binh-luan-theo-phong/${roomId}`);
  },

  create(payload: CommentPayload, token?: string) {
    return apiRequest<Comment>("/api/binh-luan", {
      method: "POST",
      body: payload,
      token,
    });
  },

  update(id: number, payload: CommentPayload, token?: string) {
    return apiRequest<Comment>(`/api/binh-luan/${id}`, {
      method: "PUT",
      body: payload,
      token,
    });
  },

  remove(id: number, token?: string) {
    return apiRequest<boolean>(`/api/binh-luan/${id}`, {
      method: "DELETE",
      token,
    });
  },
};
