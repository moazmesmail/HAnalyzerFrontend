import { apiRequest } from "../../shared/api/client";
import type { AuthResponse } from "../../shared/api/generated";

export type Credentials = {
  identity: string;
  password: string;
};

export function registerUser(credentials: Credentials) {
  return apiRequest<{ status: "pending" }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export function loginUser(credentials: Credentials) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export function getCurrentUser() {
  return apiRequest<AuthResponse>("/auth/me");
}

export function logoutUser(csrfToken: string | null) {
  return apiRequest<null>("/auth/logout", {
    method: "POST",
    csrfToken
  });
}
