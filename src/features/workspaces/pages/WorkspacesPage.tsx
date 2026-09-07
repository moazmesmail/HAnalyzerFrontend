import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { useSession } from "../../auth/session";
import { createWorkspace, listWorkspaces } from "../api";
import { workspaceKeys } from "../queries";

export function WorkspacesPage() {
  const session = useSession();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const query = useQuery({ queryKey: workspaceKeys.list(session.user?.id), queryFn: listWorkspaces, enabled: Boolean(session.user) });
  const create = useMutation({
    mutationFn: () => createWorkspace(name, session.csrfToken),
    onSuccess: async () => { setOpen(false); setName(""); await client.invalidateQueries({ queryKey: workspaceKeys.list(session.user?.id) }); }
  });

  return <Stack spacing={3}>
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
      <Typography variant="h4" component="h1">Workspaces</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>New workspace</Button>
    </Stack>
    {query.isLoading && <CircularProgress aria-label="Loading workspaces" />}
    {query.isError && <Alert severity="error">{getErrorMessage(query.error)}</Alert>}
    {!query.isLoading && query.data?.length === 0 && <Alert severity="info">No workspaces created yet.</Alert>}
    <Stack spacing={1}>{query.data?.map((workspace) => <Button key={workspace.id} component={RouterLink} to={`/app/workspaces/${workspace.id}`} variant="outlined" sx={{ justifyContent: "space-between", p: 2 }}>
      <span>{workspace.name}</span><span>{workspace.video_count} video{workspace.video_count === 1 ? "" : "s"}</span>
    </Button>)}</Stack>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Create workspace</DialogTitle>
      <DialogContent><TextField autoFocus fullWidth label="Workspace name" value={name} onChange={(event) => setName(event.target.value)} margin="dense" /></DialogContent>
      {create.isError && <Alert severity="error" sx={{ mx: 3 }}>{getErrorMessage(create.error)}</Alert>}
      <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>Create</Button></DialogActions>
    </Dialog>
  </Stack>;
}
