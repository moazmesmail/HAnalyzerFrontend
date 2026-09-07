import { apiRequest, mediaUrl } from "../../shared/api/client";
import { uploadFile, type UploadProgress } from "../../shared/api/upload";
import type { PaginatedResponse, Video } from "../../shared/api/generated";

export function listVideos() {
  return apiRequest<PaginatedResponse<Video>>("/videos");
}

export function listArchivedVideos() {
  return apiRequest<PaginatedResponse<Video>>("/videos/archive");
}

export function archiveVideo(videoId: string, csrfToken: string | null) {
  return apiRequest<Video>(`/videos/${videoId}/archive`, { method: "POST", csrfToken });
}

export function restoreVideo(videoId: string, csrfToken: string | null) {
  return apiRequest<Video>(`/videos/${videoId}/restore`, { method: "POST", csrfToken });
}

export function getVideo(videoId: string) {
  return apiRequest<Video>(`/videos/${videoId}`);
}

export function retryVideoPreparation(videoId: string, csrfToken: string | null) {
  return apiRequest<Video>(`/videos/${videoId}/retry-preparation`, {
    method: "POST",
    csrfToken
  });
}

export function uploadVideo(file: File, csrfToken: string | null, onProgress: (progress: UploadProgress) => void) {
  const form = new FormData();
  form.append("file", file);
  return uploadFile<Video>("/videos", form, csrfToken, onProgress);
}

export function previewUrl(video: Video) {
  return video.preview_asset_id ? mediaUrl(video.preview_asset_id) : null;
}

export function originalUrl(video: Video) {
  return video.original_asset_id ? mediaUrl(video.original_asset_id) : null;
}
