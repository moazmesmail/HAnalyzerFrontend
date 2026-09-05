export type UserRole = "user" | "admin";

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  session_expires_at?: string;
};

export type AuthResponse = {
  user: CurrentUser;
  csrf_token: string;
};

export type Registration = {
  id: string;
  email: string;
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
  preview_asset_id?: string | null;
};
