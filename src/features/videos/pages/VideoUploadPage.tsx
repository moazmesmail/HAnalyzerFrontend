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
  const [isInspecting, setIsInspecting] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(null);
    setDuration(null);
    setProgress(0);
    setFinalizing(false);
    setError(null);

    if (!selectedFile) {
      return;
    }

    setIsInspecting(true);
    try {
      const selectedDuration = await readVideoDuration(selectedFile);
      if (selectedDuration >= 120) {
        setError("Video duration must be under 2 minutes.");
        event.target.value = "";
        return;
      }
      setFile(selectedFile);
      setDuration(selectedDuration);
    } catch {
      setError("The video duration could not be read. Choose a valid video file.");
      event.target.value = "";
    } finally {
      setIsInspecting(false);
    }
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
        Videos must be under 2 minutes. Your original file is stored without compression or quality changes.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Button variant="outlined" component="label" disabled={isUploading || isInspecting} startIcon={<UploadIcon />}>
        Choose file
        <input hidden type="file" accept="video/*" disabled={isUploading} onChange={handleFileChange} />
      </Button>

      {isInspecting && <Typography color="text.secondary">Checking video duration…</Typography>}
      {file && <Typography>{file.name} · {formatDuration(duration)}</Typography>}

      {isUploading && (
        <Stack spacing={1}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography color="text.secondary">{finalizing ? "Finalizing upload" : `${progress}% uploaded`}</Typography>
        </Stack>
      )}

      <Button variant="contained" onClick={() => void handleUpload()} disabled={!file || isUploading || isInspecting}>
        Upload
      </Button>
    </Stack>
  );
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const element = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    element.preload = "metadata";
    element.onloadedmetadata = () => {
      const duration = element.duration;
      URL.revokeObjectURL(objectUrl);
      if (Number.isFinite(duration) && duration > 0) {
        resolve(duration);
      } else {
        reject(new Error("Invalid duration"));
      }
    };
    element.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Invalid video"));
    };
    element.src = objectUrl;
  });
}

function formatDuration(seconds: number | null) {
  if (seconds == null) {
    return "Unknown duration";
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}
