import { getApiEnv, getMissingApiEnv } from "@/config/env";
import { ApiError } from "@/lib/api-error";
import { getAccessToken } from "@/lib/auth-storage";
import type { ApiEnvelope, SearchParamsValue } from "@/types/api";

type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";

type ApiRequestOptions = {
  method?: ApiMethod;
  body?: BodyInit | FormData | Record<string, unknown>;
  token?: string;
  searchParams?: Record<string, SearchParamsValue>;
  cache?: RequestCache;
};

function createUrl(path: string, searchParams?: Record<string, SearchParamsValue>) {
  const { apiUrl } = getApiEnv();
  const baseUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;
  const safePath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(safePath, baseUrl);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url;
}

function unwrapData<T>(data: unknown) {
  if (data && typeof data === "object" && "content" in data) {
    return (data as ApiEnvelope<T>).content;
  }

  return data as T;
}

function getErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const { cybersoftToken, isReady } = getApiEnv();

  if (!isReady) {
    throw new ApiError(
      `Thiếu biến môi trường API: ${getMissingApiEnv().join(", ")}`,
      500,
    );
  }

  const headers = new Headers();
  headers.set("tokenCybersoft", cybersoftToken);

  const token = options.token ?? getAccessToken();

  if (token) {
    headers.set("token", token);
  }

  const rawBody = options.body;
  let body: BodyInit | undefined;

  if (rawBody !== undefined) {
    if (rawBody instanceof FormData) {
      body = rawBody;
    } else if (typeof rawBody === "string" || rawBody instanceof Blob) {
      body = rawBody;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(rawBody);
    }
  }

  const response = await fetch(createUrl(path, options.searchParams), {
    method: options.method ?? "GET",
    headers,
    body,
    cache: options.cache ?? "no-store",
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, "Không thể kết nối tới máy chủ."),
      response.status,
    );
  }

  return unwrapData<T>(data);
}
