import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileImg from "../assets/profile.jpg";
import { normalizeRole, roleAtLeast } from "../lib/roles";
import { accountingService } from "../services/accountingService";
import { supabase } from "../lib/supabaseClient";
import { useAuthRole } from "../hooks/useAuthRole";
import { useTheme } from "../theme/ThemeProvider";

function MenuIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">{children}</span>;
}

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
                className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                <MenuIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75a17.933 17.933 0 01-7.5-1.632z" />
                  </svg>
                </MenuIcon>
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/role-requests")}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                <MenuIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </MenuIcon>
                Role Requests
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/dashboard")}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                <MenuIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v18M8.25 15.75V9.75M12.75 15.75v-6M17.25 15.75v-9M21 21H3.75" />
                  </svg>
                </MenuIcon>
                Evaluation Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/my-forms")}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                <MenuIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H6.75A2.25 2.25 0 004.5 4.5v15A2.25 2.25 0 006.75 21.75h10.5A2.25 2.25 0 0019.5 19.5v-5.25z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.75v3a1.5 1.5 0 001.5 1.5h3" />
                  </svg>
                </MenuIcon>
                My Forms
              </button>
            </li>
            {canAccessFormSubmit && (
              <li>
                <button
                  onClick={() => navigate("/form-submit")}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                    isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                  }`}
                >
                  <MenuIcon>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </MenuIcon>
                  Submit Evaluation
                </button>
              </li>
            )}
            {isAdmin && (
              <li>
                <button
                  onClick={() => navigate("/admin")}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                    isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                  }`}
                >
                  <MenuIcon>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.25A.75.75 0 015.25 4.5h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zM13.5 5.25a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zM4.5 14.25a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zM13.5 14.25a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" />
                    </svg>
                  </MenuIcon>
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
                className={`flex w-full items-center gap-3 px-4 py-2 text-left ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
                }`}
              >
                <MenuIcon>
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
                </MenuIcon>
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              </button>
            </li>
            <hr className={`my-1 ${isDark ? "border-slate-700" : "border-slate-200"}`} />
            <li>
              <button
                onClick={handleLogout}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-red-600 transition ${
                  isDark ? "hover:bg-red-950/30" : "hover:bg-red-50"
                }`}
              >
                <MenuIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-7.5a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 006 21h7.5a2.25 2.25 0 002.25-2.25V15" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m0 0 3-3m-3 3 3 3" />
                  </svg>
                </MenuIcon>
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
