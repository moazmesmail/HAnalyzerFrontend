import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import type { AnalysisArtifact } from "../../../shared/api/generated";
import { useSession } from "../../auth/session";
import { evidenceUrl, getAnalysis, getAnalysisReport, getAnalysisResults, getAnalysisUsage, getStructuredAnalysis, retryAnalysis } from "../api";
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
  const retry = useMutation({
    mutationFn: () => retryAnalysis(sessionId ?? "", auth.csrfToken),
    onSuccess: (newAnalysis) => navigate(`/app/analyses/${newAnalysis.id}`)
  });

  useEffect(() => {
    if (!terminal || !sessionId) return;
    void queryClient.invalidateQueries({ queryKey: analysisKeys.results(auth.user?.id, sessionId) });
    void queryClient.invalidateQueries({ queryKey: analysisKeys.usage(auth.user?.id, sessionId) });
    void queryClient.invalidateQueries({ queryKey: analysisKeys.structured(auth.user?.id, sessionId) });
    void queryClient.invalidateQueries({ queryKey: analysisKeys.report(auth.user?.id, sessionId) });
  }, [auth.user?.id, queryClient, sessionId, terminal]);

  const framesById = new Map((results.data?.frames ?? []).map((frame) => [frame.id, frame]));
  const artifactsByCategory = (structured.data?.artifacts ?? []).reduce<Record<string, AnalysisArtifact[]>>((groups, artifact) => {
    (groups[artifact.category] ??= []).push(artifact);
    return groups;
  }, {});

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
      {structured.data && structured.data.batch_jobs.length > 0 && <Paper sx={{ p: 2 }}><Stack spacing={1}>
        <Typography variant="h5">Analysis coverage</Typography>
        <Typography>{structured.data.coverage.percent ?? 0}% of 10-second windows analyzed successfully</Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          {structured.data.batch_jobs.map((job) => <Chip key={job.id} size="small" color={job.status === "completed" ? "success" : job.status === "failed" ? "error" : "default"} label={`${formatTime(job.start_seconds)}–${formatTime(job.end_seconds)} · ${job.status}`} />)}
        </Stack>
        {(structured.data.coverage.missing_ranges?.length ?? 0) > 0 && <Alert severity="warning">Missing evidence: {structured.data.coverage.missing_ranges?.map((range) => `${formatTime(range.start_seconds)}–${formatTime(range.end_seconds)}`).join(", ")}</Alert>}
      </Stack></Paper>}

      {structured.data && structured.data.artifacts.length > 0 && <Stack spacing={2}>
        <Typography variant="h5">Competition analysis</Typography>
        {Object.entries(artifactsByCategory).map(([category, artifacts]) => artifacts && <Paper key={category} sx={{ p: 2 }}><Stack spacing={1.5}>
          <Typography variant="h6" sx={{ textTransform: "capitalize" }}>{category.replaceAll("_", " ")}</Typography>
          {artifacts.map((artifact) => {
            const evidenceFrame = framesById.get(artifact.evidence_frame_ids[0]);
            return <Stack key={artifact.id} direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
              {evidenceFrame && <Box component="img" src={evidenceUrl(evidenceFrame.asset_id)} alt="Artifact evidence" loading="lazy" sx={{ width: 160, aspectRatio: "16 / 9", objectFit: "cover" }} />}
              <Box sx={{ flexGrow: 1 }}><Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}><Typography sx={{ fontWeight: 600 }}>{artifact.title}</Typography><Chip size="small" label={artifact.subtype.replaceAll("_", " ")} /></Stack>
                <Typography>{artifact.observation}</Typography>
                {artifact.interpretation && <Typography color="text.secondary"><strong>Interpretation:</strong> {artifact.interpretation}</Typography>}
                {Object.keys(artifact.attributes).length > 0 && <Typography variant="body2" color="text.secondary">{formatAttributes(artifact.attributes)}</Typography>}
                <Typography variant="caption" color="text.secondary">{formatTime(artifact.start_seconds)}–{formatTime(artifact.end_seconds)} · confidence {Math.round(artifact.confidence * 100)}% · importance {Math.round(artifact.importance * 100)}%</Typography>
              </Box>
            </Stack>;
          })}
        </Stack></Paper>)}
      </Stack>}

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

function formatAttributes(attributes: Record<string, unknown>) {
  return Object.entries(attributes).map(([key, value]) => `${key.replaceAll("_", " ")}: ${formatValue(value)}`).join(" · ");
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
