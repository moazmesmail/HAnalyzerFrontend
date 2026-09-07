import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import { Alert, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { useSession } from "../../auth/session";
import { listArchivedVideos, restoreVideo } from "../api";
import { videoKeys } from "../queries";

export function ArchivePage() {
  const session = useSession();
  const client = useQueryClient();
  const videos = useQuery({ queryKey: videoKeys.archive(session.user?.id), queryFn: listArchivedVideos, enabled: Boolean(session.user) });
  const restore = useMutation({
    mutationFn: (videoId: string) => restoreVideo(videoId, session.csrfToken),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: videoKeys.archive(session.user?.id) }),
        client.invalidateQueries({ queryKey: videoKeys.list(session.user?.id) }),
      ]);
    },
  });
  const items = videos.data?.items ?? [];

  return <Stack spacing={3}>
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
      <div><Typography variant="h4" component="h1">Archive</Typography><Typography color="text.secondary">Archived videos can be restored at any time.</Typography></div>
      <Button component={RouterLink} to="/app/videos">Back to videos</Button>
    </Stack>
    {videos.isLoading && <CircularProgress aria-label="Loading archive" />}
    {videos.isError && <Alert severity="error">{getErrorMessage(videos.error)}</Alert>}
    {!videos.isLoading && items.length === 0 && <Alert severity="info">No archived videos.</Alert>}
    {items.length > 0 && <Paper sx={{ overflowX: "auto" }}><Table>
      <TableHead><TableRow><TableCell>File</TableCell><TableCell>Archived</TableCell><TableCell>Duration</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{items.map((video) => <TableRow key={video.id}>
        <TableCell>{video.original_filename}</TableCell>
        <TableCell>{video.archived_at ? new Date(video.archived_at).toLocaleString() : "—"}</TableCell>
        <TableCell>{formatDuration(video.duration_seconds)}</TableCell>
        <TableCell><Chip size="small" label="Archived" /></TableCell>
        <TableCell align="right"><Button startIcon={<RestoreRoundedIcon />} onClick={() => restore.mutate(video.id)} disabled={restore.isPending}>Restore</Button><Button component={RouterLink} to={`/app/videos/${video.id}`}>Open</Button></TableCell>
      </TableRow>)}</TableBody>
    </Table></Paper>}
  </Stack>;
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "Unknown";
  return `${Math.floor(seconds / 60)}:${Math.round(seconds % 60).toString().padStart(2, "0")}`;
}

