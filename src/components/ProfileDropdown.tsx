import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileImg from "../assets/profile.jpg";
import { normalizeRole, roleAtLeast } from "../lib/roles";
import { accountingService } from "../services/accountingService";
import { supabase } from "../lib/supabaseClient";
import { useAuthRole } from "../hooks/useAuthRole";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-300"
      >
        <img
          src={ProfileImg}
          alt="profile"
          className="h-full w-full object-cover"
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-gray-200 bg-white shadow-lg">
          <ul className="py-1 text-sm text-gray-700">
            <li>
              <button
                onClick={() => navigate("/profile")}
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/role-requests")}
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                Role Requests
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                Evaluation Dashboard
              </button>
            </li>
            {canAccessFormSubmit && (
              <li>
                <button
                  onClick={() => navigate("/form-submit")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  Submit Evaluation
                </button>
              </li>
            )}
            {isAdmin && (
              <li>
                <button
                  onClick={() => navigate("/admin")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  Admin Dashboard
                </button>
              </li>
            )}
            <hr className="my-1" />
            <li>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
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
