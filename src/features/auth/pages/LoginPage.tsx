import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { defaultAuthValues, type AuthFormValues } from "../forms";
import { useSession } from "../session";

type LocationState = {
  from?: string;
};

export function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [error, setError] = useState<string | null>(null);
  const form = useForm<AuthFormValues>({ defaultValues: defaultAuthValues });

  async function onSubmit(values: AuthFormValues) {
    setError(null);

    try {
      await session.login(values);
      navigate(state?.from || "/app/videos", { replace: true });
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  return (
    <Stack component="form" spacing={2} onSubmit={form.handleSubmit(onSubmit)}>
      <Typography color="text.secondary">Login with an approved account.</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        required
        {...form.register("email", { required: true })}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        {...form.register("password", { required: true })}
      />
      <Button type="submit" variant="contained" disabled={form.formState.isSubmitting}>
        Login
      </Button>
      <Button component={RouterLink} to="/register">
        Create account
      </Button>
    </Stack>
  );
}
