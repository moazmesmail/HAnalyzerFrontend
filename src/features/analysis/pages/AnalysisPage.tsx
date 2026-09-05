import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { useSession } from "../../auth/session";
import { evidenceUrl, getAnalysis, getAnalysisResults, getAnalysisUsage, retryAnalysis } from "../api";
import { analysisKeys } from "../queries";

export function AnalysisPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const auth = useSession();
  const queryClient = useQueryClient();
  const analysis = useQuery({
    queryKey: analysisKeys.detail(auth.user?.id, sessionId),
    queryFn: () => getAnalysis(sessionId ?? ""),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => ["pending", "running"].includes(query.state.data?.status ?? "") ? 1500 : false
  });
  const terminal = Boolean(analysis.data && !["pending", "running"].includes(analysis.data.status));
  const results = useQuery({
    queryKey: analysisKeys.results(auth.user?.id, sessionId),
    queryFn: () => getAnalysisResults(sessionId ?? ""),
    enabled: Boolean(
      sessionId &&
      analysis.data &&
      analysis.data.status !== "failed" &&
      analysis.data.phase !== "queued" &&
      analysis.data.phase !== "extracting_frames"
    ),
    refetchInterval: terminal ? false : 3000
  });
  const usage = useQuery({
    queryKey: analysisKeys.usage(auth.user?.id, sessionId),
    queryFn: () => getAnalysisUsage(sessionId ?? ""),
    enabled: Boolean(sessionId && analysis.data),
    refetchInterval: terminal ? false : 3000
  });
  const retry = useMutation({
    mutationFn: () => retryAnalysis(sessionId ?? "", auth.csrfToken),
    onSuccess: (newAnalysis) => navigate(`/app/analyses/${newAnalysis.id}`)
  });

  useEffect(() => {
    if (!terminal || !sessionId) return;
    void queryClient.invalidateQueries({ queryKey: analysisKeys.results(auth.user?.id, sessionId) });
    void queryClient.invalidateQueries({ queryKey: analysisKeys.usage(auth.user?.id, sessionId) });
  }, [auth.user?.id, queryClient, sessionId, terminal]);

  const framesById = new Map((results.data?.frames ?? []).map((frame) => [frame.id, frame]));

  return <Stack spacing={3}>
    <Button component={RouterLink} to={analysis.data ? `/app/videos/${analysis.data.video_id}` : "/app/videos"} startIcon={<ArrowBackIcon />} sx={{ alignSelf: "flex-start" }}>Back to video</Button>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
      <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>Visual analysis</Typography>
      {analysis.data && <Chip label={formatStatus(analysis.data.status)} color={analysis.data.status === "failed" ? "error" : analysis.data.status === "completed" ? "success" : "default"} />}
    </Stack>
    {analysis.isLoading && <CircularProgress aria-label="Loading analysis" />}
    {analysis.isError && <Alert severity="error">{getErrorMessage(analysis.error)}</Alert>}
    {analysis.data && <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography>Phase: {analysis.data.phase.replaceAll("_", " ")}</Typography>
        <Typography color="text.secondary">{analysis.data.profile_id.replaceAll("_", " ")} · {analysis.data.model} · {analysis.data.sampling_fps} FPS</Typography>
        <LinearProgress variant="determinate" value={analysis.data.terminal_progress_percent} />
        <Typography color="text.secondary">{analysis.data.terminal_progress_percent}% complete</Typography>
        {analysis.data.error && <Alert severity="error">{analysis.data.error}</Alert>}
        {["partial", "failed"].includes(analysis.data.status) && <Button variant="outlined" startIcon={<ReplayIcon />} disabled={retry.isPending} onClick={() => retry.mutate()} sx={{ alignSelf: "flex-start" }}>{retry.isPending ? "Retrying…" : "Retry failed work"}</Button>}
        {retry.isError && <Alert severity="error">{getErrorMessage(retry.error)}</Alert>}
        {analysis.data.summary.overview && <Alert severity="success">{analysis.data.summary.overview}</Alert>}
      </Stack>
    </Paper>}
    {results.isLoading && <CircularProgress aria-label="Loading results" />}
    {results.isError && <Alert severity="error">{getErrorMessage(results.error)}</Alert>}
    {results.data && <>
      <Typography variant="h5">Structured observations</Typography>
      {results.data.observations.length === 0 && <Alert severity="info">The model did not produce any visually supported findings for the sampled frames.</Alert>}
      <Stack spacing={1.5}>{results.data.observations.map((observation) => {
        const frame = framesById.get(observation.frame_id);
        return <Paper key={observation.id} sx={{ p: 2 }}><Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
          {frame && <Box component="img" src={evidenceUrl(frame.asset_id)} alt="Observation evidence" loading="lazy" sx={{ width: 160, aspectRatio: "16 / 9", objectFit: "cover" }} />}
          <Box sx={{ flexGrow: 1 }}><Stack direction="row" spacing={1} sx={{ mb: 0.5, alignItems: "center" }}><Chip size="small" label={observation.type.replaceAll("_", " ")} /><Typography variant="caption">importance {Math.round(observation.importance * 100)}%</Typography></Stack><Typography>{observation.observation}</Typography>{observation.interpretation && <Typography sx={{ mt: 0.5 }} color="text.secondary"><strong>Interpretation:</strong> {observation.interpretation}</Typography>}<Typography variant="body2" color="text.secondary">Evidence at {formatTime(observation.start_seconds)} · confidence {Math.round(observation.confidence * 100)}%</Typography>{observation.limitations.map((item) => <Typography key={item} variant="caption" sx={{ display: "block" }} color="text.secondary">Limitation: {item}</Typography>)}</Box>
        </Stack></Paper>;
      })}</Stack>
      {usage.data && <Paper sx={{ p: 2 }}><Typography variant="h5" gutterBottom>Model usage</Typography><Typography>{usage.data.model}</Typography><Typography color="text.secondary">{usage.data.successful_requests} successful · {usage.data.failed_requests} failed · {usage.data.total_tokens.toLocaleString()} tokens · {usage.data.total_cost == null ? "Cost unavailable" : `$${usage.data.total_cost.toFixed(6)}`}</Typography></Paper>}
    </>}
  </Stack>;
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}
