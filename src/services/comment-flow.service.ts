import { ApiError } from "@/lib/api-error";
import type { Comment } from "@/types/comment";

type CreateCommentPayload = {
  maPhong: number;
  noiDung: string;
  saoBinhLuan: number;
};

async function parseResponseData(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

export const commentFlowService = {
  async create(payload: CreateCommentPayload) {
    const response = await fetch("/api/comments", {
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
          : "Không thể gửi đánh giá lúc này.";

      throw new ApiError(message, response.status);
    }

    return data as Comment;
  },
};
