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
      navigate(state?.from || "/app/dashboard", { replace: true });
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  return (
    <Stack component="form" spacing={2} onSubmit={form.handleSubmit(onSubmit)}>
      <Typography color="text.secondary">Login with an approved account.</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Identity"
        autoComplete="username"
        required
        error={Boolean(form.formState.errors.identity)}
        helperText={form.formState.errors.identity?.message}
        {...form.register("identity", {
          required: "Identity is required.",
          minLength: { value: 4, message: "Identity must contain more than 3 characters." },
          maxLength: { value: 64, message: "Identity cannot exceed 64 characters." }
        })}
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
