import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ปุ่มรูปโปรไฟล์ */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 overflow-hidden hover:ring-2 hover:ring-blue-500 transition"
      >
        <img
          src="https://i.pravatar.cc/100"
          alt="profile"
          className="w-full h-full object-cover"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <ul className="py-1 text-sm text-gray-700">
            <li>
              <button onClick={() => navigate("/profile")} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                👤 โปรไฟล์
              </button>
            </li>
            <li>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                ⚙️ ตั้งค่า
              </button>
            </li>
            <li>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                📄 เอกสารของฉัน
              </button>
            </li>
            <li>
              <button onClick={() => navigate("/dashboard")} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                📊 Dashboard
              </button>
            </li>
            <hr className="my-1" />
            <li>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
              >
                🚪 ออกจากระบบ
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
