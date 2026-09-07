import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Paper, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { useSession } from "../../auth/session";
import { attachVideo, detachVideo, getWorkspace, workspaceVideoUrl } from "../api";
import { listVideos } from "../../videos/api";
import { videoKeys } from "../../videos/queries";
import { workspaceKeys } from "../queries";

export function WorkspaceDetailPage() {
  const { workspaceId } = useParams();
  const session = useSession();
  const client = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const query = useQuery({ queryKey: workspaceKeys.detail(session.user?.id, workspaceId), queryFn: () => getWorkspace(workspaceId ?? ""), enabled: Boolean(workspaceId) });
  const videos = useQuery({ queryKey: videoKeys.list(session.user?.id), queryFn: listVideos, enabled: addOpen });
  const remove = useMutation({ mutationFn: (videoId: string) => detachVideo(workspaceId ?? "", videoId, session.csrfToken), onSuccess: () => client.invalidateQueries({ queryKey: workspaceKeys.detail(session.user?.id, workspaceId) }) });
  const add = useMutation({
    mutationFn: async () => Promise.all(selected.map((videoId) => attachVideo(workspaceId ?? "", videoId, session.csrfToken))),
    onSuccess: async () => { setAddOpen(false); setSelected([]); await client.invalidateQueries({ queryKey: workspaceKeys.detail(session.user?.id, workspaceId) }); }
  });

  return <Stack spacing={3}>
    <Button component={RouterLink} to="/app/workspaces" sx={{ alignSelf: "flex-start" }}>Back to workspaces</Button>
    {query.isLoading && <CircularProgress aria-label="Loading workspace" />}
    {query.isError && <Alert severity="error">{getErrorMessage(query.error)}</Alert>}
    {query.data && <>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><div><Typography variant="h4" component="h1">{query.data.name}</Typography><Typography color="text.secondary">{query.data.video_count} attached video{query.data.video_count === 1 ? "" : "s"}</Typography></div><Button onClick={() => setAddOpen(true)}>Add videos</Button></Stack>
      {query.data.videos.length === 0 && <Alert severity="info">This workspace has no videos. Add one from your videos page.</Alert>}
      <Stack spacing={2}>{query.data.videos.map((video) => {
        const originalSrc = workspaceVideoUrl(video.preview_asset_id ?? video.original_asset_id);
        const summary = video.analysis?.summary_video;
        const summarySrc = workspaceVideoUrl(summary?.asset_id);
        const playerSx = { width: "100%", height: "100%", objectFit: "contain", bgcolor: "black" } as const;
        return <Paper key={video.id} sx={{ p: { xs: 1.5, md: 2 } }}>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>{video.original_filename}</Typography>
              <Typography variant="caption" color="text.secondary">Uploaded {new Date(video.created_at).toLocaleString()} · {video.preparation_status}</Typography>
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2, alignItems: "start" }}>
              <Stack spacing={1} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1">Original video</Typography>
                <Box sx={{ width: "100%", aspectRatio: "16 / 9", overflow: "hidden", bgcolor: "black" }}>
                  {originalSrc ? <Box component="video" src={originalSrc} controls playsInline preload="metadata" sx={playerSx} /> : <Alert severity="warning">Video unavailable.</Alert>}
                </Box>
              </Stack>
              <Stack spacing={1} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1">Summary video</Typography>
                <Box sx={{ width: "100%", aspectRatio: "16 / 9", overflow: "hidden", bgcolor: "black" }}>
                  {summarySrc && summary?.status === "completed" ? <Box component="video" src={summarySrc} controls playsInline preload="metadata" sx={playerSx} /> : !video.analysis ? <Alert severity="info">This video has not been analyzed yet.</Alert> : !summary ? <Alert severity="info">No summary video has been created yet.</Alert> : summary.status === "failed" ? <Alert severity="error">{summary.error || "Summary video generation failed."}</Alert> : <Alert severity="info">Summary video is {summary.status}.</Alert>}
                </Box>
              </Stack>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {video.analysis && <Button component={RouterLink} to={`/app/analyses/${video.analysis.session_id}`} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>Open full analysis</Button>}
              <Button color="error" startIcon={<DeleteRoundedIcon />} onClick={() => remove.mutate(video.id)} disabled={remove.isPending} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>Remove from workspace</Button>
            </Stack>
          </Stack>
        </Paper>;
      })}</Stack>
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add existing videos</DialogTitle>
        <DialogContent>{videos.isLoading && <CircularProgress aria-label="Loading videos" />}{videos.isError && <Alert severity="error">{getErrorMessage(videos.error)}</Alert>}{videos.data?.items.filter((video) => !query.data.videos.some((attached) => attached.id === video.id)).map((video) => <FormControlLabel key={video.id} control={<Checkbox checked={selected.includes(video.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, video.id] : current.filter((id) => id !== video.id))} />} label={video.original_filename} />)}{videos.data?.items.every((video) => query.data.videos.some((attached) => attached.id === video.id)) && <Typography color="text.secondary">All uploaded videos are already attached.</Typography>}</DialogContent>
        {add.isError && <Alert severity="error" sx={{ mx: 3 }}>{getErrorMessage(add.error)}</Alert>}
        <DialogActions><Button onClick={() => setAddOpen(false)}>Cancel</Button><Button variant="contained" disabled={selected.length === 0 || add.isPending} onClick={() => add.mutate()}>Add selected</Button></DialogActions>
      </Dialog>
    </>}
  </Stack>;
}
