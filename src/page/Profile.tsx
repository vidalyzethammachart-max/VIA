import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import profilePic from "../assets/profile.jpg";

type UserInfoRow = {
  user_id: string;
  email: string;
  auth_user_id: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfoRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState("");
  const [editEmail, setEditEmail] = useState("");

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

    let currentInfo: UserInfoRow;
    if (data) {
      currentInfo = data as UserInfoRow;
    } else {
      currentInfo = {
        user_id: user.email?.split("@")[0] || "User",
        email: user.email || "",
        auth_user_id: user.id,
      };
    }

    setUserInfo(currentInfo);
    setEditUserId(currentInfo.user_id);
    setEditEmail(currentInfo.email);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [navigate]);

  const handleSave = async () => {
    if (!userInfo) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateTableError } = await supabase
        .from("user_information")
        .upsert(
          {
            auth_user_id: userInfo.auth_user_id,
            user_id: editUserId,
            email: editEmail,
          },
          { onConflict: "auth_user_id" },
        );

      if (updateTableError) throw updateTableError;

      if (editEmail !== userInfo.email) {
        const { error: updateEmailError } = await supabase.auth.updateUser({
          email: editEmail,
        });
        if (updateEmailError) throw updateEmailError;
      }

      setSuccess(
        "อัปเดตข้อมูลสำเร็จ! (หากเปลี่ยนอีเมล กรุณาตรวจสอบลิงก์ยืนยันในอีเมลใหม่)",
      );
      setIsEditing(false);
      await loadProfile();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            disabled={saving}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-medium">กลับ</span>
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-100/50 space-y-12">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full border-2 border-[#04418b]/10 overflow-hidden bg-white shadow-sm ring-4 ring-[#04418b]/5">
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-800">
              {loading ? "กำลังโหลด..." : userInfo?.user_id || "โปรไฟล์ของคุณ"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              ตั้งค่าและจัดการข้อมูลส่วนตัว
            </p>
          </div>

          {/* Content Area */}
          <div className="max-w-md mx-auto w-full">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm text-center border border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 rounded-xl bg-[#04418b]/5 text-[#04418b] text-sm text-center border border-[#04418b]/10 animate-fade-in">
                {success}
              </div>
            )}

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-[#04418b] rounded-full animate-spin"></div>
              </div>
            ) : isEditing ? (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-4">
                  <InputGroup
                    label="User ID"
                    value={editUserId}
                    onChange={setEditUserId}
                    placeholder="ระบุ User ID"
                  />
                  <InputGroup
                    label="อีเมล"
                    value={editEmail}
                    onChange={setEditEmail}
                    type="email"
                    placeholder="example@email.com"
                  />
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3.5 bg-[#04418b] text-white rounded-xl font-bold text-sm hover:bg-[#03326a] transition-all shadow-lg shadow-[#04418b]/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setError(null);
                      setSuccess(null);
                      if (userInfo) {
                        setEditUserId(userInfo.user_id);
                        setEditEmail(userInfo.email);
                      }
                    }}
                    disabled={saving}
                    className="w-full py-3 text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                <div className="divide-y divide-slate-100">
                  <DisplayItem
                    label="User ID"
                    value={userInfo?.user_id || "-"}
                  />
                  <DisplayItem label="อีเมล" value={userInfo?.email || "-"} />
                </div>

                <div className="pt-6 flex flex-col items-center gap-8">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm font-bold text-[#04418b] hover:text-[#03326a] transition-colors group"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <span>แก้ไขข้อมูลโปรไฟล์</span>
                  </button>

                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/login", { replace: true });
                    }}
                    disabled={saving}
                    className="text-xs font-bold text-slate-300 hover:text-red-400 uppercase tracking-widest transition-colors"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGroup({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-tight">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#F8FAFC] border-2 border-transparent rounded-xl px-4 py-3.5 text-slate-700 font-medium text-sm focus:bg-white focus:border-[#04418b]/10 focus:ring-4 focus:ring-[#04418b]/5 outline-none transition-all placeholder:text-slate-300"
      />
    </div>
  );
}

function DisplayItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-5 flex justify-between items-center group">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-700">{value}</span>
    </div>
  );
}
