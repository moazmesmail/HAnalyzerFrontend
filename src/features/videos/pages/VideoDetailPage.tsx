import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Alert, Box, Button, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { useSession } from "../../auth/session";
import { getVideo, originalUrl } from "../api";
import { videoKeys } from "../queries";
import { listAnalysisProfiles, listVideoAnalyses, startAnalysis } from "../../analysis/api";
import { analysisKeys } from "../../analysis/queries";

export function VideoDetailPage() {
  const { videoId } = useParams();
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [playbackError, setPlaybackError] = useState(false);
  const [samplingFps, setSamplingFps] = useState(3);
  const [profileId, setProfileId] = useState("equestrian_show_jumping");
  const video = useQuery({
    queryKey: videoKeys.detail(session.user?.id, videoId),
    queryFn: () => getVideo(videoId ?? ""),
    enabled: Boolean(videoId),
    refetchInterval: (query) => query.state.data?.preparation_status === "preparing" ? 2000 : false
  });
  const analyses = useQuery({
    queryKey: analysisKeys.video(session.user?.id, videoId),
    queryFn: () => listVideoAnalyses(videoId ?? ""),
    enabled: Boolean(videoId),
    refetchInterval: (query) =>
      query.state.data?.some((item) => ["pending", "running"].includes(item.status)) ? 2000 : false
  });
  const profiles = useQuery({
    queryKey: analysisKeys.profiles(),
    queryFn: listAnalysisProfiles
  });
  const analyze = useMutation({
    mutationFn: () => startAnalysis(videoId ?? "", session.csrfToken, profileId, samplingFps),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: analysisKeys.video(session.user?.id, videoId)
      });
      navigate(`/app/analyses/${updated.id}`);
    }
  });
  const currentVideo = video.data;
  const src = currentVideo ? originalUrl(currentVideo) : null;
  const processing = analyze.isPending;
  const exceedsDurationLimit = (currentVideo?.duration_seconds ?? 0) >= 120;

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
            <Typography color="text.secondary">Analyze timestamped evidence at a minimum of 3 frames per second so brief competition actions are represented.</Typography>
            {exceedsDurationLimit && <Alert severity="warning">This previously uploaded video is 2 minutes or longer and cannot be analyzed. Upload a shorter clip.</Alert>}
            <FormControl size="small" sx={{ maxWidth: 360 }}>
              <InputLabel id="analysis-profile-label">Analysis profile</InputLabel>
              <Select labelId="analysis-profile-label" label="Analysis profile" value={profileId} onChange={(event) => setProfileId(event.target.value)}>
                {(profiles.data ?? []).map((profile) => <MenuItem key={profile.id} value={profile.id}>{profile.display_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ maxWidth: 260 }}>
              <InputLabel id="sampling-fps-label">Sampling rate</InputLabel>
              <Select labelId="sampling-fps-label" label="Sampling rate" value={samplingFps} onChange={(event) => setSamplingFps(Number(event.target.value))}>
                <MenuItem value={3}>3 FPS</MenuItem>
                <MenuItem value={5}>5 FPS</MenuItem>
                <MenuItem value={10}>10 FPS</MenuItem>
              </Select>
            </FormControl>
            {analyze.isError && <Alert severity="error">{getErrorMessage(analyze.error)}</Alert>}
            <Button variant="contained" startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
              disabled={!src || processing || exceedsDurationLimit} onClick={() => analyze.mutate()} sx={{ alignSelf: "flex-start" }}>
              {processing ? "Starting…" : "Start analyzing"}
            </Button>
            {analyses.data && analyses.data.length > 0 && <Stack spacing={1}>
              <Typography variant="subtitle1">Previous analyses</Typography>
              {analyses.data.map((item) => <Button key={item.id} component={RouterLink} to={`/app/analyses/${item.id}`} variant="outlined" sx={{ justifyContent: "space-between" }}>
                <span>{new Date(item.created_at).toLocaleString()} · {item.terminal_progress_percent}%</span><Chip size="small" label={item.status} />
              </Button>)}
            </Stack>}
          </Stack>
        </Paper>
      </>}
    </Stack>
  );
}
