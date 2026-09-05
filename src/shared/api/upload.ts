import { ApiError } from "./errors";

const API_BASE = import.meta.env.VITE_API_BASE_PATH || "/api/v1";

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export function uploadFile<T>(
  path: string,
  formData: FormData,
  csrfToken: string | null,
  onProgress: (progress: UploadProgress) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE}${path}`);
    request.withCredentials = true;

    if (csrfToken) {
      request.setRequestHeader("X-CSRF-Token", csrfToken);
    }

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress({
        loaded: event.loaded,
        total: event.total,
        percent: Math.round((event.loaded / event.total) * 100)
      });
    };

    request.onload = () => {
      const body = request.responseText ? JSON.parse(request.responseText) : null;

      if (request.status >= 200 && request.status < 300) {
        resolve(body as T);
        return;
      }

      reject(new ApiError(request.status, body));
    };

    request.onerror = () => reject(new Error("Upload failed."));
    request.send(formData);
  });
}
