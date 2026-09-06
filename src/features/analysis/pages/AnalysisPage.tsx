import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import MovieCreationIcon from "@mui/icons-material/MovieCreation";
import DownloadIcon from "@mui/icons-material/Download";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { useSession } from "../../auth/session";
import { createSummaryVideo, getAnalysis, getAnalysisReport, getAnalysisUsage, getStructuredAnalysis, getSummaryVideo, retryAnalysis, summaryVideoUrl } from "../api";
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
  const usage = useQuery({
    queryKey: analysisKeys.usage(auth.user?.id, sessionId),
    queryFn: () => getAnalysisUsage(sessionId ?? ""),
    enabled: Boolean(sessionId && analysis.data),
    refetchInterval: terminal ? false : 3000
  });
  const structured = useQuery({
    queryKey: analysisKeys.structured(auth.user?.id, sessionId),
    queryFn: () => getStructuredAnalysis(sessionId ?? ""),
    enabled: Boolean(sessionId && analysis.data && !["queued", "extracting_frames"].includes(analysis.data.phase)),
    refetchInterval: terminal ? false : 3000
  });
  const report = useQuery({
    queryKey: analysisKeys.report(auth.user?.id, sessionId),
    queryFn: () => getAnalysisReport(sessionId ?? ""),
    enabled: Boolean(sessionId && terminal),
  });
  const summaryVideo = useQuery({
    queryKey: analysisKeys.summaryVideo(auth.user?.id, sessionId),
    queryFn: () => getSummaryVideo(sessionId ?? ""),
    enabled: Boolean(sessionId && terminal),
    retry: false,
    refetchInterval: (query) => ["pending", "processing"].includes(query.state.data?.status ?? "") ? 1500 : false
  });
  const createSummary = useMutation({
    mutationFn: () => createSummaryVideo(sessionId ?? "", auth.csrfToken),
    onSuccess: (created) => queryClient.setQueryData(
      analysisKeys.summaryVideo(auth.user?.id, sessionId),
      created
    )
  });
  const retry = useMutation({
    mutationFn: () => retryAnalysis(sessionId ?? "", auth.csrfToken),
    onSuccess: (newAnalysis) => navigate(`/app/analyses/${newAnalysis.id}`)
  });

  useEffect(() => {
    if (!terminal || !sessionId) return;
    void queryClient.invalidateQueries({ queryKey: analysisKeys.usage(auth.user?.id, sessionId) });
    void queryClient.invalidateQueries({ queryKey: analysisKeys.structured(auth.user?.id, sessionId) });
    void queryClient.invalidateQueries({ queryKey: analysisKeys.report(auth.user?.id, sessionId) });
    void queryClient.invalidateQueries({ queryKey: analysisKeys.summaryVideo(auth.user?.id, sessionId) });
  }, [auth.user?.id, queryClient, sessionId, terminal]);

  return <Stack spacing={3}>
    <Button component={RouterLink} to={analysis.data ? `/app/videos/${analysis.data.video_id}` : "/app/videos"} startIcon={<ArrowBackIcon />} sx={{ alignSelf: "flex-start" }}>Back to video</Button>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
      <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>Visual analysis</Typography>
      {terminal && structured.data && structured.data.artifacts.some((artifact) => artifact.category === "jump" && artifact.confidence >= 0.5) && <Button
        variant="contained"
        startIcon={createSummary.isPending ? <CircularProgress size={18} color="inherit" /> : <MovieCreationIcon />}
        disabled={createSummary.isPending || ["pending", "processing"].includes(summaryVideo.data?.status ?? "")}
        onClick={() => createSummary.mutate()}
      >{createSummary.isPending || ["pending", "processing"].includes(summaryVideo.data?.status ?? "") ? "Creating…" : "Create Summary Video"}</Button>}
      {analysis.data && <Chip label={formatStatus(analysis.data.status)} color={analysis.data.status === "failed" ? "error" : analysis.data.status === "completed" ? "success" : "default"} />}
    </Stack>
    {createSummary.isError && <Alert severity="error">{getErrorMessage(createSummary.error)}</Alert>}
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
      </Stack>
    </Paper>}
      {report.data && <Paper sx={{ p: 2 }}><Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Typography variant="h5">Deep report</Typography><Chip size="small" label={report.data.report_status} color={report.data.report_status === "completed" ? "success" : "default"} /></Stack>
        {report.data.content.executive_summary ? <Typography>{report.data.content.executive_summary}</Typography> : <Alert severity="info">No deep report is available for this legacy analysis.</Alert>}
        <ReportSection title="Competition context" value={report.data.content.competition_context} />
        <ReportSection title="Video features" value={report.data.content.video_features} />
        <ReportSection title="Key moments" value={report.data.content.key_moments} />
        <ReportSection title="Run summaries" value={report.data.content.run_summaries} />
        <ReportSection title="Course analysis" value={report.data.content.course_analysis} />
        <ReportSection title="Technique" value={report.data.content.technique_analysis} />
        <ReportSection title="Synchronization" value={report.data.content.synchronization_analysis} />
        <ReportSection title="Scoreboard results" value={report.data.content.scoreboard_results} />
        <ReportSection title="Comparisons" value={report.data.content.comparisons} />
        <ReportSection title="Possible causal relationships" value={report.data.content.causal_hypotheses} />
        <ReportSection title="Strengths" value={report.data.content.strengths} />
        <ReportSection title="Weaknesses" value={report.data.content.weaknesses} />
        <ReportSection title="Recommendations" value={report.data.content.recommendations} />
        {report.data.limitations.length > 0 && <Alert severity="warning">{report.data.limitations.join(" ")}</Alert>}
      </Stack></Paper>}

      {summaryVideo.data && <Paper sx={{ p: 2 }}><Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="h5">Summary video</Typography>
          <Chip size="small" label={summaryVideo.data.status} color={summaryVideo.data.status === "completed" ? "success" : summaryVideo.data.status === "failed" ? "error" : "default"} />
        </Stack>
        {["pending", "processing"].includes(summaryVideo.data.status) && <Stack spacing={1}>
          <LinearProgress />
          <Typography color="text.secondary">Creating a silent highlight reel from {summaryVideo.data.selected_segments.length} selected segment{summaryVideo.data.selected_segments.length === 1 ? "" : "s"}…</Typography>
        </Stack>}
        {summaryVideo.data.status === "failed" && <Alert severity="error">{summaryVideo.data.error ?? "Summary video generation failed."}</Alert>}
        {summaryVideo.data.status === "completed" && summaryVideo.data.asset_id && <>
          <Box component="video" src={summaryVideoUrl(summaryVideo.data.asset_id)} controls playsInline preload="metadata" sx={{ width: "100%", maxHeight: 560, bgcolor: "black" }} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
            <Typography color="text.secondary" sx={{ flexGrow: 1 }}>{formatDuration(summaryVideo.data.duration_seconds ?? 0)} · silent · {summaryVideo.data.selected_segments.length} segment{summaryVideo.data.selected_segments.length === 1 ? "" : "s"}</Typography>
            <Button component="a" href={summaryVideoUrl(summaryVideo.data.asset_id)} download startIcon={<DownloadIcon />}>Download</Button>
          </Stack>
        </>}
      </Stack></Paper>}

      {usage.data && <Paper sx={{ p: 2 }}><Typography variant="h5" gutterBottom>Model usage</Typography><Typography>{usage.data.model}</Typography><Typography color="text.secondary">{usage.data.successful_requests} successful · {usage.data.failed_requests} failed · {usage.data.total_tokens.toLocaleString()} tokens · {usage.data.total_cost == null ? "Cost unavailable" : `$${usage.data.total_cost.toFixed(6)}`}</Typography></Paper>}
  </Stack>;
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDuration(seconds: number) {
  return `${Math.round(seconds)} seconds`;
}

function formatValue(value: unknown): string {
  if (value == null) return "unknown";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, child]) => `${key.replaceAll("_", " ")}: ${formatValue(child)}`).join(", ");
  return String(value);
}

function ReportSection({ title, value }: { title: string; value: unknown }) {
  const empty = value == null || (Array.isArray(value) && value.length === 0) || (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0);
  if (empty) return null;
  if (Array.isArray(value)) return <Box><Typography variant="h6">{title}</Typography><Stack component="ul" spacing={0.5} sx={{ mt: 0.5 }}>{value.map((item, index) => <Typography component="li" key={index}>{formatValue(item)}</Typography>)}</Stack></Box>;
  return <Box><Typography variant="h6">{title}</Typography><Typography>{formatValue(value)}</Typography></Box>;
}
