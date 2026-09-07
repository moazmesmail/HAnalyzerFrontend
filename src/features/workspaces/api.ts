import { apiRequest, mediaUrl } from "../../shared/api/client";
import type { Workspace, WorkspaceDetail } from "../../shared/api/generated";

export function listWorkspaces() {
  return apiRequest<Workspace[]>("/workspaces");
}

export function createWorkspace(name: string, csrfToken: string | null) {
  return apiRequest<Workspace>("/workspaces", { method: "POST", csrfToken, body: JSON.stringify({ name }) });
}

export function getWorkspace(workspaceId: string) {
  return apiRequest<WorkspaceDetail>(`/workspaces/${workspaceId}`);
}

export function attachVideo(workspaceId: string, videoId: string, csrfToken: string | null) {
  return apiRequest<void>(`/workspaces/${workspaceId}/videos/${videoId}`, { method: "POST", csrfToken });
}

export function detachVideo(workspaceId: string, videoId: string, csrfToken: string | null) {
  return apiRequest<void>(`/workspaces/${workspaceId}/videos/${videoId}`, { method: "DELETE", csrfToken });
}

export function workspaceVideoUrl(assetId: string | null | undefined) {
  return assetId ? mediaUrl(assetId) : null;
}

