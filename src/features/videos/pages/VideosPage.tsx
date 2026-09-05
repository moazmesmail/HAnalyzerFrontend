import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { useSession } from "../../auth/session";
import { listVideos } from "../api";
import { videoKeys } from "../queries";

export function VideosPage() {
  const session = useSession();
  const videos = useQuery({
    queryKey: videoKeys.list(session.user?.id),
    queryFn: listVideos,
    enabled: Boolean(session.user)
  });

  const items = videos.data?.items ?? [];

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" component="h1">
          My videos
        </Typography>
        <Button component={RouterLink} to="/app/videos/new" variant="contained" startIcon={<AddIcon />}>
          Upload
        </Button>
      </Stack>

      {videos.isLoading && <CircularProgress aria-label="Loading videos" />}
      {videos.isError && <Alert severity="error">{getErrorMessage(videos.error)}</Alert>}

      {!videos.isLoading && items.length === 0 && <Alert severity="info">No videos uploaded yet.</Alert>}

      {items.length > 0 && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Open</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>{video.original_filename}</TableCell>
                  <TableCell>{new Date(video.created_at).toLocaleString()}</TableCell>
                  <TableCell>{formatDuration(video.duration_seconds)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={video.preparation_status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button component={RouterLink} to={`/app/videos/${video.id}`}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) {
    return "Unknown";
  }

  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${rest}`;
}
