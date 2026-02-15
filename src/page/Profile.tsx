import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type UserInfoRow = {
  user_id: string;
  email: string;
  auth_user_id: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfoRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      if (sessionErr) {
        setError(sessionErr.message);
        setLoading(false);
        return;
      }

      const user = sessionData.session?.user;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      // ดึงข้อมูลจากตาราง user_information
      const { data, error: userInfoErr } = await supabase
        .from("user_information")
        .select("user_id, email, auth_user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (userInfoErr) {
        setError(userInfoErr.message);
        setLoading(false);
        return;
      }

      if (data) {
        setUserInfo(data as UserInfoRow);
      } else {
        setError("ไม่พบข้อมูลผู้ใช้ในระบบ");
      }

      setLoading(false);
    };

    loadProfile();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-[#04418b] text-white shadow">
        <div className="max-w-5xl px-6 py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/10 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm">กลับ</span>
            </button>

            {/* <div>
              <h1 className="text-xl font-semibold">ข้อมูลโปรไฟล์</h1>
              <p className="text-sm opacity-90">Profile Information</p>
            </div> */}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="bg-[#04418b]/10 px-6 py-4 border-b">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-[#04418b] bg-[#04418b] flex items-center justify-center text-white text-2xl font-bold">
                {loading ? "..." : (userInfo?.user_id ? String(userInfo.user_id).charAt(0).toUpperCase() : "U")}
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#04418b] truncate">
                  {loading ? "กำลังโหลด..." : userInfo?.user_id || "ไม่ระบุชื่อ"}
                </h2>
                <p className="text-sm text-gray-500 truncate">
                  อีเมล: {userInfo?.email || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-gray-600">กำลังดึงข้อมูลจากระบบ...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Item label="User ID" value={userInfo?.user_id || "-"} />
                <Item label="อีเมล" value={userInfo?.email || "-"} />
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/login", { replace: true });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              ออกจากระบบ
            </button>

            <button
              onClick={() => alert("สามารถต่อยอดเป็นหน้าแก้ไขข้อมูลได้")}
              className="px-4 py-2 bg-[#04418b] text-white rounded-md hover:bg-[#03326a]"
            >
              แก้ไขข้อมูล
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-base font-medium text-gray-800 break-words">{value}</p>
    </div>
  );
}
