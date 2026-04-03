import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { accountingService } from "../services/accountingService";
import { getUserRole } from "../hooks/useAuthRole";
import { normalizeRole, roleAtLeast } from "../lib/roles";

import Logo from "../assets/logo_no_bg.png";

const INVALID_LOGIN_MESSAGE =
  "Your email or password are incorrect. Please try again!";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(INVALID_LOGIN_MESSAGE);
      setLoading(false);
      return;
    }

    if (data.user) {
      const role = normalizeRole(await getUserRole(data.user.id).catch((roleError) => {
        console.error("Failed to load role after login:", roleError);
        return "user";
      }));

      void accountingService
        .logActivity({
          user_id: data.user.id,
          action: "auth.login_success",
          resource: "auth",
        })
        .catch((logError) => {
          console.error("Activity log failed:", logError);
        });

      setLoading(false);

      if (roleAtLeast(role, "admin")) {
        navigate("/admin", { replace: true });
        return;
      }

      if (roleAtLeast(role, "editor")) {
        navigate("/form-submit", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
      return;
    }

    setLoading(false);
    navigate("/dashboard", { replace: true });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/register");
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9fb]">
      <div className="relative z-10 flex w-full max-w-md items-center justify-center rounded-2xl border-4 border-[#eaeef2] bg-[#ffffff] px-4 py-12 shadow-lg shadow-gray-200/50">
        <div className="relative z-10 w-full max-w-md rounded-2xl p-8 shadow-4xl backdrop-blur-lg">
          <div className="flex justify-center p-2">
            <img src={Logo} alt="Logo" className="h-auto w-100" />
          </div>
          <div>
            <h2 className="mb-6 text-center text-2xl font-bold text-black">
              VIDEO INTELLIGENCE &amp; ANALYTICS
            </h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1 block font-medium text-gray-600">E-mail</label>
              <input
                type="text"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-500 bg-[#ffffff] px-4 py-2 text-black focus:outline-none focus:ring-1 focus:ring-[#04418b] disabled:opacity-70"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-gray-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={loading}
                className={`w-full rounded-lg border bg-[#ffffff] px-4 py-2 text-black focus:outline-none focus:ring-1 disabled:opacity-70 ${
                  errorMessage
                    ? "border-red-300 bg-red-50 focus:ring-red-200"
                    : "border-gray-500 focus:ring-[#04418b]"
                }`}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              {errorMessage && (
                <div
                  className="mt-2 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600"
                  role="alert"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10A8 8 0 114.343 4.343 8 8 0 0118 10zm-8.75-3.5a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm0 6.5a.75.75 0 011.5 0V13a.75.75 0 01-1.5 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#04418b] py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-[1.02] motion-safe:hover:bg-[#04416b] motion-safe:active:scale-[0.98]"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              disabled={loading}
              className="w-full rounded-lg bg-[#1a5fb4] py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-[1.02] motion-safe:hover:bg-[#04416b] motion-safe:active:scale-[0.98]"
              onClick={handleRegister}
            >
              Register
            </button>
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                disabled={loading}
                className="text-sm font-medium text-[#04418b] disabled:opacity-60 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:text-[#04416b]"
              >
                ลืมรหัสผ่านใช่หรือไม่?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
