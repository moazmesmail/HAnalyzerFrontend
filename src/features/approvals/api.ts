import { apiRequest } from "../../shared/api/client";
import type { PaginatedResponse, Registration } from "../../shared/api/generated";

export function listPendingRegistrations() {
  return apiRequest<PaginatedResponse<Registration>>("/admin/registrations?status=pending");
}

export function decideRegistration(userId: string, decision: "approved" | "rejected", csrfToken: string | null) {
  return apiRequest<Registration>(`/admin/registrations/${userId}/decision`, {
    method: "POST",
    csrfToken,
    body: JSON.stringify({ decision })
  });
}
