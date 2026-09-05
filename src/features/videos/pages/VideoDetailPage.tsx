import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Slider,
  Stack,
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { useSession } from "../../auth/session";
import { getVideo, previewUrl, retryVideoPreparation } from "../api";
import { videoKeys } from "../queries";

export function VideoDetailPage() {
  const { videoId } = useParams();
  const session = useSession();
  const queryClient = useQueryClient();

  const video = useQuery({
    queryKey: videoKeys.detail(session.user?.id, videoId),
    queryFn: () => getVideo(videoId ?? ""),
    enabled: Boolean(videoId)
  });

  const retry = useMutation({
    mutationFn: () => retryVideoPreparation(videoId ?? "", session.csrfToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: videoKeys.detail(session.user?.id, videoId) });
      await queryClient.invalidateQueries({ queryKey: videoKeys.list(session.user?.id) });
    }
  });

  const currentVideo = video.data;
  const currentPreviewUrl = currentVideo ? previewUrl(currentVideo) : null;

  return (
    <Stack spacing={3}>
      {video.isLoading && <CircularProgress aria-label="Loading video" />}
      {video.isError && <Alert severity="error">{getErrorMessage(video.error)}</Alert>}
      {retry.isError && <Alert severity="error">{getErrorMessage(retry.error)}</Alert>}

      {currentVideo && (
        <>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              {currentVideo.original_filename}
            </Typography>
            <Chip label={currentVideo.preparation_status} />
          </Stack>

          <Paper sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography>Uploaded: {new Date(currentVideo.created_at).toLocaleString()}</Typography>
              <Typography>Duration: {formatDuration(currentVideo.duration_seconds)}</Typography>
              {currentVideo.preparation_error && (
                <Alert severity="warning">{currentVideo.preparation_error}</Alert>
              )}
              {currentVideo.preparation_retryable && (
                <Button
                  startIcon={<ReplayIcon />}
                  onClick={() => retry.mutate()}
                  disabled={retry.isPending}
                  variant="outlined"
                >
                  Retry preparation
                </Button>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Silent preview</Typography>
              {currentPreviewUrl ? (
                <SilentPreview src={currentPreviewUrl} />
              ) : (
                <Alert severity="info">Preview is not available yet.</Alert>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Analysis</Typography>
              <Alert severity="info">Analysis functionality is not implemented in this frontend slice yet.</Alert>
              <Divider />
              <Typography color="text.secondary">
                The video workspace is ready for future analysis setup and status screens.
              </Typography>
            </Stack>
          </Paper>
        </>
      )}
    </Stack>
  );
}

function SilentPreview({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  async function togglePlayback() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  }

  function seekTo(value: number) {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = value;
    setCurrentTime(value);
  }

  return (
    <Stack spacing={1}>
      <Box
        component="video"
        ref={videoRef}
        src={src}
        muted
        playsInline
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
        sx={{ width: "100%", maxHeight: 520, bgcolor: "black" }}
      />
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <IconButton aria-label={isPlaying ? "Pause preview" : "Play preview"} onClick={() => void togglePlayback()}>
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <Slider
          aria-label="Preview position"
          min={0}
          max={duration || 0}
          value={Math.min(currentTime, duration || 0)}
          onChange={(_, value) => seekTo(Array.isArray(value) ? value[0] : value)}
          disabled={!duration}
        />
        <Typography sx={{ minWidth: 88 }} color="text.secondary">
          {formatDuration(currentTime)}
        </Typography>
      </Stack>
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
