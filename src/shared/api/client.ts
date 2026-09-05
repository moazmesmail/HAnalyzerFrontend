import { ApiError, type ApiErrorBody } from "./errors";

const API_BASE = import.meta.env.VITE_API_BASE_PATH || "/api/v1";

type RequestOptions = RequestInit & {
  csrfToken?: string | null;
};

async function parseBody(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.csrfToken) {
    headers.set("X-CSRF-Token", options.csrfToken);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers
  });
  const body = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, body as ApiErrorBody | null);
  }

  return body as T;
}

export function mediaUrl(assetId: string) {
  return `${API_BASE}/media/${assetId}`;
}
