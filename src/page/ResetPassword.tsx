import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo_no_bg.png";
import { accountingService } from "../services/accountingService";
import AuthAlert from "../components/AuthAlert";
import AuthModal from "../components/AuthModal";
import {
  getPasswordUpdateErrorMessage,
  MIN_PASSWORD_LENGTH,
  RECOVERY_SESSION_WAIT_MS,
  validatePasswordReset,
} from "../utils/passwordReset";

type RecoveryState = "checking" | "ready" | "expired";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [modalError, setModalError] = useState("");
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const timeoutRef = useRef<number | null>(null);

  const isCheckingRecovery = recoveryState === "checking";
  const hasRecoverySession = recoveryState === "ready";

  useEffect(() => {
    mountedRef.current = true;

    const bootstrapRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mountedRef.current) return;

      if (session) {
        setRecoveryState("ready");
        setPageError("");
        return;
      }

      timeoutRef.current = window.setTimeout(async () => {
        const {
          data: { session: delayedSession },
        } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (delayedSession) {
          setRecoveryState("ready");
          setPageError("");
          return;
        }

        setRecoveryState("expired");
        setPageError("This reset link is invalid or expired. Request a new password reset email.");
      }, RECOVERY_SESSION_WAIT_MS);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setRecoveryState(session ? "ready" : "expired");
        setPageError("");
      }
    });

    void bootstrapRecoverySession();

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logResetFailed = async (reason: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    void accountingService
      .logActivity({
        user_id: user.id,
        action: "RESET_PASSWORD_FAILED",
        resource: "auth",
        metadata: { reason },
      })
      .catch((logError) => {
        console.error("Activity log failed:", logError);
      });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !hasRecoverySession) return;

    setMessage("");
    setModalError("");

    const validationMessage = validatePasswordReset(password, confirmPassword);
    if (validationMessage) {
      setModalError(validationMessage);
      const reason = validationMessage.includes("match")
        ? "password_mismatch"
        : "weak_password";
      await logResetFailed(reason);
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (updateError) {
        const safeMessage = getPasswordUpdateErrorMessage(updateError.message);
        setModalError(safeMessage);

        if (user) {
          void accountingService
            .logActivity({
              user_id: user.id,
              action: "RESET_PASSWORD_FAILED",
              resource: "auth",
              metadata: { reason: updateError.message },
            })
            .catch((logError) => {
              console.error("Activity log failed:", logError);
            });
        }
        return;
      }

      if (user) {
        void accountingService
          .logActivity({
            user_id: user.id,
            action: "RESET_PASSWORD_SUCCESS",
            resource: "auth",
          })
          .catch((logError) => {
            console.error("Activity log failed:", logError);
          });
      }

      setMessage("Password updated successfully. Redirecting to login...");

      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/", { replace: true });
      }, 1600);
    } catch {
      setModalError(getPasswordUpdateErrorMessage());
      await logResetFailed("unknown_error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9fb]">
      {modalError && (
        <AuthModal
          message={modalError}
          onClose={() => setModalError("")}
        />
      )}

      <div className="relative z-10 flex w-full max-w-md items-center justify-center rounded-2xl border-4 border-[#eaeef2] bg-[#ffffff] px-4 py-12 shadow-lg shadow-gray-200/50">
        <div className="relative z-10 w-full max-w-md rounded-2xl p-8 shadow-4xl backdrop-blur-lg">
          <div className="mb-4 flex justify-center p-2">
            <img src={Logo} alt="Logo" className="h-auto w-100" />
          </div>
          <div>
            <h2 className="mb-2 text-center text-2xl font-bold text-black">
              Reset Password
            </h2>
            <p className="mb-6 text-center text-sm text-gray-500">
              Set your new password.
            </p>
          </div>

          {message && <AuthAlert variant="success" message={message} />}

          {pageError && <AuthAlert variant="error" message={pageError} />}

          {isCheckingRecovery && (
            <AuthAlert
              variant="info"
              message="Verifying your reset link. This can take a moment."
            />
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="mb-1 block font-medium text-gray-600">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !hasRecoverySession}
                className="w-full rounded-lg border border-gray-500 bg-[#ffffff] px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#04418b]"
                placeholder="Enter new password"
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-600">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || !hasRecoverySession}
                className="w-full rounded-lg border border-gray-500 bg-[#ffffff] px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#04418b]"
                placeholder="Confirm new password"
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!message || !hasRecoverySession}
              className="w-full rounded-lg bg-[#04418b] py-2 font-semibold text-white disabled:opacity-50 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-[1.02] motion-safe:hover:bg-[#04416b] motion-safe:active:scale-[0.98]"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

            {recoveryState === "expired" && (
              <button
                type="button"
                className="w-full rounded-lg border border-gray-300 bg-transparent py-2 font-semibold text-gray-600 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-[1.02] motion-safe:hover:bg-gray-100 motion-safe:active:scale-[0.98]"
                onClick={() => navigate("/forgot-password")}
              >
                Request New Reset Link
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
