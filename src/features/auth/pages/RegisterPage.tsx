import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
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
    <Stack component="form" spacing={2} onSubmit={form.handleSubmit(onSubmit)}>
      <Typography color="text.secondary">Create an account. The owner must approve it before login.</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Identity"
        autoComplete="username"
        required
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
        autoComplete="new-password"
        required
        {...form.register("password", { required: true, minLength: 8 })}
      />
      <Button type="submit" variant="contained" disabled={form.formState.isSubmitting}>
        Register
      </Button>
      <Button component={RouterLink} to="/login">
        Back to login
      </Button>
    </Stack>
  );
}
