import UploadIcon from "@mui/icons-material/Upload";
import { Alert, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { useSession } from "../../auth/session";
import { uploadVideo } from "../api";
import { videoKeys } from "../queries";

export function VideoUploadPage() {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setProgress(0);
    setFinalizing(false);
    setError(null);
  }

  async function handleUpload() {
    if (!file) {
      setError("Choose a video file first.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const video = await uploadVideo(file, session.csrfToken, (nextProgress) => {
        setProgress(nextProgress.percent);
        setFinalizing(nextProgress.percent >= 100);
      });
      await queryClient.invalidateQueries({ queryKey: videoKeys.list(session.user?.id) });
      navigate(`/app/videos/${video.id}`);
    } catch (caught) {
      setError(getErrorMessage(caught));
      setFinalizing(false);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        Upload video
      </Typography>
      <Typography color="text.secondary">
        Your original video is stored without compression or quality changes. Play it after upload and start analyzing when you are ready.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Button variant="outlined" component="label" disabled={isUploading} startIcon={<UploadIcon />}>
        Choose file
        <input hidden type="file" accept="video/*" disabled={isUploading} onChange={handleFileChange} />
      </Button>

      {file && <Typography>{file.name}</Typography>}

      {isUploading && (
        <Stack spacing={1}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography color="text.secondary">{finalizing ? "Finalizing upload" : `${progress}% uploaded`}</Typography>
        </Stack>
      )}

      <Button variant="contained" onClick={() => void handleUpload()} disabled={!file || isUploading}>
        Upload
      </Button>
    </Stack>
  );
}
