import { apiRequest, mediaUrl } from "../../shared/api/client";
import type { AnalysisProfile, AnalysisReport, AnalysisResults, AnalysisSession, ModelUsage, StructuredAnalysis } from "../../shared/api/generated";

export function listAnalysisProfiles() {
  return apiRequest<AnalysisProfile[]>("/analysis-profiles");
}

export function listVideoAnalyses(videoId: string) {
  return apiRequest<AnalysisSession[]>(`/videos/${videoId}/analyses`);
}

export function startAnalysis(videoId: string, csrfToken: string | null, profileId: string, samplingFps: number) {
  return apiRequest<AnalysisSession>(`/videos/${videoId}/analyses`, {
    method: "POST",
    csrfToken,
    body: JSON.stringify({ profile_id: profileId, sampling_fps: samplingFps })
  });
}

export function getAnalysis(sessionId: string) {
  return apiRequest<AnalysisSession>(`/analyses/${sessionId}`);
}

export function getAnalysisResults(sessionId: string) {
  return apiRequest<AnalysisResults>(`/analyses/${sessionId}/results`);
}

export function getAnalysisUsage(sessionId: string) {
  return apiRequest<ModelUsage>(`/analyses/${sessionId}/usage`);
}

export function getAnalysisReport(sessionId: string) {
  return apiRequest<AnalysisReport>(`/analyses/${sessionId}/report`);
}

export function getStructuredAnalysis(sessionId: string) {
  return apiRequest<StructuredAnalysis>(`/analyses/${sessionId}/structured`);
}

export function retryAnalysis(sessionId: string, csrfToken: string | null) {
  return apiRequest<AnalysisSession>(`/analyses/${sessionId}/retry`, {
    method: "POST",
    csrfToken
  });
}

export function evidenceUrl(assetId: string) {
  return mediaUrl(assetId);
}
