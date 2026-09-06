import { LockOutlined, PersonOutlineRounded } from "@mui/icons-material";
import { Alert, Button, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../../shared/api/errors";
import { registerUser } from "../api";
import { defaultAuthValues, type AuthFormValues } from "../forms";

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<AuthFormValues>({ defaultValues: defaultAuthValues });

  async function onSubmit(values: AuthFormValues) {
    setError(null);

    try {
      await registerUser(values);
      form.reset(defaultAuthValues);
      navigate("/registration-pending");
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  return (
    <Stack className="hp-auth-form" component="form" spacing={2} onSubmit={form.handleSubmit(onSubmit)}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Username or email"
        placeholder="Choose your username"
        autoComplete="username"
        required
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonOutlineRounded /></InputAdornment> } }}
        error={Boolean(form.formState.errors.identity)}
        helperText={form.formState.errors.identity?.message || "Use at least 4 characters."}
        {...form.register("identity", {
          required: "Identity is required.",
          validate: (value) => value.trim().length > 3 || "Identity must contain more than 3 characters.",
          maxLength: { value: 64, message: "Identity cannot exceed 64 characters." }
        })}
      />
      <TextField
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        required
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockOutlined /></InputAdornment> } }}
        {...form.register("password", { required: true, minLength: 8 })}
      />
      <Button type="submit" variant="contained" disabled={form.formState.isSubmitting}>
        Create account
      </Button>
      <Typography className="hp-auth-note">Accounts are reviewed by the Horse Park team before access is granted.</Typography>
      <Typography className="hp-auth-switch">Already have an account? <RouterLink to="/login">Sign in</RouterLink></Typography>
    </Stack>
  );
}
