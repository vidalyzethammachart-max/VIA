import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

import Logo from "../assets/logo_no_bg.png";

// ─── Wrapper อยู่นอก Register เพื่อป้องกัน remount ทุก render ───────────────
function RegisterWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#f7f9fb]">
      <div className="relative z-10 flex items-center justify-center w-full px-4 py-12 max-w-md rounded-2xl bg-[#ffffff] border-4 border-[#eaeef2] shadow-lg shadow-gray-200/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md backdrop-blur-lg p-8 rounded-2xl"
        >
          <div className="flex justify-center p-2">
            <img src={Logo} alt="Logo" className="w-100 h-auto" />
          </div>
          <h2 className="text-2xl font-bold text-center text-black mb-6">
            VIDEO INTELLIGENCE &amp; ANALYTICS
          </h2>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default function Register() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("รหัสผ่านไม่ตรงกัน");
      return;
    }

    // สมัครสมาชิก
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // บันทึกข้อมูลลงตาราง user_information
    if (data.user) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { error: insertError } = await supabase
        .from("user_information")
        .upsert(
          {
            auth_user_id: data.user.id,
            user_id: userId,
            email: email,
          },
          { onConflict: "auth_user_id" },
        );

      if (insertError) {
        console.error("❌ Data Insertion Error:", insertError);
        setErrorMsg(
          `สมัครสมาชิกสำเร็จแต่ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้: ${insertError.message}`,
        );
        return;
      }
      console.log("✅ User data saved successfully!");
    }

    // Sign out เพื่อเคลียร์ session ที่ Supabase สร้างอัตโนมัติ
    // ผู้ใช้จะต้อง Login ด้วยตัวเองจากหน้า Login
    await supabase.auth.signOut();

    setRegistered(true);
  };

  // ─── Success Screen ──────────────────────────────────────────────────────────
  if (registered) {
    return (
      <RegisterWrapper>
        <AnimatePresence>
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-5 text-center"
          >
            {/* ไอคอนวงกลมติ๊กถูก */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1a5fb4]/10 border-4 border-[#1a5fb4]/30">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1a5fb4"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <div className="space-y-1">
              <p className="text-xl font-bold text-slate-900">
                สมัครสมาชิกเรียบร้อยแล้ว!
              </p>
              <p className="text-sm text-slate-500">
                {needsVerification
                  ? "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ"
                  : "บัญชีของคุณพร้อมใช้งานแล้ว"}
              </p>
            </div>

            {needsVerification && (
              <div className="w-full rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  เราได้ส่งอีเมลยืนยันไปที่{" "}
                  <span className="font-semibold">{email}</span>{" "}
                  กรุณาตรวจสอบกล่องจดหมายและกดลิงก์ยืนยันก่อนเข้าสู่ระบบ
                </p>
              </div>
            )}

            <Link
              to="/"
              className="mt-2 w-full inline-block text-center bg-[#1a5fb4] hover:bg-[#04416b] text-white py-2.5 rounded-lg font-semibold transition"
            >
              ไปหน้า Login
            </Link>
          </motion.div>
        </AnimatePresence>
      </RegisterWrapper>
    );
  }

  // ─── Register Form ───────────────────────────────────────────────────────────
  return (
    <RegisterWrapper>
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="block text-gray-600 mb-1 font-medium">
            User ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-2 bg-[#ffffff] text-black border border-gray-500 rounded-lg focus:ring-1 focus:ring-[#04418b] focus:outline-none"
            placeholder="Enter your User ID"
            required
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1 font-medium">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-[#ffffff] text-black border border-gray-500 rounded-lg focus:ring-1 focus:ring-[#04418b] focus:outline-none"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block text-gray-600 mb-1 font-medium">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-[#ffffff] text-black border border-gray-500 rounded-lg focus:ring-1 focus:ring-[#04418b] focus:outline-none"
            placeholder="Enter your password"
            required
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="block text-gray-600 mb-1 font-medium">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            className="w-full px-4 py-2 bg-[#ffffff] text-black border border-gray-500 rounded-lg focus:ring-1 focus:ring-[#04418b] focus:outline-none"
            placeholder="Enter your confirm password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-xs leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-[#1a5fb4] hover:bg-[#04416b] text-white py-2 rounded-lg font-semibold transition"
        >
          Register
        </button>
      </form>
      <p className="text-gray-600 mt-4 text-center text-sm">
        มีบัญชีแล้ว? <Link to="/">ไปหน้า Login</Link>
      </p>
    </RegisterWrapper>
  );
}

