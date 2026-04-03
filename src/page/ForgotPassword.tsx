import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo_no_bg.png";
import { accountingService } from "../services/accountingService";
import AuthAlert from "../components/AuthAlert";
import {
  getPasswordResetRequestErrorMessage,
  RESET_EMAIL_COOLDOWN_MS,
} from "../utils/passwordReset";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const navigate = useNavigate();

  const isCoolingDown = cooldownUntil !== null && cooldownUntil > Date.now();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isCoolingDown) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (resetError) {
        setError(getPasswordResetRequestErrorMessage());
        return;
      }

      setCooldownUntil(Date.now() + RESET_EMAIL_COOLDOWN_MS);
      setMessage(
        "If an account exists for that email, a password reset link has been sent.",
      );

      // Best effort logging: available only when user is authenticated.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email?.toLowerCase() === normalizedEmail) {
        void accountingService
          .logActivity({
            user_id: user.id,
            action: "REQUEST_PASSWORD_RESET",
            resource: "auth",
            metadata: { email: normalizedEmail },
          })
          .catch((logError) => {
            console.error("Activity log failed:", logError);
          });
      }
    } catch {
      setError(getPasswordResetRequestErrorMessage());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9fb]">
      <div className="relative z-10 flex w-full max-w-md items-center justify-center rounded-2xl border-4 border-[#eaeef2] bg-[#ffffff] px-4 py-12 shadow-lg shadow-gray-200/50">
        <div className="relative z-10 w-full max-w-md rounded-2xl p-8 shadow-4xl backdrop-blur-lg">
          <div className="mb-4 flex justify-center p-2">
            <img src={Logo} alt="Logo" className="h-auto w-100" />
          </div>
          <div>
            <h2 className="mb-2 text-center text-2xl font-bold text-black">
              Forgot Password
            </h2>
            <p className="mb-6 text-center text-sm text-gray-500">
              Enter your email to receive a password reset link.
            </p>
          </div>

          {message && <AuthAlert variant="success" message={message} />}

          {error && <AuthAlert variant="error" message={error} />}

          {isCoolingDown && !error && (
            <AuthAlert
              variant="info"
              message="Please wait a few seconds before requesting another reset email."
            />
          )}

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="mb-1 block font-medium text-gray-600">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-500 bg-[#ffffff] px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#04418b]"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || isCoolingDown}
              className="w-full rounded-lg bg-[#04418b] py-2 font-semibold text-white disabled:opacity-50 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-[1.02] motion-safe:hover:bg-[#04416b] motion-safe:active:scale-[0.98]"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              className="w-full rounded-lg border border-gray-300 bg-transparent py-2 font-semibold text-gray-600 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-[1.02] motion-safe:hover:bg-gray-100 motion-safe:active:scale-[0.98]"
              onClick={() => navigate("/")}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
