import { Box, CircularProgress, Typography } from "@mui/material";
import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../features/auth/session";

function LoadingScreen() {
  return (
    <Box sx={{ display: "grid", minHeight: "60vh", placeItems: "center" }}>
      <CircularProgress aria-label="Loading session" />
    </Box>
  );
}

export function ApprovedRoute({ children }: PropsWithChildren) {
  const session = useSession();
  const location = useLocation();

  if (session.status === "loading") {
    return <LoadingScreen />;
  }

  if (!session.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function AdminRoute({ children }: PropsWithChildren) {
  const session = useSession();

  if (session.status === "loading") {
    return <LoadingScreen />;
  }

  if (session.user?.role !== "admin") {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Not available
        </Typography>
        <Typography color="text.secondary">This area is only available to administrators.</Typography>
      </Box>
    );
  }

  return children;
}

export function PublicOnlyRoute({ children }: PropsWithChildren) {
  const session = useSession();

  if (session.status === "loading") {
    return <LoadingScreen />;
  }

  if (session.user) {
    return <Navigate to="/app/videos" replace />;
  }

  return children;
}
