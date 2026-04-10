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
  hasRecoveryParams,
  MIN_PASSWORD_LENGTH,
  RECOVERY_SESSION_WAIT_MS,
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
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const timeoutRef = useRef<number | null>(null);

  const isCheckingRecovery = recoveryState === "checking";
  const hasRecoverySession = recoveryState === "ready";

  useEffect(() => {
    mountedRef.current = true;

    const bootstrapRecoverySession = async () => {
      const currentUrl = new URL(window.location.href);
      const searchParams = currentUrl.searchParams;
      const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
      const isRecoveryType =
        searchParams.get("type") === "recovery" || hashParams.get("type") === "recovery";
      const authCode = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash") ?? hashParams.get("token_hash");
      const accessToken = hashParams.get("access_token") ?? searchParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") ?? searchParams.get("refresh_token");

      const clearRecoveryUrl = () => {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete("code");
        nextUrl.searchParams.delete("token_hash");
        nextUrl.searchParams.delete("type");
        nextUrl.searchParams.delete("access_token");
        nextUrl.searchParams.delete("refresh_token");
        window.history.replaceState(window.history.state, "", `${nextUrl.pathname}${nextUrl.search}`);
      };

      try {
        if (authCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(authCode);

          if (!mountedRef.current) return;
          if (!error) {
            clearRecoveryUrl();
            setRecoveryState("ready");
            setPageError("");
            return;
          }
        }

        if (isRecoveryType && tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

          if (!mountedRef.current) return;
          if (!error) {
            clearRecoveryUrl();
            setRecoveryState("ready");
            setPageError("");
            return;
          }
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!mountedRef.current) return;
          if (!error) {
            clearRecoveryUrl();
            setRecoveryState("ready");
            setPageError("");
            return;
          }
        }
      } catch {
        // Fall through to normal session checks below.
      }

      if (!hasRecoveryParams()) {
        setRecoveryState("expired");
        setPageError(t("auth.resetLinkExpired"));
        return;
      }

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
    setPageError("");

    const nextFieldErrors: {
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!password.trim()) {
      nextFieldErrors.password = t("form.fillField");
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextFieldErrors.password = t("auth.resetPasswordTooShort", {
        min: MIN_PASSWORD_LENGTH,
      });
    }

    if (!confirmPassword.trim()) {
      nextFieldErrors.confirmPassword = t("form.fillField");
    } else if (password !== confirmPassword) {
      nextFieldErrors.confirmPassword = t("auth.resetPasswordsDoNotMatch");
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      const reason =
        nextFieldErrors.confirmPassword === t("auth.resetPasswordsDoNotMatch")
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

          <form noValidate onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="mb-1 block font-medium text-gray-600 dark:text-slate-300">
                {t("auth.newPassword")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (modalError) setModalError("");
                  if (pageError && recoveryState !== "expired") setPageError("");
                  if (fieldErrors.password || fieldErrors.confirmPassword) {
                    setFieldErrors((current) => ({
                      ...current,
                      password: undefined,
                      confirmPassword:
                        current.confirmPassword === t("auth.resetPasswordsDoNotMatch")
                          ? undefined
                          : current.confirmPassword,
                    }));
                  }
                }}
                disabled={loading || !hasRecoverySession}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-black focus:outline-none focus:ring-1 dark:bg-slate-950 dark:text-white ${
                  fieldErrors.password
                    ? "border-red-400 focus:ring-red-200 dark:border-red-500/60"
                    : "border-gray-500 focus:ring-[#04418b] dark:border-slate-700"
                }`}
                placeholder={t("auth.enterNewPassword")}
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                required
              />
              {fieldErrors.password && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-600 dark:text-slate-300">
                {t("auth.confirmPassword")}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (modalError) setModalError("");
                  if (pageError && recoveryState !== "expired") setPageError("");
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((current) => ({
                      ...current,
                      confirmPassword: undefined,
                    }));
                  }
                }}
                disabled={loading || !hasRecoverySession}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-black focus:outline-none focus:ring-1 dark:bg-slate-950 dark:text-white ${
                  fieldErrors.confirmPassword
                    ? "border-red-400 focus:ring-red-200 dark:border-red-500/60"
                    : "border-gray-500 focus:ring-[#04418b] dark:border-slate-700"
                }`}
                placeholder={t("auth.confirmNewPassword")}
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                  {fieldErrors.confirmPassword}
                </p>
              )}
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
