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
import { createSummaryVideo, evidenceUrl, getAnalysis, getAnalysisReport, getAnalysisResults, getAnalysisUsage, getStructuredAnalysis, getSummaryVideo, retryAnalysis, summaryVideoUrl } from "../api";
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
  const results = useQuery({
    queryKey: analysisKeys.results(auth.user?.id, sessionId),
    queryFn: () => getAnalysisResults(sessionId ?? ""),
    enabled: Boolean(sessionId && terminal)
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
    void queryClient.invalidateQueries({ queryKey: analysisKeys.results(auth.user?.id, sessionId) });
    void queryClient.invalidateQueries({ queryKey: analysisKeys.structured(auth.user?.id, sessionId) });
    void queryClient.invalidateQueries({ queryKey: analysisKeys.report(auth.user?.id, sessionId) });
    void queryClient.invalidateQueries({ queryKey: analysisKeys.summaryVideo(auth.user?.id, sessionId) });
  }, [auth.user?.id, queryClient, sessionId, terminal]);

  const framesById = new Map((results.data?.frames ?? []).map((frame) => [frame.id, frame]));
  const evidenceByArtifactId = new Map((structured.data?.artifacts ?? []).flatMap((artifact) => {
    const frame = framesById.get(artifact.evidence_frame_ids[0]);
    return frame ? [[artifact.id, { assetId: frame.asset_id, timestampSeconds: frame.timestamp_seconds }] as const] : [];
  }));

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
    {structured.data && structured.data.batch_jobs.length > 0 && <Paper sx={{ p: 2 }}><Stack spacing={1}>
      <Typography variant="h5">Analysis coverage</Typography>
      <Typography>{structured.data.coverage.percent ?? 0}% of 10-second windows analyzed successfully</Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        {structured.data.batch_jobs.map((job) => <Chip key={job.id} size="small" color={job.status === "completed" ? "success" : job.status === "failed" ? "error" : "default"} label={`${formatTimestamp(job.start_seconds)}–${formatTimestamp(job.end_seconds)} · ${job.status}`} />)}
      </Stack>
      {(structured.data.coverage.missing_ranges?.length ?? 0) > 0 && <Alert severity="warning">Missing evidence: {structured.data.coverage.missing_ranges?.map((range) => `${formatTimestamp(range.start_seconds)}–${formatTimestamp(range.end_seconds)}`).join(", ")}</Alert>}
    </Stack></Paper>}
      {report.data && <Paper sx={{ p: 2 }}><Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Typography variant="h5">Deep report</Typography><Chip size="small" label={report.data.report_status} color={report.data.report_status === "completed" ? "success" : "default"} /></Stack>
        {report.data.content.executive_summary ? <Typography>{report.data.content.executive_summary}</Typography> : <Alert severity="info">No deep report is available for this legacy analysis.</Alert>}
        <ReportSection title="Competition context" value={report.data.content.competition_context} evidence={evidenceByArtifactId} />
        <ReportSection title="Video features" value={report.data.content.video_features} evidence={evidenceByArtifactId} />
        <ReportSection title="Key moments" value={report.data.content.key_moments} evidence={evidenceByArtifactId} />
        <ReportSection title="Run summaries" value={report.data.content.run_summaries} evidence={evidenceByArtifactId} />
        <ReportSection title="Course analysis" value={report.data.content.course_analysis} evidence={evidenceByArtifactId} />
        <ReportSection title="Technique" value={report.data.content.technique_analysis} evidence={evidenceByArtifactId} />
        <ReportSection title="Synchronization" value={report.data.content.synchronization_analysis} evidence={evidenceByArtifactId} />
        <ReportSection title="Scoreboard results" value={report.data.content.scoreboard_results} evidence={evidenceByArtifactId} />
        <ReportSection title="Comparisons" value={report.data.content.comparisons} evidence={evidenceByArtifactId} />
        <ReportSection title="Possible causal relationships" value={report.data.content.causal_hypotheses} evidence={evidenceByArtifactId} />
        <ReportSection title="Strengths" value={report.data.content.strengths} evidence={evidenceByArtifactId} />
        <ReportSection title="Weaknesses" value={report.data.content.weaknesses} evidence={evidenceByArtifactId} />
        <ReportSection title="Recommendations" value={report.data.content.recommendations} evidence={evidenceByArtifactId} />
        {report.data.limitations.length > 0 && <Alert severity="warning">{report.data.limitations.join(" ")}</Alert>}
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

function formatReportValue(value: unknown, key?: string): string {
  if (value == null) return "unknown";
  if (key?.endsWith("_seconds") && typeof value === "number") return formatTimestamp(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((item) => formatReportValue(item)).join(", ");
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>)
    .filter(([childKey]) => !childKey.endsWith("_id"))
    .map(([childKey, child]) => `${formatLabel(childKey)}: ${formatReportValue(child, childKey)}`)
    .join(" · ");
  return String(value);
}

function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

type ReportEvidence = Map<string, { assetId: string; timestampSeconds: number }>;

function ReportSection({ title, value, evidence }: { title: string; value: unknown; evidence: ReportEvidence }) {
  const empty = value == null || (Array.isArray(value) && value.length === 0) || (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0);
  if (empty) return null;
  const items = Array.isArray(value) ? value : [value];
  return <Box>
    <Typography variant="h6" gutterBottom>{title}</Typography>
    <Stack spacing={1}>
      {items.map((item, index) => <ReportItem key={index} value={item} evidence={evidence} />)}
    </Stack>
  </Box>;
}

function ReportItem({ value, evidence }: { value: unknown; evidence: ReportEvidence }) {
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    return <Typography component="div">{formatReportValue(value)}</Typography>;
  }

  const record = value as Record<string, unknown>;
  const artifactId = typeof record.artifact_id === "string" ? record.artifact_id : null;
  const snapshot = artifactId ? evidence.get(artifactId) : undefined;
  const heading = [record.title, record.rider, record.horse].filter((item) => typeof item === "string" && item).join(" · ");
  const entries = Object.entries(record).filter(([key, child]) =>
    !key.endsWith("_id") && key !== "title" && key !== "rider" && key !== "horse" && child != null && child !== ""
  );

  return <Paper variant="outlined" sx={{ p: 1.5 }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      {snapshot && <Box>
        <Box component="img" src={evidenceUrl(snapshot.assetId)} alt="Report evidence" loading="lazy" sx={{ width: { xs: "100%", sm: 180 }, aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Evidence at {formatTimestamp(snapshot.timestampSeconds)}</Typography>
      </Box>}
      <Stack spacing={0.75} sx={{ flexGrow: 1 }}>
        {heading && <Typography sx={{ fontWeight: 600 }}>{heading}</Typography>}
        {entries.map(([key, child]) => <Box key={key}>
          <Typography variant="caption" color="text.secondary">{formatLabel(key)}</Typography>
          <Typography>{formatReportValue(child, key)}</Typography>
        </Box>)}
      </Stack>
    </Stack>
  </Paper>;
}
