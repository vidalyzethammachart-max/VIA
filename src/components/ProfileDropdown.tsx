import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileImg from "../assets/profile.jpg";
import { normalizeRole, roleAtLeast } from "../lib/roles";
import { accountingService } from "../services/accountingService";
import { supabase } from "../lib/supabaseClient";
import { useAuthRole } from "../hooks/useAuthRole";
import { useTheme } from "../theme/ThemeProvider";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { role } = useAuthRole();
  const { theme, toggleTheme } = useTheme();

  const currentRole = normalizeRole(role);
  const canAccessFormSubmit = roleAtLeast(currentRole, "editor");
  const isAdmin = roleAtLeast(currentRole, "admin");
  const isDark = theme === "dark";

  const handleLogout = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      void accountingService
        .logActivity({
          user_id: user.id,
          action: "auth.logout",
          resource: "auth",
        })
        .catch((logError) => {
          console.error("Activity log failed:", logError);
        });
    }

    await supabase.auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadAvatar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAvatarUrl(null);
        return;
      }

      const { data } = await supabase
        .from("user_information")
        .select("avatar_url")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      setAvatarUrl(data?.avatar_url || null);
    };

    void loadAvatar();
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 aspect-square items-center justify-center overflow-hidden rounded-full border border-gray-300 shadow-sm motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:border-[#04418b] motion-safe:hover:ring-2 motion-safe:hover:ring-[#04418b]/20 dark:border-slate-700 dark:bg-slate-900"
      >
        <img
          src={avatarUrl || ProfileImg}
          alt="profile"
          className="block h-full w-full rounded-full object-cover object-center"
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 mt-2 w-52 rounded-lg border shadow-lg ${
            isDark
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <ul className={`py-1 text-sm ${isDark ? "text-slate-200" : "text-gray-700"}`}>
            <li>
              <button
                onClick={() => navigate("/profile")}
                className={`w-full px-4 py-2 text-left ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/role-requests")}
                className={`w-full px-4 py-2 text-left ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                Role Requests
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/dashboard")}
                className={`w-full px-4 py-2 text-left ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                Evaluation Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/my-forms")}
                className={`w-full px-4 py-2 text-left ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                My Forms
              </button>
            </li>
            {canAccessFormSubmit && (
              <li>
                <button
                  onClick={() => navigate("/form-submit")}
                  className={`w-full px-4 py-2 text-left ${
                    isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                  }`}
                >
                  Submit Evaluation
                </button>
              </li>
            )}
            {isAdmin && (
              <li>
                <button
                  onClick={() => navigate("/admin")}
                  className={`w-full px-4 py-2 text-left ${
                    isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                  }`}
                >
                  Admin Dashboard
                </button>
              </li>
            )}
            <hr className={`my-1 ${isDark ? "border-slate-700" : "border-slate-200"}`} />
            <li>
              <button
                onClick={() => {
                  toggleTheme();
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-left ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                {isDark ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v2.25M12 18.75V21M4.97 4.97l1.59 1.59M17.44 17.44l1.59 1.59M3 12h2.25M18.75 12H21M4.97 19.03l1.59-1.59M17.44 6.56l1.59-1.59M15.75 12A3.75 3.75 0 1112 8.25 3.75 3.75 0 0115.75 12z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12.79A9 9 0 1111.21 3c-.08.56-.12 1.13-.12 1.71a9 9 0 009.91 8.08z"
                    />
                  </svg>
                )}
              </button>
            </li>
            <hr className={`my-1 ${isDark ? "border-slate-700" : "border-slate-200"}`} />
            <li>
              <button
                onClick={handleLogout}
                className={`w-full px-4 py-2 text-left text-red-600 transition ${
                  isDark ? "hover:bg-red-950/30" : "hover:bg-red-50"
                }`}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
