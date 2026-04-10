export const MIN_PASSWORD_LENGTH = 8;
export const RESET_EMAIL_COOLDOWN_MS = 30_000;
export const RECOVERY_SESSION_WAIT_MS = 1500;

export function hasRecoveryParams(currentUrl = new URL(window.location.href)): boolean {
  const searchParams = currentUrl.searchParams;
  const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));

  return (
    searchParams.get("type") === "recovery" ||
    hashParams.get("type") === "recovery" ||
    searchParams.has("code") ||
    searchParams.has("token_hash") ||
    hashParams.has("token_hash") ||
    (hashParams.has("access_token") && hashParams.has("refresh_token")) ||
    (searchParams.has("access_token") && searchParams.has("refresh_token"))
  );
}

export function validatePasswordReset(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return null;
}

export function getPasswordResetRequestErrorMessage(): string {
  return "Unable to send reset email right now. Please try again in a moment.";
}

export function getPasswordUpdateErrorMessage(message?: string): string {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (
    normalizedMessage.includes("session_not_found") ||
    normalizedMessage.includes("session expired") ||
    normalizedMessage.includes("jwt expired") ||
    normalizedMessage.includes("invalid refresh token")
  ) {
    return "This reset link is invalid or expired. Request a new password reset email.";
  }

  if (normalizedMessage.includes("same password")) {
    return "Choose a new password that is different from your current password.";
  }

  if (normalizedMessage.includes("password")) {
    return message ?? "Unable to update password. Please check your password requirements.";
  }

  return "Unable to update password right now. Please try requesting a new reset link.";
}
