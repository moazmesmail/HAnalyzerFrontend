import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export function PendingApprovalPage() {
  return (
    <Stack className="hp-auth-form hp-auth-pending" spacing={2}>
      <div className="hp-auth-success">✓</div>
      <Typography variant="h5">Waiting for approval</Typography>
      <Typography color="text.secondary">
        Your registration was received. The owner must approve your account before you can log in.
      </Typography>
      <Button component={RouterLink} to="/login" variant="contained">
        Back to login
      </Button>
    </Stack>
  );
}
