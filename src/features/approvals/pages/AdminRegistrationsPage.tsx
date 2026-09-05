import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getErrorMessage } from "../../../shared/api/errors";
import type { Registration } from "../../../shared/api/generated";
import { useSession } from "../../auth/session";
import { decideRegistration, listPendingRegistrations } from "../api";
import { approvalKeys } from "../queries";

type PendingDecision = {
  registration: Registration;
  decision: "approved" | "rejected";
};

export function AdminRegistrationsPage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

  const registrations = useQuery({
    queryKey: approvalKeys.pending(),
    queryFn: listPendingRegistrations
  });

  const decision = useMutation({
    mutationFn: (input: PendingDecision) =>
      decideRegistration(input.registration.id, input.decision, session.csrfToken),
    onSuccess: async () => {
      setPendingDecision(null);
      await queryClient.invalidateQueries({ queryKey: approvalKeys.pending() });
    }
  });

  const items = registrations.data?.items ?? [];

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        Registration approvals
      </Typography>

      {registrations.isLoading && <CircularProgress aria-label="Loading registrations" />}
      {registrations.isError && <Alert severity="error">{getErrorMessage(registrations.error)}</Alert>}
      {decision.isError && <Alert severity="error">{getErrorMessage(decision.error)}</Alert>}

      {!registrations.isLoading && items.length === 0 && (
        <Alert severity="info">There are no pending registrations.</Alert>
      )}

      {items.length > 0 && (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Identity</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell>{registration.identity}</TableCell>
                  <TableCell>{new Date(registration.created_at).toLocaleString()}</TableCell>
                  <TableCell>{registration.status}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Approve">
                      <IconButton
                        aria-label={`Approve ${registration.identity}`}
                        onClick={() => setPendingDecision({ registration, decision: "approved" })}
                      >
                        <CheckIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton
                        aria-label={`Reject ${registration.identity}`}
                        onClick={() => setPendingDecision({ registration, decision: "rejected" })}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={Boolean(pendingDecision)} onClose={() => setPendingDecision(null)}>
        <DialogTitle>Confirm decision</DialogTitle>
        <DialogContent>
          <Typography>
            {pendingDecision?.decision === "approved" ? "Approve" : "Reject"}{" "}
            {pendingDecision?.registration.identity}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDecision(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={decision.isPending || !pendingDecision}
            onClick={() => pendingDecision && decision.mutate(pendingDecision)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
