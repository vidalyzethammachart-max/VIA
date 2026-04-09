import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo_no_bg.png";
import { accountingService } from "../services/accountingService";
import AuthAlert from "../components/AuthAlert";
import AuthModal from "../components/AuthModal";
import AuthPageControls from "../components/AuthPageControls";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  getPasswordUpdateErrorMessage,
  MIN_PASSWORD_LENGTH,
  RECOVERY_SESSION_WAIT_MS,
  validatePasswordReset,
} from "../utils/passwordReset";

type RecoveryState = "checking" | "ready" | "expired";

export default function ResetPassword() {
  const { t } = useLanguage();
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
        setPageError(t("auth.resetLinkExpired"));
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
  }, [t]);

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
      const reason = validationMessage.includes("match") ? "password_mismatch" : "weak_password";
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

      setMessage(t("auth.resetSuccess"));

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9fb] dark:bg-slate-950">
      <AuthPageControls />
      {modalError && <AuthModal message={modalError} onClose={() => setModalError("")} />}

      <div className="relative z-10 flex w-full max-w-md items-center justify-center rounded-2xl border-4 border-[#eaeef2] bg-white px-4 py-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative z-10 w-full max-w-md rounded-2xl p-8 backdrop-blur-lg">
          <div className="mb-4 flex justify-center p-2">
            <img src={Logo} alt="Logo" className="h-auto w-100" />
          </div>
          <div>
            <h2 className="mb-2 text-center text-2xl font-bold text-black dark:text-white">
              {t("auth.resetPasswordTitle")}
            </h2>
            <p className="mb-6 text-center text-sm text-gray-500 dark:text-slate-400">
              {t("auth.resetPasswordSubtitle")}
            </p>
          </div>

          {message && <AuthAlert variant="success" message={message} />}
          {pageError && <AuthAlert variant="error" message={pageError} />}
          {isCheckingRecovery && <AuthAlert variant="info" message={t("auth.resetLinkChecking")} />}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="mb-1 block font-medium text-gray-600 dark:text-slate-300">
                {t("auth.newPassword")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !hasRecoverySession}
                className="w-full rounded-lg border border-gray-500 bg-white px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#04418b] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder={t("auth.enterNewPassword")}
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-600 dark:text-slate-300">
                {t("auth.confirmPassword")}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || !hasRecoverySession}
                className="w-full rounded-lg border border-gray-500 bg-white px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#04418b] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder={t("auth.confirmNewPassword")}
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!message || !hasRecoverySession}
              className="btn-primary w-full rounded-lg py-2 disabled:opacity-50"
            >
              {loading ? t("auth.updating") : t("auth.updatePassword")}
            </button>

            {recoveryState === "expired" && (
              <button
                type="button"
                className="btn-secondary w-full rounded-lg py-2"
                onClick={() => navigate("/forgot-password")}
              >
                {t("auth.requestNewResetLink")}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
