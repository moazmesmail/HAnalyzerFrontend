import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { PendingApprovalPage } from "../features/auth/pages/PendingApprovalPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { AdminRegistrationsPage } from "../features/approvals/pages/AdminRegistrationsPage";
import { VideoDetailPage } from "../features/videos/pages/VideoDetailPage";
import { VideoUploadPage } from "../features/videos/pages/VideoUploadPage";
import { VideosPage } from "../features/videos/pages/VideosPage";
import { PublicLayout } from "./layouts/PublicLayout";
import { WorkspaceLayout } from "./layouts/WorkspaceLayout";
import { AdminRoute, ApprovedRoute, PublicOnlyRoute } from "./router";

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/registration-pending" element={<PendingApprovalPage />} />
      </Route>

      <Route
        path="/app"
        element={
          <ApprovedRoute>
            <WorkspaceLayout />
          </ApprovedRoute>
        }
      >
        <Route index element={<Navigate to="/app/videos" replace />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="videos/new" element={<VideoUploadPage />} />
        <Route path="videos/:videoId" element={<VideoDetailPage />} />
        <Route
          path="admin/registrations"
          element={
            <AdminRoute>
              <AdminRegistrationsPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
