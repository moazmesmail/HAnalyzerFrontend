import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { useSession } from "../../auth/session";
import { getVideo, originalUrl, startVideoAnalysis } from "../api";
import { videoKeys } from "../queries";

export function VideoDetailPage() {
  const { videoId } = useParams();
  const session = useSession();
  const queryClient = useQueryClient();
  const [playbackError, setPlaybackError] = useState(false);
  const video = useQuery({
    queryKey: videoKeys.detail(session.user?.id, videoId),
    queryFn: () => getVideo(videoId ?? ""),
    enabled: Boolean(videoId),
    refetchInterval: (query) => query.state.data?.preparation_status === "preparing" ? 2000 : false
  });
  const analyze = useMutation({
    mutationFn: () => startVideoAnalysis(videoId ?? "", session.csrfToken),
    onSuccess: async (updated) => {
      queryClient.setQueryData(videoKeys.detail(session.user?.id, videoId), updated);
      await queryClient.invalidateQueries({ queryKey: videoKeys.list(session.user?.id) });
    }
  });
  const currentVideo = video.data;
  const src = currentVideo ? originalUrl(currentVideo) : null;
  const processing = currentVideo?.preparation_status === "preparing" || analyze.isPending;

  return (
    <Stack spacing={3}>
      <Button component={RouterLink} to="/app/videos" sx={{ alignSelf: "flex-start" }}>Back to my videos</Button>
      {video.isLoading && <CircularProgress aria-label="Loading video" />}
      {video.isError && <Alert severity="error">{getErrorMessage(video.error)}</Alert>}
      {currentVideo && <>
        <Typography variant="h4" component="h1" sx={{ overflowWrap: "anywhere" }}>{currentVideo.original_filename}</Typography>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Original video</Typography>
            <Typography color="text.secondary">Uploaded {new Date(currentVideo.created_at).toLocaleString()} · Original quality and audio preserved</Typography>
            {src ? <>
              <Box component="video" key={src} src={src} crossOrigin="use-credentials" controls playsInline preload="metadata"
                onLoadedMetadata={() => setPlaybackError(false)} onError={() => setPlaybackError(true)}
                sx={{ width: "100%", maxHeight: 560, bgcolor: "black" }} />
              {playbackError && <Alert severity="warning">This video could not be played. Your browser may not support its original format. You can open the original file below.</Alert>}
              <Button component="a" href={src} target="_blank" rel="noopener" sx={{ alignSelf: "flex-start" }}>Open original file</Button>
            </> : <Alert severity="warning">Original video is unavailable.</Alert>}
          </Stack>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Analysis</Typography>
            <Chip sx={{ alignSelf: "flex-start" }} label={processing ? "Preparing video" : currentVideo.preparation_status === "ready" ? "Visual input prepared" : currentVideo.preparation_status === "failed" ? "Preparation failed" : "Not started"} />
            <Typography color="text.secondary">Start analyzing prepares a silent visual copy for analysis. Competition analysis results are not available yet.</Typography>
            {currentVideo.preparation_error && <Alert severity="error">{currentVideo.preparation_error}</Alert>}
            {analyze.isError && <Alert severity="error">{getErrorMessage(analyze.error)}</Alert>}
            <Button variant="contained" startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
              disabled={!src || processing || currentVideo.preparation_status === "ready"} onClick={() => analyze.mutate()} sx={{ alignSelf: "flex-start" }}>
              {processing ? "Preparing…" : currentVideo.preparation_status === "ready" ? "Visual input prepared" : currentVideo.preparation_status === "failed" ? "Retry analyzing" : "Start analyzing"}
            </Button>
          </Stack>
        </Paper>
      </>}
    </Stack>
  );
}
