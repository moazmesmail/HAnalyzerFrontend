import { Box, Container, Paper, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <Box sx={{ minHeight: "100vh", py: 8 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Competition Analysis
          </Typography>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}
