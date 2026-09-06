import { LockOutlined, PersonOutlineRounded } from "@mui/icons-material";
import { Alert, Button, InputAdornment, Stack, TextField, Typography } from "@mui/material";
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
    <Stack className="hp-auth-form" component="form" spacing={2} onSubmit={form.handleSubmit(onSubmit)}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Username or email"
        placeholder="Enter your username"
        autoComplete="username"
        required
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonOutlineRounded /></InputAdornment> } }}
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
        placeholder="Enter your password"
        autoComplete="current-password"
        required
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockOutlined /></InputAdornment> } }}
        {...form.register("password", { required: true })}
      />
      <Button type="submit" variant="contained" disabled={form.formState.isSubmitting}>
        Sign in
      </Button>
      <Typography className="hp-auth-switch">New to Equestrian Centre? <RouterLink to="/register">Create an account</RouterLink></Typography>
    </Stack>
  );
}
