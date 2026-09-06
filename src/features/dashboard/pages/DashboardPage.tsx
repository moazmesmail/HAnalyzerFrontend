import {
  AssessmentRounded,
  CloseRounded,
  CloudUploadRounded,
  MovieCreationRounded,
  PlayArrowRounded,
  ScheduleRounded,
  VideoLibraryRounded,
} from "@mui/icons-material";
import { Button, Chip, Dialog, DialogContent, IconButton, LinearProgress, Snackbar } from "@mui/material";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSession } from "../../auth/session";
import { getSummaryVideo, listVideoAnalyses, summaryVideoUrl } from "../../analysis/api";
import { listVideos, originalUrl } from "../../videos/api";
import "./dashboard.css";

function StatCard({ icon, eyebrow, title, detail }: { icon: React.ReactNode; eyebrow: string; title: string; detail: string }) {
  return <article className="hp-stat"><span className="hp-stat-icon">{icon}</span><div><small>{eyebrow}</small><strong>{title}</strong><p>{detail}</p></div></article>;
}

export function AnalysisDashboardPage() {
  const session = useSession();
  const [notice, setNotice] = useState("");
  const [videoMode, setVideoMode] = useState<"before" | "after" | null>(null);
  const videos = useQuery({ queryKey: ["dashboard", session.user?.id, "videos"], queryFn: listVideos });
  const uploadedVideos = videos.data?.items ?? [];
  const analysisQueries = useQueries({
    queries: uploadedVideos.map(video => ({
      queryKey: ["dashboard", session.user?.id, video.id, "analyses"],
      queryFn: () => listVideoAnalyses(video.id),
    })),
  });
  const allAnalyses = analysisQueries.flatMap((query, videoIndex) =>
    (query.data ?? []).map(analysis => ({ analysis, video: uploadedVideos[videoIndex] }))
  ).sort((a, b) => Date.parse(b.analysis.created_at) - Date.parse(a.analysis.created_at));
  const completedAnalyses = allAnalyses.filter(({ analysis }) => analysis.status === "completed" || analysis.status === "partial");
  const summaryQueries = useQueries({
    queries: completedAnalyses.map(({ analysis }) => ({
      queryKey: ["dashboard", session.user?.id, analysis.id, "summary"],
      queryFn: () => getSummaryVideo(analysis.id),
      retry: false,
    })),
  });
  const summarizedIndex = summaryQueries.findIndex(query => query.data?.status === "completed" && Boolean(query.data.asset_id));
  const summarizedPair = summarizedIndex >= 0 ? completedAnalyses[summarizedIndex] : undefined;
  const featuredPair = summarizedPair ?? completedAnalyses[0] ?? allAnalyses[0];
  const sourceVideo = featuredPair?.video ?? uploadedVideos[0];
  const summary = summarizedIndex >= 0 ? summaryQueries[summarizedIndex].data : undefined;
  const beforeSrc = sourceVideo ? originalUrl(sourceVideo) : null;
  const afterSrc = summary?.asset_id ? summaryVideoUrl(summary.asset_id) : null;
  const activeVideo = videoMode === "after" ? afterSrc : beforeSrc;
  const runningCount = allAnalyses.filter(({ analysis }) => ["pending", "running"].includes(analysis.status)).length;
  const summaryCount = summaryQueries.filter(query => query.data?.status === "completed").length;

  return <>
    <section className="hp-content hp-analysis-dashboard">
      <div className="hp-topline">
        <div><h2>Video analysis workspace</h2><p>Upload rides, review AI analysis, and turn evidence into better performance.</p></div>
        <Button component={NavLink} to="/app/videos/new" variant="contained" startIcon={<CloudUploadRounded />}>Upload new video</Button>
      </div>

      <div className="hp-stats hp-analysis-stats">
        <StatCard icon={<VideoLibraryRounded />} eyebrow="VIDEO LIBRARY" title={`${uploadedVideos.length} video${uploadedVideos.length === 1 ? "" : "s"}`} detail="Original quality preserved" />
        <StatCard icon={<AssessmentRounded />} eyebrow="ANALYSES" title={`${allAnalyses.length} total`} detail={`${completedAnalyses.length} ready to review`} />
        <StatCard icon={<ScheduleRounded />} eyebrow="PROCESSING" title={`${runningCount} active`} detail={runningCount ? "Analysis is running" : "No jobs waiting"} />
        <StatCard icon={<MovieCreationRounded />} eyebrow="SUMMARY VIDEOS" title={`${summaryCount} created`} detail="Downloadable highlight reels" />
      </div>

      <div className="hp-analysis-focus">
        <article className="hp-card hp-featured-analysis">
          <div className="hp-card-title"><div><h3><AssessmentRounded /> Latest analysis</h3><p>{sourceVideo?.original_filename ?? "Upload your first ride to begin"}</p></div>{featuredPair && <Chip size="small" label={featuredPair.analysis.status} color={featuredPair.analysis.status === "completed" ? "success" : featuredPair.analysis.status === "failed" ? "error" : "default"} />}</div>
          <button className="hp-featured-video" disabled={!beforeSrc} onClick={() => setVideoMode("before")}>
            {beforeSrc ? <video src={beforeSrc} muted playsInline preload="metadata" /> : <span>🎬</span>}
            <i><PlayArrowRounded /></i>
          </button>
          {featuredPair ? <>
            <div className="hp-analysis-progress"><span>{featuredPair.analysis.phase.replaceAll("_", " ")}</span><b>{featuredPair.analysis.terminal_progress_percent}%</b></div>
            <LinearProgress variant="determinate" value={featuredPair.analysis.terminal_progress_percent} />
            <div className="hp-analysis-actions"><Button component={NavLink} to={`/app/analyses/${featuredPair.analysis.id}`} variant="contained">Open full analysis</Button>{afterSrc && <Button variant="outlined" onClick={() => setVideoMode("after")}>Play summary</Button>}</div>
          </> : <div className="hp-empty-analysis"><p>No analysis is available yet.</p><Button component={NavLink} to={sourceVideo ? `/app/videos/${sourceVideo.id}` : "/app/videos/new"} variant="contained">{sourceVideo ? "Analyze this video" : "Upload a video"}</Button></div>}
        </article>

        <article className="hp-card hp-recent-analysis">
          <div className="hp-card-title"><div><h3><VideoLibraryRounded /> Recent videos</h3><p>Continue analyzing your latest rides.</p></div><NavLink to="/app/videos">View all</NavLink></div>
          {uploadedVideos.length ? uploadedVideos.slice(0, 4).map(video => {
            const latest = allAnalyses.find(item => item.video.id === video.id)?.analysis;
            return <NavLink className="hp-video-row" key={video.id} to={`/app/videos/${video.id}`}>
              <span className="hp-video-row-thumb">{originalUrl(video) ? <video src={originalUrl(video) ?? undefined} muted playsInline preload="metadata" /> : "🎥"}<PlayArrowRounded /></span>
              <span><b>{video.original_filename}</b><small>{latest ? `${latest.status} · ${latest.terminal_progress_percent}% complete` : "Ready to analyze"}</small></span>
              <em>{latest ? "Review" : "Analyze"} →</em>
            </NavLink>;
          }) : <div className="hp-empty-analysis"><p>Your uploaded videos will appear here.</p><Button component={NavLink} to="/app/videos/new" variant="outlined">Upload first video</Button></div>}
        </article>
      </div>

      <div className="hp-analysis-results">
        <article className="hp-card"><div className="hp-card-title"><h3>Recent analysis results</h3><NavLink to="/app/videos">All videos</NavLink></div>
          {allAnalyses.slice(0, 4).map(({ analysis, video }) => <NavLink className="hp-result-row" key={analysis.id} to={`/app/analyses/${analysis.id}`}><span><b>{video.original_filename}</b><small>{analysis.profile_id.replaceAll("_", " ")} · {analysis.sampling_fps} FPS</small></span><Chip size="small" label={analysis.status} color={analysis.status === "completed" ? "success" : analysis.status === "failed" ? "error" : "default"} /></NavLink>)}
          {!allAnalyses.length && <p className="hp-muted">Analysis results will appear after you start a video analysis.</p>}
        </article>
        <article className="hp-card hp-analysis-help"><div className="hp-card-title"><h3>Analyze your next ride</h3></div><p>Upload a competition or training video. The analysis identifies key moments, technique, performance patterns, and supporting visual evidence.</p><Button component={NavLink} to="/app/videos/new" variant="contained" startIcon={<CloudUploadRounded />}>Upload and analyze</Button></article>
      </div>
    </section>

    <Dialog open={videoMode !== null} onClose={() => setVideoMode(null)} maxWidth="md" fullWidth slotProps={{ paper: { className: "hp-video-dialog" } }}>
      <div className="hp-video-dialog-head"><div><b>{videoMode === "after" ? "Summary video" : "Original video"}</b><small>{sourceVideo?.original_filename}</small></div><IconButton aria-label="Close video" onClick={() => setVideoMode(null)}><CloseRounded /></IconButton></div>
      <DialogContent>{activeVideo && <video key={activeVideo} src={activeVideo} crossOrigin="use-credentials" controls autoPlay playsInline preload="metadata" />}</DialogContent>
      <div className="hp-video-switch"><button className={videoMode === "before" ? "active" : ""} disabled={!beforeSrc} onClick={() => setVideoMode("before")}>Original</button><button className={videoMode === "after" ? "active" : ""} disabled={!afterSrc} onClick={() => setVideoMode("after")}>Summary</button></div>
    </Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={2200} onClose={() => setNotice("")} message={notice} />
  </>;
}
