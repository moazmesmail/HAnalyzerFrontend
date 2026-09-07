export type UserRole = "user" | "coach" | "admin";

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
  archived_at?: string | null;
};

export type Workspace = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  video_count: number;
};

export type WorkspaceVideo = Video & {
  analysis?: {
    session_id: string;
    status: string;
    summary_video?: {
      id: string;
      status: string;
      asset_id?: string | null;
      duration_seconds?: number | null;
      error?: string | null;
    } | null;
  } | null;
};

export type WorkspaceDetail = Workspace & {
  videos: WorkspaceVideo[];
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
  report_status: string;
  report_version: string;
  content: DeepReportContent;
  limitations: string[];
};

export type AnalysisBatchJob = {
  id: string;
  batch_number: number;
  start_seconds: number;
  end_seconds: number;
  source_frame_count: number;
  status: string;
  attempt_count: number;
  error_code?: string | null;
  error_message?: string | null;
};

export type AnalysisArtifact = {
  id: string;
  batch_job_id?: string | null;
  category: string;
  subtype: string;
  title: string;
  start_seconds: number;
  end_seconds: number;
  observation: string;
  interpretation?: string | null;
  attributes: Record<string, unknown>;
  confidence: number;
  importance: number;
  evidence_frame_ids: string[];
  limitations: string[];
};

export type AnalysisCoverage = {
  percent?: number;
  successful_batches?: number;
  total_batches?: number;
  covered_ranges?: Array<{ start_seconds: number; end_seconds: number }>;
  missing_ranges?: Array<{ start_seconds: number; end_seconds: number }>;
};

export type StructuredAnalysis = {
  batch_jobs: AnalysisBatchJob[];
  artifacts: AnalysisArtifact[];
  coverage: AnalysisCoverage;
};

export type SummaryVideoSegment = {
  start_seconds: number;
  end_seconds: number;
  artifact_ids: string[];
  titles: string[];
};

export type SummaryVideo = {
  id: string;
  session_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  asset_id?: string | null;
  selected_segments: SummaryVideoSegment[];
  duration_seconds?: number | null;
  analysis_revision: number;
  error?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};

export type DeepReportContent = {
  executive_summary?: string;
  video_features?: Record<string, unknown>;
  competition_context?: Record<string, unknown>;
  key_moments?: Array<Record<string, unknown>>;
  run_summaries?: Array<Record<string, unknown>>;
  course_analysis?: Record<string, unknown>;
  technique_analysis?: Record<string, unknown>;
  synchronization_analysis?: Record<string, unknown>;
  scoreboard_results?: Array<Record<string, unknown>>;
  comparisons?: Array<Record<string, unknown>>;
  causal_hypotheses?: Array<Record<string, unknown>>;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  limitations?: string[];
  coverage?: AnalysisCoverage;
};
