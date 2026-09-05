export type UserRole = "user" | "admin";

export type CurrentUser = {
  id: string;
  identity: string;
  role: UserRole;
  session_expires_at?: string;
};

export type AuthResponse = {
  user: CurrentUser;
  csrf_token: string;
};

export type Registration = {
  id: string;
  identity: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  next_cursor?: string | null;
};

export type Video = {
  id: string;
  original_filename: string;
  created_at: string;
  duration_seconds?: number | null;
  preparation_status: "uploaded" | "preparing" | "ready" | "failed";
  preparation_error?: string | null;
  preparation_retryable?: boolean;
  original_asset_id?: string | null;
  preview_asset_id?: string | null;
};

export type AnalysisProfile = {
  id: string;
  version: string;
  display_name: string;
  description: string;
  minimum_fps: number;
  maximum_fps: number;
  default_fps: number;
  capabilities: Record<string, boolean>;
};

export type AnalysisSession = {
  id: string;
  video_id: string;
  profile_id: string;
  profile_version: string;
  model: string;
  prompt_version: string;
  sampling_fps: number;
  status: "pending" | "running" | "completed" | "partial" | "failed";
  phase: string;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  terminal_progress_percent: number;
  analysis_revision: number;
  capabilities: Record<string, boolean>;
  summary: {
    overview?: string;
    frame_count?: number;
    successful_batches?: number;
    failed_batches?: number;
  };
  error?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};

export type AnalysisFrame = {
  id: string;
  asset_id: string;
  timestamp_seconds: number;
  width: number;
  height: number;
};

export type AnalysisObservation = {
  id: string;
  frame_id: string;
  type: string;
  start_seconds: number;
  end_seconds: number;
  observation: string;
  interpretation?: string | null;
  confidence: number;
  importance: number;
  evidence_frame_ids: string[];
  limitations: string[];
};

export type AnalysisResults = {
  frames: AnalysisFrame[];
  observations: AnalysisObservation[];
};

export type ModelUsage = {
  request_count: number;
  successful_requests: number;
  failed_requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost?: number | null;
  model: string;
};

export type AnalysisReport = {
  session_id: string;
  status: string;
  profile_id: string;
  model: string;
  summary: AnalysisSession["summary"];
  findings: AnalysisObservation[];
  limitations: string[];
};
