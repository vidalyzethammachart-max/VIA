import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../components/BackButton";
import MainNavbar from "../components/MainNavbar";
import profilePic from "../assets/profile.jpg";
import { supabase } from "../lib/supabaseClient";
import { accountingService } from "../services/accountingService";

type UserInfoRow = {
  user_id: string;
  email: string;
  auth_user_id: string;
  full_name: string | null;
  employee_number: string | null;
  gender: string | null;
  avatar_url: string | null;
};

const GENDER_OPTIONS = [
  { value: "male", label: "ชาย" },
  { value: "female", label: "หญิง" },
  { value: "other", label: "อื่น ๆ" },
  { value: "prefer_not_to_say", label: "ไม่ระบุ" },
];

const PROFILE_AVATAR_BUCKET = "profile-avatars";

async function resizeAvatarImage(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์รูปได้"));
      nextImage.src = imageUrl;
    });

    const maxSize = 512;
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("ไม่สามารถเตรียมรูปสำหรับอัปโหลดได้");
    }

    context.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error("ไม่สามารถย่อรูปโปรไฟล์ได้"));
          return;
        }
        resolve(result);
      }, "image/jpeg", 0.82);
    });

    return blob;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function uploadAvatarFile(authUserId: string, file: File) {
  const resizedBlob = await resizeAvatarImage(file);
  const path = `${authUserId}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(path, resizedBlob, {
      upsert: true,
      contentType: "image/jpeg",
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfoRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);

  const [editUserId, setEditUserId] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editEmployeeNumber, setEditEmployeeNumber] = useState("");
  const [editGender, setEditGender] = useState("prefer_not_to_say");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

    if (sessionErr) {
      setError(sessionErr.message);
      setLoading(false);
      return;
    }

    const user = sessionData.session?.user;
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const { data, error: userInfoErr } = await supabase
      .from("user_information")
      .select("user_id, email, auth_user_id, full_name, employee_number, gender, avatar_url")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (userInfoErr) {
      setError(userInfoErr.message);
      setLoading(false);
      return;
    }

    const currentInfo: UserInfoRow = data
      ? (data as UserInfoRow)
      : {
          user_id: user.email?.split("@")[0] || "User",
          email: user.email || "",
          auth_user_id: user.id,
          full_name: null,
          employee_number: null,
          gender: null,
          avatar_url: null,
        };

    setUserInfo(currentInfo);
    setEditUserId(currentInfo.user_id);
    setEditEmail(currentInfo.email);
    setEditFullName(currentInfo.full_name || "");
    setEditEmployeeNumber(currentInfo.employee_number || "");
    setEditGender(currentInfo.gender || "prefer_not_to_say");
    setEditAvatarUrl(currentInfo.avatar_url || "");
    setLoading(false);
  };

  useEffect(() => {
    void loadProfile();
  }, [navigate]);

  useEffect(() => {
    if (!selectedAvatarFile) {
      setLocalAvatarPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedAvatarFile);
    setLocalAvatarPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedAvatarFile]);

  const resetEditState = () => {
    setIsEditing(false);
    setShowAvatarEditor(false);
    setSelectedAvatarFile(null);
    setLocalAvatarPreview(null);
    setError(null);
    setSuccess(null);

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }

    if (userInfo) {
      setEditUserId(userInfo.user_id);
      setEditEmail(userInfo.email);
      setEditFullName(userInfo.full_name || "");
      setEditEmployeeNumber(userInfo.employee_number || "");
      setEditGender(userInfo.gender || "prefer_not_to_say");
      setEditAvatarUrl(userInfo.avatar_url || "");
    }
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("โปรดเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    setError(null);
    setSelectedAvatarFile(file);
  };

  const handleSave = async () => {
    if (!userInfo) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let nextAvatarUrl = editAvatarUrl.trim() || null;

      if (selectedAvatarFile) {
        nextAvatarUrl = await uploadAvatarFile(userInfo.auth_user_id, selectedAvatarFile);
      }

      const { error: updateTableError } = await supabase
        .from("user_information")
        .upsert(
          {
            auth_user_id: userInfo.auth_user_id,
            user_id: editUserId,
            email: editEmail,
            full_name: editFullName.trim() || null,
            employee_number: editEmployeeNumber.trim() || null,
            gender: editGender || null,
            avatar_url: nextAvatarUrl,
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

      void accountingService
        .logActivity({
          user_id: userInfo.auth_user_id,
          action: "profile.updated",
          resource: "user_information",
          metadata: {
            changed_email: editEmail !== userInfo.email,
            changed_user_id: editUserId !== userInfo.user_id,
            changed_full_name: (editFullName.trim() || null) !== userInfo.full_name,
            changed_employee_number: (editEmployeeNumber.trim() || null) !== userInfo.employee_number,
            changed_gender: (editGender || null) !== userInfo.gender,
            changed_avatar_url: nextAvatarUrl !== userInfo.avatar_url,
          },
        })
        .catch((logError) => {
          console.error("Activity log failed:", logError);
        });

      setSuccess("บันทึกข้อมูลสำเร็จ");
      setSelectedAvatarFile(null);
      setLocalAvatarPreview(null);
      setShowAvatarEditor(false);
      setIsEditing(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNavbar />
      <BackButton onBack={() => navigate(-1)} />

      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#04418b]/10 bg-white shadow-sm ring-4 ring-[#04418b]/5">
                  <img
                    src={localAvatarPreview || (isEditing ? editAvatarUrl : userInfo?.avatar_url) || profilePic}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAvatarFile) {
                        void handleSave();
                        return;
                      }
                      setShowAvatarEditor((current) => !current);
                    }}
                    disabled={saving}
                    className="ui-hover-button absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#04418b]/15 bg-white px-3 py-1.5 text-[11px] font-bold text-[#04418b]"
                  >
                    {saving
                      ? "กำลังบันทึก..."
                      : selectedAvatarFile
                        ? "ยืนยัน"
                        : showAvatarEditor
                          ? "ปิดการแก้รูป"
                          : "เปลี่ยนรูป"}
                  </button>
                )}
              </div>

              {isEditing && showAvatarEditor && (
                <div className="mb-6 w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />

                  <label className="mb-2 block text-xs font-bold uppercase tracking-tight text-slate-400">
                    รูปโปรไฟล์
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="ui-hover-button rounded-xl border border-[#04418b]/15 bg-white px-4 py-3 text-sm font-bold text-[#04418b]"
                    >
                      เลือกไฟล์รูป
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAvatarFile(null);
                        setEditAvatarUrl("");
                        if (avatarInputRef.current) {
                          avatarInputRef.current.value = "";
                        }
                      }}
                      className="ui-hover-button rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600"
                    >
                      ลบรูป
                    </button>
                  </div>

                  {selectedAvatarFile && (
                    <p className="mt-3 text-sm font-medium text-slate-600">{selectedAvatarFile.name}</p>
                  )}

                  <p className="mt-2 text-xs text-slate-400">
                    ระบบจะย่อรูปให้ก่อนอัปโหลดและใช้รูปนี้แทนรูปเดิมทันทีหลังบันทึก
                  </p>
                </div>
              )}

              <h1 className="text-xl font-bold text-slate-800">
                {loading ? "กำลังโหลด..." : userInfo?.full_name || userInfo?.user_id || "โปรไฟล์ของคุณ"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">ตั้งค่าและจัดการข้อมูลส่วนตัว</p>
            </div>

            <div className="mx-auto mt-12 w-full max-w-md">
              {error && (
                <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 rounded-xl border border-[#04418b]/10 bg-[#04418b]/5 p-4 text-center text-sm text-[#04418b]">
                  {success}
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="text-sm text-slate-500">Loading profile...</div>
                </div>
              ) : isEditing ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <InputGroup
                      label="User ID"
                      value={editUserId}
                      onChange={setEditUserId}
                      placeholder="ระบุ User ID"
                    />
                    <InputGroup
                      label="หมายเลขพนักงาน"
                      value={editEmployeeNumber}
                      onChange={setEditEmployeeNumber}
                      placeholder="ระบุหมายเลขพนักงาน"
                    />
                    <InputGroup
                      label="ชื่อ - นามสกุล"
                      value={editFullName}
                      onChange={setEditFullName}
                      placeholder="ระบุชื่อและนามสกุล"
                    />
                    <SelectGroup
                      label="เพศ"
                      value={editGender}
                      onChange={setEditGender}
                      options={GENDER_OPTIONS}
                    />
                    <InputGroup
                      label="อีเมล"
                      value={editEmail}
                      onChange={setEditEmail}
                      type="email"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="ui-hover-button w-full rounded-xl bg-[#04418b] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#04418b]/20 disabled:opacity-50"
                    >
                      {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                    </button>
                    <button
                      onClick={resetEditState}
                      disabled={saving}
                      className="ui-hover-button w-full rounded-full border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="divide-y divide-slate-100">
                    <DisplayItem label="User ID" value={userInfo?.user_id || "-"} />
                    <DisplayItem label="หมายเลขพนักงาน" value={userInfo?.employee_number || "-"} />
                    <DisplayItem label="ชื่อ - นามสกุล" value={userInfo?.full_name || "-"} />
                    <DisplayItem
                      label="เพศ"
                      value={GENDER_OPTIONS.find((option) => option.value === userInfo?.gender)?.label || "-"}
                    />
                    <DisplayItem label="อีเมล" value={userInfo?.email || "-"} />
                  </div>

                  <div className="flex flex-col items-center gap-4 pt-6">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowAvatarEditor(false);
                        setSelectedAvatarFile(null);
                        setLocalAvatarPreview(null);
                      }}
                      className="ui-hover-button flex items-center gap-2 rounded-full border border-[#04418b]/15 bg-[#04418b]/5 px-5 py-3 text-sm font-bold text-[#04418b]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
                        navigate("/", { replace: true });
                      }}
                      disabled={saving}
                      className="ui-hover-button min-w-32 rounded-full border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
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
    </div>
  );
}

function InputGroup({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-xs font-bold uppercase tracking-tight text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-transparent bg-[#F8FAFC] px-4 py-3.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300 focus:border-[#04418b]/10 focus:bg-white focus:ring-4 focus:ring-[#04418b]/5"
      />
    </div>
  );
}

function SelectGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-xs font-bold uppercase tracking-tight text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-transparent bg-[#F8FAFC] px-4 py-3.5 text-sm font-medium text-slate-700 outline-none focus:border-[#04418b]/10 focus:bg-white focus:ring-4 focus:ring-[#04418b]/5"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DisplayItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-5">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-700">{value}</span>
    </div>
  );
}
