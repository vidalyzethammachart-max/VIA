import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileImg from "../assets/profile.jpg";
import { normalizeRole, roleAtLeast } from "../lib/roles";
import { accountingService } from "../services/accountingService";
import { supabase } from "../lib/supabaseClient";
import { useAuthRole } from "../hooks/useAuthRole";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { role } = useAuthRole();

  const currentRole = normalizeRole(role);
  const canAccessFormSubmit = roleAtLeast(currentRole, "editor");
  const isAdmin = roleAtLeast(currentRole, "admin");

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
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-300 shadow-sm motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:border-[#04418b] motion-safe:hover:ring-2 motion-safe:hover:ring-[#04418b]/20 dark:border-slate-700 dark:bg-slate-900"
      >
        <img
          src={avatarUrl || ProfileImg}
          alt="profile"
          className="h-full w-full object-cover"
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <ul className="py-1 text-sm text-gray-700 dark:text-slate-200">
            <li>
              <button
                onClick={() => navigate("/profile")}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/role-requests")}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Role Requests
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Evaluation Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/my-forms")}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                My Forms
              </button>
            </li>
            {canAccessFormSubmit && (
              <li>
                <button
                  onClick={() => navigate("/form-submit")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  Submit Evaluation
                </button>
              </li>
            )}
            {isAdmin && (
              <li>
                <button
                  onClick={() => navigate("/admin")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  Admin Dashboard
                </button>
              </li>
            )}
            <hr className="my-1 dark:border-slate-700" />
            <li>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
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
