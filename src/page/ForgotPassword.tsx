import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo_no_bg.png";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย");
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการดำเนินการ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#f7f9fb]">
      <div className="relative z-10 flex items-center justify-center w-full px-4 py-12 max-w-md rounded-2xl bg-[#ffffff] border-4 border-[#eaeef2] shadow-lg shadow-gray-200/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md backdrop-blur-lg p-8 rounded-2xl shadow-4xl"
        >
          <div className="flex justify-center p-2 mb-4">
            <img src={Logo} alt="Logo" className="w-100 h-auto" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-center text-black mb-2">
              ลืมรหัสผ่าน
            </h2>
            <p className="text-sm text-center text-gray-500 mb-6">
              ระบุอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
            </p>
          </div>

          {message && (
            <div className="mb-4 text-sm text-green-700 bg-green-100 p-3 rounded-lg border border-green-200 text-center">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded-lg border border-red-200 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-5">
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
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#04418b] hover:bg-[#04416b] text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? "กำลังส่งข้อมูล..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
            </button>
            <button
              type="button"
              className="w-full bg-transparent hover:bg-gray-100 text-gray-600 border border-gray-300 py-2 rounded-lg font-semibold transition"
              onClick={() => navigate("/")}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
