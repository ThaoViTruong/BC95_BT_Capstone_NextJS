import { ApiError } from "@/lib/api-error";
import type { User, UpdateUserPayload } from "@/types/user";

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

async function profileRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(path, options);
  const data = await parseResponseData(response);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : "Không thể xử lý yêu cầu hồ sơ.";

    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const profileService = {
  getMe() {
    return profileRequest<User>("/api/profile");
  },

  updateProfile(payload: UpdateUserPayload) {
    return profileRequest<User>("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  updatePassword(password: string) {
    return profileRequest<User>("/api/profile/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });
  },

  uploadAvatar(file: File | Blob) {
    const formData = new FormData();
    formData.set("formFile", file);

    return profileRequest<User>("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });
  },
};
