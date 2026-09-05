import LogoutIcon from "@mui/icons-material/Logout";
import UploadIcon from "@mui/icons-material/Upload";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "../../features/auth/session";

export function WorkspaceLayout() {
  const session = useSession();

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Competition Analysis
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button component={NavLink} to="/app/videos" startIcon={<VideoLibraryIcon />}>
              Videos
            </Button>
            <Button component={NavLink} to="/app/videos/new" startIcon={<UploadIcon />}>
              Upload
            </Button>
            {session.user?.role === "admin" && (
              <Button component={NavLink} to="/app/admin/registrations">
                Approvals
              </Button>
            )}
            <Button onClick={() => void session.logout()} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
